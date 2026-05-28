import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recordActivity } from "@/lib/activity";
import { hasSupabaseAdminConfig, hasSupabaseConfig } from "@/lib/env";
import { getCurrentProfile, requireProfile, requireRole } from "@/lib/session";
import type { Announcement, Community, Event, FriendAttendance, Notification, Poll, Post, Profile } from "@/lib/types";
import type { EventListItem, ParticipantRow, PostListItem } from "@/lib/view-types";
import { getAdminStats, getAdminUsers, getProductionReadinessChecks } from "@/features/admin/queries";
import { getFriendsData as getFriendsFeatureData } from "@/features/friends/queries";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function signedAssetUrl(
  bucket: "avatars" | "community-images",
  path?: string | null,
) {
  if (!path || !hasSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 15);

  return data?.signedUrl ?? null;
}

export async function getAcceptedFriendIds(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("friendships")
    .select("requester_id,receiver_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

  return (data ?? []).map((friendship: { requester_id: string; receiver_id: string }) =>
    friendship.requester_id === userId ? friendship.receiver_id : friendship.requester_id,
  );
}

export async function getUnreadNotificationCount(userId?: string | null) {
  if (!userId || !hasSupabaseConfig()) {
    return 0;
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return count ?? 0;
}

export async function getHomeData() {
  if (!hasSupabaseConfig()) {
    return {
      configured: false,
      profile: null,
      todayCount: 0,
      participantCount: 0,
      weekPostCount: 0,
      events: [],
      posts: [],
      communities: [],
      announcements: [],
      polls: [],
      recommendations: [],
      friendAttendanceByEvent: new Map<string, FriendAttendance[]>(),
      liveCards: [
        "Bugün henüz sakin.",
        "İlk gönderiyi sen paylaş.",
        "İlk etkinliği sen öner.",
        "Topluluklar hareketlenmeye hazır.",
      ],
    };
  }

  const supabase = await createClient();
  const today = todayISO();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const [
    profile,
    todayCountResult,
    eventsResult,
    communitiesResult,
    postsResult,
    weekPostCountResult,
    announcementsResult,
    pollsResult,
    summaryResult,
  ] = await Promise.all([
    getCurrentProfile(),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("event_date", today),
    supabase
      .from("events")
      .select("*, communities(name, slug), event_participants(count)")
      .eq("status", "approved")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(6),
    supabase
      .from("communities")
      .select("*, community_members(count), community_followers(count), posts(count), events(count)")
      .eq("status", "approved")
      .eq("is_suspended", false)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("posts")
      .select("*, profiles(first_name,last_name,avatar_path,username,tag), communities(name,slug), comments(id), post_votes(direction,user_id)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", weekStart.toISOString()),
    supabase
      .from("announcements")
      .select("*, profiles(first_name,last_name,username,tag)")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("polls")
      .select("*, poll_options(id,label,poll_votes(id))")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("home_summary_view")
      .select("*")
      .maybeSingle(),
  ]);
  const todayCount = todayCountResult.count ?? 0;
  const events = eventsResult.data ?? [];
  const communities = communitiesResult.data ?? [];
  const posts = postsResult.data ?? [];
  const weekPostCount = weekPostCountResult.count ?? 0;
  const announcements = announcementsResult.data ?? [];
  const polls = pollsResult.data ?? [];
  const summary = summaryResult.data;

  const friendAttendanceByEvent = new Map<string, FriendAttendance[]>();

  if (profile && events?.length) {
    const eventIds = events.map((event: Event) => event.id);
    const friendIds = await getAcceptedFriendIds(profile.id);

    if (friendIds.length) {
      const { data: rows } = await supabase
        .from("event_participants")
        .select("event_id, profiles(id,first_name,last_name,avatar_path)")
        .in("event_id", eventIds)
        .in("user_id", friendIds);

      const typedRows = (rows ?? []) as unknown as {
        event_id: string;
        profiles: FriendAttendance | FriendAttendance[] | null;
      }[];

      typedRows.forEach((row) => {
          const friend = Array.isArray(row.profiles)
            ? row.profiles[0]
            : row.profiles;

          if (!friend) {
            return;
          }

          const next = friendAttendanceByEvent.get(row.event_id) ?? [];
          next.push(friend);
          friendAttendanceByEvent.set(row.event_id, next);
        });
    }
  }

  const latestCommunity = Array.isArray(posts) && posts[0]?.communities?.name
    ? `${posts[0].communities.name} yeni duyuru paylaştı`
    : "Henüz yeni duyuru yok";
  const firstEvent = Array.isArray(events) && events[0]?.event_date === today
    ? "Etkinlik bugün başlıyor"
    : "Yakında etkinlik yok";

  const summaryRow = summary as
    | {
        today_event_count?: number | null;
        participant_count?: number | null;
        week_post_count?: number | null;
      }
    | null;
  const computedParticipantCount = (events ?? []).reduce(
    (sum: number, event: any) =>
      sum + (event.participant_count ?? event.event_participants?.[0]?.count ?? 0),
    0,
  );

  return {
    configured: true,
    profile,
    todayCount: summaryRow?.today_event_count ?? todayCount ?? 0,
    participantCount: summaryRow?.participant_count ?? computedParticipantCount,
    weekPostCount: summaryRow?.week_post_count ?? weekPostCount ?? (posts?.length ?? 0),
    events: events ?? [],
    posts: [...(posts ?? [])].sort(
      (a: any, b: any) => (b.popularity_score ?? 0) - (a.popularity_score ?? 0),
    ),
    communities: [...(communities ?? [])].sort(
      (a: any, b: any) => (b.trend_score ?? 0) - (a.trend_score ?? 0),
    ),
    announcements: (announcements ?? []) as Announcement[],
    polls: (polls ?? []) as Poll[],
    recommendations: getInterestRecommendations(profile, events ?? [], posts ?? []),
    friendAttendanceByEvent,
    liveCards: [
      todayCount ? `Bugün okulda ${todayCount} etkinlik var` : "Bugün henüz sakin.",
      latestCommunity,
      events?.length ? `${events.length} etkinlik yaklaşıyor` : "İlk etkinliği sen öner.",
      firstEvent,
    ],
  };
}

function getInterestRecommendations(profile: Profile | null, events: unknown[], posts: unknown[]) {
  const interests = (profile?.interests ?? []).map((item) => item.toLocaleLowerCase("tr"));

  if (!interests.length) {
    return [];
  }

  return [...events, ...posts].filter((item) => {
    const text = JSON.stringify(item).toLocaleLowerCase("tr");

    return interests.some((interest) => text.includes(interest));
  }).slice(0, 4);
}

export async function getCommunitiesData(query = "") {
  if (!hasSupabaseConfig()) {
    return { profile: null, communities: [], ownCommunities: [], ownEvents: [] };
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  if (query) {
    await recordActivity({
      action: "search",
      targetType: "search",
      searchQuery: query,
      path: "/communities",
      metadata: { scope: "communities" },
    });
  }

  let request = supabase
    .from("communities")
    .select("*, community_members(count), community_followers(count), posts(count), events(count)")
    .eq("status", "approved")
    .eq("is_suspended", false)
    .order("created_at", { ascending: false });
  if (query) {
    request = request.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  }
  const { data } = await request;
  const { data: ownCommunities } = profile
    ? await supabase
        .from("communities")
        .select("*, community_members(count), posts(count), events(count)")
        .eq("created_by", profile.id)
        .neq("status", "approved")
        .order("created_at", { ascending: false })
    : { data: [] };
  const { data: ownEvents } = profile
    ? await supabase
        .from("events")
        .select("*, communities(name,slug), event_participants(count)")
        .eq("created_by", profile.id)
        .neq("status", "approved")
        .order("created_at", { ascending: false })
    : { data: [] };

  return {
    profile,
    communities: [...(data ?? [])].sort(
      (a: any, b: any) => (b.trend_score ?? 0) - (a.trend_score ?? 0),
    ),
    ownCommunities: ownCommunities ?? [],
    ownEvents: ownEvents ?? [],
  };
}

export async function getEventsData(filters: {
  date?: string;
  location?: string;
  q?: string;
} = {}) {
  if (!hasSupabaseConfig()) {
    return {
      profile: null,
      events: [],
      friendAttendanceByEvent: new Map<string, FriendAttendance[]>(),
    };
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  if (filters.q || filters.location || filters.date) {
    await recordActivity({
      action: "search",
      targetType: "search",
      searchQuery: [filters.q, filters.location, filters.date].filter(Boolean).join(" "),
      path: "/events",
      metadata: { ...filters, scope: "events" },
    });
  }

  let request = supabase
    .from("events")
    .select("*, communities(name,slug), event_participants(count)")
    .eq("status", "approved")
    .neq("lifecycle", "canceled")
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (filters.date) {
    request = request.eq("event_date", filters.date);
  } else {
    request = request.gte("event_date", todayISO());
  }

  if (filters.location) {
    request = request.ilike("location", `%${filters.location}%`);
  }

  if (filters.q) {
    request = request.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
  }

  const { data } = await request.limit(80);
  const events = (data ?? []) as EventListItem[];
  const friendAttendanceByEvent = await getFriendAttendanceMap(events, profile);

  return { profile, events, friendAttendanceByEvent };
}

export async function getPostsFeedData(filters: {
  sort?: string;
  q?: string;
  community?: string;
} = {}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (filters.q || filters.community || filters.sort === "popular") {
    await recordActivity({
      action: "search",
      targetType: "search",
      searchQuery: [filters.q, filters.community, filters.sort].filter(Boolean).join(" "),
      path: "/posts",
      metadata: { ...filters, scope: "posts" },
    });
  }

  const { data: communities } = await supabase
    .from("communities")
    .select("id,name,slug")
    .eq("status", "approved")
    .eq("is_suspended", false)
    .order("name", { ascending: true })
    .limit(80);

  let request = supabase
    .from("posts")
    .select("*, profiles(first_name,last_name,avatar_path), communities(id,name,slug), comments(id), post_votes(direction,user_id)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters.community) {
    request = request.eq("community_id", filters.community);
  }

  if (filters.q) {
    request = request.or(`title.ilike.%${filters.q}%,body.ilike.%${filters.q}%`);
  }

  const { data } = await request.limit(filters.sort === "popular" ? 100 : 50);
  const posts = ((data ?? []) as PostListItem[]).sort((a, b) => {
    if (filters.sort !== "popular") {
      return 0;
    }

    return postScoreValue(b) - postScoreValue(a);
  });

  return {
    profile,
    posts,
    communities: communities ?? [],
    sort: filters.sort === "popular" ? "popular" : "new",
  };
}

export async function getPostFormData() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("community_members")
    .select("communities(id,name,slug)")
    .eq("user_id", profile.id);

  const communities = ((memberships ?? []) as unknown as {
    communities:
      | Pick<Community, "id" | "name" | "slug">
      | Pick<Community, "id" | "name" | "slug">[]
      | null;
  }[])
    .map((row) =>
      Array.isArray(row.communities) ? row.communities[0] : row.communities,
    )
    .filter(Boolean);

  return { profile, communities };
}

export async function getEventFormData() {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (["admin", "moderator", "teacher"].includes(profile.role)) {
    const { data } = await supabase
      .from("communities")
      .select("id,name,slug")
      .eq("status", "approved")
      .eq("is_suspended", false)
      .order("name", { ascending: true })
      .limit(100);

    return { profile, communities: data ?? [] };
  }

  const { data: memberships } = await supabase
    .from("community_members")
    .select("communities(id,name,slug)")
    .eq("user_id", profile.id)
    .eq("role", "admin");

  const communities = ((memberships ?? []) as unknown as {
    communities:
      | Pick<Community, "id" | "name" | "slug">
      | Pick<Community, "id" | "name" | "slug">[]
      | null;
  }[])
    .map((row) =>
      Array.isArray(row.communities) ? row.communities[0] : row.communities,
    )
    .filter(Boolean);

  return { profile, communities };
}

async function getFriendAttendanceMap(
  events: EventListItem[],
  profile: Profile | null,
) {
  const friendAttendanceByEvent = new Map<string, FriendAttendance[]>();

  if (!profile || !events.length) {
    return friendAttendanceByEvent;
  }

  const supabase = await createClient();
  const friendIds = await getAcceptedFriendIds(profile.id);

  if (!friendIds.length) {
    return friendAttendanceByEvent;
  }

  const { data: rows } = await supabase
    .from("event_participants")
    .select("event_id, profiles(id,first_name,last_name,avatar_path)")
    .in(
      "event_id",
      events.map((event) => event.id),
    )
    .in("user_id", friendIds);

  ((rows ?? []) as unknown as {
    event_id: string;
    profiles: FriendAttendance | FriendAttendance[] | null;
  }[]).forEach((row) => {
    const friend = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

    if (!friend) {
      return;
    }

    const next = friendAttendanceByEvent.get(row.event_id) ?? [];
    next.push(friend);
    friendAttendanceByEvent.set(row.event_id, next);
  });

  return friendAttendanceByEvent;
}

function postScoreValue(post: PostListItem) {
  if (typeof post.popularity_score === "number") {
    return post.popularity_score;
  }

  if (typeof post.score === "number") {
    return post.score;
  }

  return (post.post_votes ?? []).reduce(
    (sum: number, vote: { direction: number }) => sum + vote.direction,
    0,
  );
}

export async function getCommunityDetail(slug: string, sort: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Community>();

  if (!community) {
    notFound();
  }

  await recordActivity({
    action: "community_visit",
    targetType: "community",
    targetId: community.id,
    path: `/communities/${slug}`,
  });

  const [
    { data: members },
    { data: events },
    { data: membership },
    { data: follow },
  ] = await Promise.all([
    supabase
      .from("community_members")
      .select("role, profiles(id,first_name,last_name,avatar_path)")
      .eq("community_id", community.id)
      .limit(24),
    supabase
      .from("events")
      .select("*, event_participants(count)")
      .eq("community_id", community.id)
      .in("status", ["approved", "pending"])
      .order("event_date", { ascending: true }),
    supabase
      .from("community_members")
      .select("role")
      .eq("community_id", community.id)
      .eq("user_id", profile.id)
      .maybeSingle(),
    supabase
      .from("community_followers")
      .select("id")
      .eq("community_id", community.id)
      .eq("user_id", profile.id)
      .maybeSingle(),
  ]);

  const postQuery = supabase
    .from("posts")
    .select("*, profiles(first_name,last_name,avatar_path), comments(id), post_votes(direction,user_id)")
    .eq("community_id", community.id)
    .is("deleted_at", null);

  const { data: posts } =
    sort === "popular"
      ? await postQuery.order("created_at", { ascending: false }).limit(60)
      : await postQuery.order("created_at", { ascending: false }).limit(30);

  const normalizedPosts = ((posts ?? []) as PostListItem[]).sort((a, b) => {
    if (sort !== "popular") {
      return 0;
    }

    const scoreA = (a.post_votes ?? []).reduce(
      (sum: number, vote: { direction: number }) => sum + vote.direction,
      0,
    );
    const scoreB = (b.post_votes ?? []).reduce(
      (sum: number, vote: { direction: number }) => sum + vote.direction,
      0,
    );

    return scoreB - scoreA;
  });

  return {
    profile,
    community,
    imageUrl: await signedAssetUrl("community-images", community.image_path),
    members: members ?? [],
    events: events ?? [],
    posts: normalizedPosts,
    membership,
    follow,
    canManage:
      ["admin", "moderator"].includes(profile.role) || membership?.role === "admin",
  };
}

export async function getEventDetail(id: string) {
  if (!hasSupabaseConfig()) {
    notFound();
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { data: event } = await supabase
    .from("events")
    .select("*, communities(name,slug), event_participants(count)")
    .eq("id", id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const typedEvent = event as EventListItem;

  await recordActivity({
    action: "event_view",
    targetType: "event",
    targetId: id,
    path: `/events/${id}`,
  });

  const participantPayload = profile
    ? await supabase
        .from("event_participants")
        .select("user_id,status, profiles(id,first_name,last_name,avatar_path)")
        .eq("event_id", id)
        .order("created_at", { ascending: false })
    : { data: [] };
  const participants = (participantPayload.data ?? []) as unknown as ParticipantRow[];
  const isJoined = profile
    ? participants.some((row: { user_id: string }) => row.user_id === profile.id)
    : false;
  let friendParticipants: FriendAttendance[] = [];

  if (profile) {
    const friendIds = await getAcceptedFriendIds(profile.id);
    friendParticipants = participants
      .filter((row: { user_id: string }) => friendIds.includes(row.user_id))
      .map((row) => row.profiles)
      .filter(Boolean) as FriendAttendance[];
  }

  const { data: similarEvents } = await supabase
    .from("events")
    .select("id,title,event_date,start_time,location,communities(name,slug),event_participants(count)")
    .eq("status", "approved")
    .neq("lifecycle", "canceled")
    .neq("id", id)
    .gte("event_date", todayISO())
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(4);

  return {
    profile,
    event: typedEvent,
    participants,
    isJoined,
    friendParticipants,
    similarEvents: similarEvents ?? [],
  };
}

export async function getPostDetail(id: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("*, profiles(first_name,last_name,avatar_path), communities(name,slug), post_votes(direction,user_id)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle<Post>();

  if (!post) {
    notFound();
  }

  await recordActivity({
    action: "post_view",
    targetType: "post",
    targetId: id,
    path: `/posts/${id}`,
  });

  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles(first_name,last_name,avatar_path)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  return {
    profile,
    post,
    comments: comments ?? [],
  };
}

export async function getProfileDetail(id: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle<Profile>();

  if (!target) {
    notFound();
  }

  const [
    { data: friendship },
    { data: friends },
    { data: badges },
    { data: points },
    { data: attendedEvents },
    { data: authoredPosts },
  ] = await Promise.all([
    supabase
      .from("friendships")
      .select("*")
      .or(
        `and(requester_id.eq.${profile.id},receiver_id.eq.${id}),and(requester_id.eq.${id},receiver_id.eq.${profile.id})`,
      )
      .maybeSingle(),
    supabase
      .from("friendships")
      .select("id,requester_id,receiver_id, requester:profiles!friendships_requester_id_fkey(id,first_name,last_name,avatar_path,username,tag), receiver:profiles!friendships_receiver_id_fkey(id,first_name,last_name,avatar_path,username,tag)")
      .eq("status", "accepted")
      .or(`requester_id.eq.${id},receiver_id.eq.${id}`)
      .limit(12),
    supabase
      .from("user_badges")
      .select("awarded_at,badges(name,description,code,icon,category)")
      .eq("user_id", id),
    supabase
      .from("user_points")
      .select("user_id,total_points,weekly_points,daily_points,updated_at")
      .eq("user_id", id)
      .maybeSingle(),
    supabase
      .from("event_participants")
      .select("status, events(*, communities(name,slug), event_participants(count))")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("posts")
      .select("*, profiles(first_name,last_name,avatar_path), communities(name,slug), comments(id), post_votes(direction,user_id)")
      .eq("author_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return {
    current: profile,
    target,
    avatarUrl: await signedAssetUrl("avatars", target.avatar_path),
    friendship,
    friends: friends ?? [],
    badges: badges ?? [],
    points,
    attendedEvents: (attendedEvents ?? []).map((row: any) =>
      Array.isArray(row.events) ? row.events[0] : row.events,
    ).filter(Boolean),
    authoredPosts: authoredPosts ?? [],
  };
}

export async function getFriendsData() {
  return getFriendsFeatureData();
}

export async function getNotificationsData() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(60);

  return {
    profile,
    notifications: (data ?? []) as Notification[],
  };
}

export async function getAdminData(filters: {
  users?: {
    q?: string;
    role?: string;
    page?: number;
    pageSize?: number;
  };
} = {}) {
  const profile = await requireRole(["admin", "moderator", "teacher"]);

  if (!hasSupabaseAdminConfig()) {
    return {
      profile,
      pendingEvents: [],
      pendingCommunities: [],
      reports: [],
      users: [],
      userCount: 0,
      userPage: 1,
      userPageSize: filters.users?.pageSize ?? 25,
      approvedEvents: [],
      approvedCommunities: [],
      suspendedCommunities: [],
      auditLogs: [],
      productionChecks: [],
      stats: {
        users: 0,
        communities: 0,
        activeEvents: 0,
        posts: 0,
      },
    };
  }

  const admin = createAdminClient();
  const today = todayISO();
  const [
    pendingEvents,
    pendingCommunities,
    reports,
  ] = await Promise.all([
    admin
      .from("events")
      .select("*, communities(name), creator:profiles!events_created_by_fkey(first_name,last_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    admin
      .from("communities")
      .select("*, creator:profiles!communities_created_by_fkey(first_name,last_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    admin
      .from("reports")
      .select("*, reporter:profiles!reports_reporter_id_fkey(first_name,last_name)")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  ]);
  const [
    approvedEvents,
    approvedCommunities,
    suspendedCommunities,
    auditLogs,
    productionChecks,
    usersResult,
    stats,
  ] = await Promise.all([
    admin
      .from("events")
      .select("id,title,lifecycle,event_date,location")
      .eq("status", "approved")
      .order("event_date", { ascending: true })
      .limit(30),
    admin
      .from("communities")
      .select("id,name,is_suspended,suspension_reason")
      .eq("status", "approved")
      .order("name", { ascending: true })
      .limit(50),
    admin
      .from("communities")
      .select("id,name,is_suspended,suspension_reason")
      .eq("is_suspended", true)
      .order("updated_at", { ascending: false })
      .limit(20),
    admin
      .from("audit_logs")
      .select("*, actor:profiles!audit_logs_actor_id_fkey(first_name,last_name)")
      .order("created_at", { ascending: false })
      .limit(20),
    getProductionReadinessChecks(),
    getAdminUsers(filters.users ?? {}),
    getAdminStats(today),
  ]);

  return {
    profile,
    pendingEvents: pendingEvents.data ?? [],
    pendingCommunities: pendingCommunities.data ?? [],
    reports: reports.data ?? [],
    users: usersResult.users,
    userCount: usersResult.count,
    userPage: usersResult.page,
    userPageSize: usersResult.pageSize,
    approvedEvents: approvedEvents.data ?? [],
    approvedCommunities: approvedCommunities.data ?? [],
    suspendedCommunities: suspendedCommunities.data ?? [],
    auditLogs: auditLogs.data ?? [],
    productionChecks,
    stats: {
      users: stats.users,
      communities: stats.communities,
      activeEvents: stats.activeEvents,
      posts: stats.posts,
    },
  };
}

export async function getCalendarData(filters: {
  date?: string;
  location?: string;
  q?: string;
  view?: string;
}) {
  if (!hasSupabaseConfig()) {
    return { events: [] };
  }

  const supabase = await createClient();
  if (filters.q || filters.location || filters.date || filters.view) {
    await recordActivity({
      action: "search",
      targetType: "search",
      searchQuery: [filters.q, filters.location, filters.date, filters.view].filter(Boolean).join(" "),
      path: "/calendar",
      metadata: { ...filters, scope: "calendar" },
    });
  }

  let query = supabase
    .from("events")
    .select("*, communities(name,slug), event_participants(count)")
    .eq("status", "approved")
    .neq("lifecycle", "canceled")
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (filters.view === "month") {
    const base = filters.date ? new Date(`${filters.date}T00:00:00`) : new Date();
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    query = query
      .gte("event_date", start.toISOString().slice(0, 10))
      .lte("event_date", end.toISOString().slice(0, 10));
  } else if (filters.view === "week") {
    const base = filters.date ? new Date(`${filters.date}T00:00:00`) : new Date();
    const day = base.getDay() === 0 ? 7 : base.getDay();
    const start = new Date(base);
    start.setDate(base.getDate() - day + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    query = query
      .gte("event_date", start.toISOString().slice(0, 10))
      .lte("event_date", end.toISOString().slice(0, 10));
  } else if (filters.date) {
    query = query.eq("event_date", filters.date);
  } else {
    query = query.gte("event_date", todayISO());
  }

  if (filters.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }

  if (filters.q) {
    query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
  }

  const { data } = await query.limit(80);

  return { events: data ?? [] };
}

export async function getPollsData() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("polls")
    .select("*, poll_options(id,label,position,poll_votes(id,user_id))")
    .in("status", ["open", "closed"])
    .order("created_at", { ascending: false })
    .limit(40);

  return { profile, polls: data ?? [] };
}
