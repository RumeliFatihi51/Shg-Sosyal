import { Buffer } from "node:buffer";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  anonClient,
  bodyJson,
  cleanUsername,
  errorResponse,
  getAuthenticatedProfile,
  getOptionalProfile,
  mobileUser,
  normalizeRole,
  response,
  splitName,
  type SupabaseClientLike,
} from "./shared";
import {
  joinCommunity,
  leaveCommunity,
  searchCommunityUsers,
} from "./services/community-service";
import {
  adminListParams,
  approvalItem as adminApprovalItem,
  requireMobileAdmin as requireMobileAdminRole,
} from "./services/admin-service";
import {
  ensureCanPostInCommunity as ensureFeedPostPermission,
  validatePollInput,
  validatePostInput,
} from "./services/feed-service";
import { validateParticipationStatus } from "./services/event-service";
import {
  notifyFriendAccepted,
  notifyFriendRequest,
  sanitizeFriendSearchQuery,
} from "./services/friend-service";
import {
  notifyDirectMessage,
  validateMessageContent,
} from "./services/message-service";

export type MobileRouteContext = {
  params: Promise<{ path?: string[] }>;
};

function startsAtIso(event: Record<string, unknown>) {
  const date = String(event.event_date ?? "").slice(0, 10);
  const time = String(event.start_time ?? "00:00:00");
  const iso = date ? `${date}T${time}` : String(event.created_at ?? new Date().toISOString());
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function eventCategory(event: Record<string, unknown>) {
  const text = `${event.title ?? ""} ${event.description ?? ""}`.toLocaleLowerCase("tr-TR");
  if (/basket|futbol|spor|turnuva|koÅŸu/.test(text)) return "sport";
  if (/atÃ¶lye|workshop|laboratuvar|kod|robot/.test(text)) return "workshop";
  if (/yarÄ±ÅŸma|final|mÃ¼sabaka/.test(text)) return "competition";
  if (/bilim|yapay zeka|fizik|kimya/.test(text)) return "science";
  if (/mÃ¼zik|tiyatro|sahne|sanat/.test(text)) return "art";
  return "club";
}

async function communityDtos(
  admin: SupabaseClientLike,
  rows: Record<string, unknown>[],
  currentUserId?: string,
) {
  const ids = rows.map((row) => String(row.id)).filter(Boolean);

  if (!ids.length) return [];

  const [{ data: members }, { data: posts }] = await Promise.all([
    admin.from("community_members").select("community_id,user_id,role").in("community_id", ids),
    admin.from("posts").select("community_id").in("community_id", ids).is("deleted_at", null),
  ]);

  const membersByCommunity = new Map<string, { user_id: string; role: string }[]>();
  for (const member of (members ?? []) as { community_id: string; user_id: string; role: string }[]) {
    const list = membersByCommunity.get(member.community_id) ?? [];
    list.push(member);
    membersByCommunity.set(member.community_id, list);
  }

  const postCounts = new Map<string, number>();
  for (const post of (posts ?? []) as { community_id: string }[]) {
    postCounts.set(post.community_id, (postCounts.get(post.community_id) ?? 0) + 1);
  }

  return rows.map((row) => {
    const communityId = String(row.id);
    const communityMembers = membersByCommunity.get(communityId) ?? [];
    const memberIds = communityMembers.map((member) => member.user_id);
    const adminIds = communityMembers
      .filter((member) => member.role === "admin")
      .map((member) => member.user_id);

    return {
      id: communityId,
      name: row.name,
      description: row.description,
      avatar_url: row.image_path ?? null,
      member_count: Number(row.member_count ?? communityMembers.length),
      post_count: Number(row.post_count ?? postCounts.get(communityId) ?? 0),
      is_joined: currentUserId ? memberIds.includes(currentUserId) : false,
      last_activity_at: row.updated_at ?? row.created_at,
      category: row.category ?? "Topluluk",
      admin_ids: adminIds,
      member_ids: memberIds,
      status: row.status,
    };
  });
}

async function eventDtos(admin: SupabaseClientLike, rows: Record<string, unknown>[], currentUserId?: string) {
  const ids = rows.map((row) => String(row.id)).filter(Boolean);
  const communityIds = rows.map((row) => String(row.community_id ?? "")).filter(Boolean);

  const [{ data: participants }, { data: communities }] = await Promise.all([
    ids.length
      ? admin.from("event_participants").select("event_id,user_id,status").in("event_id", ids)
      : Promise.resolve({ data: [] }),
    communityIds.length
      ? admin.from("communities").select("id,name").in("id", communityIds)
      : Promise.resolve({ data: [] }),
  ]);

  const communitiesById = new Map(
    ((communities ?? []) as { id: string; name: string }[]).map((community) => [community.id, community.name]),
  );
  const participantsByEvent = new Map<string, { user_id: string; status?: string | null }[]>();

  for (const participant of (participants ?? []) as {
    event_id: string;
    user_id: string;
    status?: string | null;
  }[]) {
    const list = participantsByEvent.get(participant.event_id) ?? [];
    list.push(participant);
    participantsByEvent.set(participant.event_id, list);
  }

  return rows.map((row) => {
    const eventId = String(row.id);
    const eventParticipants = participantsByEvent.get(eventId) ?? [];
    const going = eventParticipants.filter((participant) => (participant.status ?? "going") === "going");
    const mine = currentUserId
      ? eventParticipants.find((participant) => participant.user_id === currentUserId)?.status
      : null;

    return {
      id: eventId,
      title: row.title,
      description: row.description,
      starts_at: startsAtIso(row),
      ends_at: new Date(new Date(startsAtIso(row)).getTime() + 60 * 60 * 1000).toISOString(),
      location: row.location,
      community_id: row.community_id,
      community_name: communitiesById.get(String(row.community_id ?? "")) ?? "ÅHG Sosyal",
      organizer_name: communitiesById.get(String(row.community_id ?? "")) ?? "ÅHG Sosyal",
      participant_count: Number(row.participant_count ?? going.length),
      capacity: row.capacity ?? null,
      friend_participants: [],
      status: row.lifecycle ?? row.status,
      my_status: mine ?? "none",
      category: eventCategory(row),
      created_at: row.created_at,
    };
  });
}

async function profileMapByIds(admin: SupabaseClientLike, ids: string[]) {
  const cleanIds = [...new Set(ids.filter(Boolean))];

  if (!cleanIds.length) return new Map<string, ReturnType<typeof mobileUser>>();

  const { data } = await admin.from("profiles").select("*").in("id", cleanIds);
  return new Map(((data ?? []) as Record<string, unknown>[]).map((profile) => [String(profile.id), mobileUser(profile)]));
}

async function communityMapByIds(admin: SupabaseClientLike, ids: string[], currentUserId?: string) {
  const cleanIds = [...new Set(ids.filter(Boolean))];

  if (!cleanIds.length) return new Map<string, Awaited<ReturnType<typeof communityDtos>>[number]>();

  const { data } = await admin.from("communities").select("*").in("id", cleanIds);
  const dtos = await communityDtos(admin, (data ?? []) as Record<string, unknown>[], currentUserId);
  return new Map(dtos.map((community) => [String(community.id), community]));
}

function imageExtension(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

async function uploadMobileImage(
  admin: SupabaseClientLike,
  bucket: "post-images" | "event-images" | "community-images" | "avatars",
  ownerId: string,
  body: Record<string, unknown>,
) {
  const raw = String(body.image_base64 ?? "").trim();
  if (!raw) return null;

  const dataUriMatch = raw.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  const mimeType = String(body.image_mime_type ?? dataUriMatch?.[1] ?? "image/jpeg").trim();
  const encoded = dataUriMatch?.[2] ?? raw;

  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    throw new Error("Görsel JPG, PNG veya WebP olmalı.");
  }

  const buffer = Buffer.from(encoded, "base64");
  if (!buffer.length) return null;
  if (buffer.byteLength > 3 * 1024 * 1024) {
    throw new Error("Görsel en fazla 3MB olabilir.");
  }

  const path = `${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${imageExtension(mimeType)}`;
  const { error } = await admin.storage.from(bucket).upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function handleAuthLogin(request: NextRequest) {
  const body = await bodyJson(request);
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");

  if (!email || !password) throw new Error("E-posta ve ÅŸifre gerekli.");

  const { data, error } = await anonClient().auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) throw new Error(error?.message ?? "GiriÅŸ yapÄ±lamadÄ±.");

  const admin = createAdminClient();
  const { data: existingProfile } = await admin.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
  let profile = existingProfile;

  if (!profile) {
    const username = cleanUsername(data.user.email?.split("@")[0]);
    const names = splitName(data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0]);
    const { data: inserted, error: insertError } = await admin
      .from("profiles")
      .upsert({
        id: data.user.id,
        ...names,
        username,
        tag: `@${username}`,
        email: data.user.email,
        role: "student",
      })
      .select("*")
      .single();

    if (insertError) throw new Error(insertError.message);
    profile = inserted;
  }

  return response({
    access_token: data.session.access_token,
    session: data.session,
    user: mobileUser(profile as Record<string, unknown> | null),
  });
}

async function handleAuthRegister(request: NextRequest) {
  const body = await bodyJson(request);
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  const full_name = String(body.full_name ?? "").trim();
  const class_name = String(body.class_name ?? "").trim();
  const username = cleanUsername(body.username ?? email.split("@")[0]);

  if (!email || !password || !full_name) throw new Error("Ad, e-posta ve ÅŸifre gerekli.");

  const { data, error } = await anonClient().auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        username,
        class_name,
      },
    },
  });

  if (error || !data.user) throw new Error(error?.message ?? "KayÄ±t oluÅŸturulamadÄ±.");

  const admin = createAdminClient();
  const names = splitName(full_name);
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .upsert({
      id: data.user.id,
      ...names,
      username,
      tag: `@${username}`,
      email,
      class_name,
      role: "student",
    })
    .select("*")
    .single();

  if (profileError) throw new Error(profileError.message);

  return response({
    access_token: data.session?.access_token,
    session: data.session,
    user: mobileUser(profile as Record<string, unknown>),
  });
}

async function handleProfile(request: NextRequest, path: string[], method: string) {
  const session = await getAuthenticatedProfile(request);
  const currentUserId = String(session.profile.id);

  if (path.length === 2 && path[1] === "me" && method === "PUT") {
    const body = await bodyJson(request);
    const full_name = String(body.full_name ?? "").trim();
    const bio = String(body.bio ?? "").trim();
    const class_name = String(body.class_name ?? "").trim();
    const requestedUsername = String(body.username ?? "").trim();
    const username = requestedUsername ? cleanUsername(requestedUsername.replace("@", "")) : "";

    const update: Record<string, unknown> = {
      bio,
      class_name,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    if (full_name) Object.assign(update, splitName(full_name), { full_name });

    if (username) {
      const { data: existing, error: usernameError } = await session.admin
        .from("profiles")
        .select("id")
        .or(`username.ilike.${username},tag.ilike.@${username}`)
        .neq("id", currentUserId)
        .maybeSingle();

      if (usernameError) throw new Error(usernameError.message);
      if (existing) throw new Error("Bu @etiket zaten alınmış.");

      update.username = username;
      update.tag = `@${username}`;
    }

    const { data, error } = await session.admin
      .from("profiles")
      .update(update)
      .eq("id", currentUserId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return response(mobileUser(data as Record<string, unknown>));
  }

  if (path.length === 2 && method === "GET") {
    const requestedId = path[1] === "me" ? currentUserId : path[1];

    const [
      profileResult,
      badgesResult,
      participantsResult,
      membershipsResult,
    ] = await Promise.all([
      session.admin.from("profiles").select("*").eq("id", requestedId).maybeSingle(),
      session.admin
        .from("user_badges")
        .select("badges(id,code,name,description,icon,category),earned_at,awarded_at")
        .eq("user_id", requestedId)
        .limit(12),
      session.admin
        .from("event_participants")
        .select("event_id,status")
        .eq("user_id", requestedId)
        .eq("status", "going")
        .limit(20),
      session.admin
        .from("community_members")
        .select("community_id")
        .eq("user_id", requestedId)
        .limit(20),
    ]);

    if (profileResult.error) throw new Error(profileResult.error.message);
    if (!profileResult.data) throw new Error("Profil bulunamadı.");

    const eventIds = ((participantsResult.data ?? []) as Record<string, unknown>[]).map((item) =>
      String(item.event_id),
    );
    const communityIds = ((membershipsResult.data ?? []) as Record<string, unknown>[]).map((item) =>
      String(item.community_id),
    );

    const [eventsResult, communitiesResult] = await Promise.all([
      eventIds.length
        ? session.admin.from("events").select("*").in("id", eventIds).order("event_date", { ascending: false })
        : Promise.resolve({ data: [] }),
      communityIds.length
        ? session.admin.from("communities").select("*").in("id", communityIds)
        : Promise.resolve({ data: [] }),
    ]);

    const badges = ((badgesResult.data ?? []) as Record<string, unknown>[]).map((row) => {
      const badge = row.badges as Record<string, unknown> | null;
      return {
        ...(badge ?? {}),
        is_earned: true,
        earned_at: row.earned_at ?? row.awarded_at ?? null,
      };
    });

    return response({
      user: mobileUser(profileResult.data as Record<string, unknown>),
      badges,
      events: await eventDtos(
        session.admin,
        (eventsResult.data ?? []) as Record<string, unknown>[],
        currentUserId,
      ),
      communities: await communityDtos(
        session.admin,
        (communitiesResult.data ?? []) as Record<string, unknown>[],
        currentUserId,
      ),
    });
  }

  return errorResponse("Endpoint bulunamadı.", 404);
}

async function handleFeed(request: NextRequest) {
  const auth = await getOptionalProfile(request);
  const admin = auth?.admin ?? createAdminClient();
  const tab = request.nextUrl.searchParams.get("tab") ?? request.nextUrl.searchParams.get("filter") ?? "for-you";

  const [postsResult, eventsResult, announcementsResult, pollsResult] = await Promise.all([
    tab === "events" || tab === "communities"
      ? Promise.resolve({ data: [] })
      : admin
          .from("posts")
          .select(
            "id,community_id,author_id,title,body,image_url,created_at,updated_at,deleted_at,upvote_count,comment_count",
          )
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(20),
    tab === "communities"
      ? Promise.resolve({ data: [] })
      : admin
          .from("events")
          .select("*")
          .eq("status", "approved")
          .gte("event_date", new Date().toISOString().slice(0, 10))
          .order("event_date", { ascending: true })
          .limit(8),
    tab === "events" || tab === "communities"
      ? Promise.resolve({ data: [] })
      : admin.from("announcements").select("*").order("created_at", { ascending: false }).limit(5),
    tab === "events" || tab === "communities"
      ? Promise.resolve({ data: [] })
      : admin.from("polls").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(5),
  ]);

  const posts = (postsResult.data ?? []) as Record<string, unknown>[];
  const eventRows = (eventsResult.data ?? []) as Record<string, unknown>[];
  const announcements = (announcementsResult.data ?? []) as Record<string, unknown>[];
  const polls = (pollsResult.data ?? []) as Record<string, unknown>[];

  const [eventItems, authorMap, communityMap, pollOptionsResult, pollVotesResult] = await Promise.all([
    eventDtos(admin, eventRows, String(auth?.profile.id ?? "")),
    profileMapByIds(admin, [
      ...posts.map((post) => String(post.author_id)),
      ...announcements.map((item) => String(item.author_id)),
      ...polls.map((poll) => String(poll.created_by)),
    ]),
    communityMapByIds(admin, [
      ...posts.map((post) => String(post.community_id)),
      ...eventRows.map((event) => String(event.community_id ?? "")),
    ], String(auth?.profile.id ?? "")),
    polls.length
      ? admin.from("poll_options").select("id,poll_id,label,position").in("poll_id", polls.map((poll) => String(poll.id)))
      : Promise.resolve({ data: [] }),
    polls.length
      ? admin.from("poll_votes").select("poll_id,option_id").in("poll_id", polls.map((poll) => String(poll.id)))
      : Promise.resolve({ data: [] }),
  ]);

  const votes = (pollVotesResult.data ?? []) as { poll_id: string; option_id: string }[];
  const optionsByPoll = new Map<string, { id: string; label: string; vote_count: number }[]>();
  for (const option of (pollOptionsResult.data ?? []) as { id: string; poll_id: string; label: string }[]) {
    const list = optionsByPoll.get(option.poll_id) ?? [];
    list.push({
      id: option.id,
      label: option.label,
      vote_count: votes.filter((vote) => vote.option_id === option.id).length,
    });
    optionsByPoll.set(option.poll_id, list);
  }

  const feed = [
    ...eventItems.map((event) => ({
      id: `event-${event.id}`,
      type: "event",
      author: mobileUser(null),
      title: event.title,
      content: event.description,
      created_at: event.created_at ?? event.starts_at,
      event,
      community: event.community_id ? communityMap.get(String(event.community_id)) : null,
    })),
    ...posts.map((post) => ({
      id: String(post.id),
      type: "post",
      author: authorMap.get(String(post.author_id)) ?? mobileUser(null),
      title: post.title,
      content: post.body,
      created_at: post.created_at,
      edited_at: post.updated_at,
      community: communityMap.get(String(post.community_id)),
      like_count: Number(post.upvote_count ?? 0),
      comment_count: Number(post.comment_count ?? 0),
    })),
    ...announcements.map((item) => ({
      id: `announcement-${item.id}`,
      type: "announcement",
      author: authorMap.get(String(item.author_id)) ?? mobileUser(null),
      title: item.title,
      content: item.body,
      created_at: item.created_at,
    })),
    ...polls.map((poll) => ({
      id: `poll-${poll.id}`,
      type: "poll",
      author: authorMap.get(String(poll.created_by)) ?? mobileUser(null),
      title: poll.title,
      content: poll.description ?? "",
      created_at: poll.created_at,
      poll_options: optionsByPoll.get(String(poll.id)) ?? [],
    })),
  ].sort((a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime());

  return response(feed);
}

async function postFeedDto(
  admin: SupabaseClientLike,
  post: Record<string, unknown>,
  currentUserId?: string,
) {
  const [authorMap, communityMap] = await Promise.all([
    profileMapByIds(admin, [String(post.author_id)]),
    communityMapByIds(admin, [String(post.community_id)], currentUserId),
  ]);

  return {
    id: post.id,
    type: "post",
    author: authorMap.get(String(post.author_id)) ?? mobileUser(null),
    title: post.title,
    content: post.body,
    created_at: post.created_at,
    edited_at: post.updated_at,
    community: communityMap.get(String(post.community_id)) ?? null,
    like_count: Number(post.upvote_count ?? 0),
    comment_count: Number(post.comment_count ?? 0),
    image_url: post.image_url ?? null,
  };
}

async function pollFeedDto(
  admin: SupabaseClientLike,
  poll: Record<string, unknown>,
  currentUserId?: string,
) {
  const communityId = String(poll.description ?? "");
  const [{ data: options }, authorMap, communityMap] = await Promise.all([
    admin.from("poll_options").select("id,label,position").eq("poll_id", String(poll.id)).order("position"),
    profileMapByIds(admin, [String(poll.created_by)]),
    communityMapByIds(admin, communityId ? [communityId] : [], currentUserId),
  ]);

  return {
    id: `poll-${poll.id}`,
    type: "poll",
    author: authorMap.get(String(poll.created_by)) ?? mobileUser(null),
    title: poll.title,
    content: communityMap.get(communityId)?.name ?? "",
    created_at: poll.created_at,
    community: communityMap.get(communityId) ?? null,
    poll_options: ((options ?? []) as Record<string, unknown>[]).map((option) => ({
      id: option.id,
      label: option.label,
      vote_count: 0,
    })),
  };
}

async function handleFeedWrite(request: NextRequest, path: string[], method: string) {
  const session = await getAuthenticatedProfile(request);

  if (path.length === 2 && path[1] === "posts" && method === "POST") {
    const body = await bodyJson(request);
    const { communityId, content } = validatePostInput(body);

    await ensureFeedPostPermission(session.admin, session.profile, communityId);
    const imageUrl = await uploadMobileImage(session.admin, "post-images", String(session.profile.id), body);

    const { data, error } = await session.admin
      .from("posts")
      .insert({
        community_id: communityId,
        author_id: session.profile.id,
        title: content.slice(0, 80),
        body: content,
        image_url: imageUrl,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return response(await postFeedDto(session.admin, data as Record<string, unknown>, String(session.profile.id)));
  }

  if (path.length === 2 && path[1] === "polls" && method === "POST") {
    const body = await bodyJson(request);
    const { communityId, question, options } = validatePollInput(body);

    await ensureFeedPostPermission(session.admin, session.profile, communityId);

    const role = normalizeRole(String(session.profile.role));
    const { data: poll, error } = await session.admin
      .from("polls")
      .insert({
        created_by: session.profile.id,
        title: question,
        description: communityId,
        status: role === "admin" || role === "teacher" ? "open" : "draft",
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const optionRows = options.map((label, index) => ({
      poll_id: poll.id,
      label,
      position: index,
    }));
    const { error: optionsError } = await session.admin.from("poll_options").insert(optionRows);
    if (optionsError) throw new Error(optionsError.message);

    return response(await pollFeedDto(session.admin, poll as Record<string, unknown>, String(session.profile.id)));
  }

  return errorResponse("Endpoint bulunamadÄ±.", 404);
}

async function handleCommunities(request: NextRequest, path: string[], method: string) {
  const auth = await getOptionalProfile(request);
  const admin = auth?.admin ?? createAdminClient();

  if (path.length === 3 && path[1] === "users" && path[2] === "search" && method === "GET") {
    const session = await getAuthenticatedProfile(request);
    return response(
      await searchCommunityUsers(session, request.nextUrl.searchParams.get("q") ?? ""),
    );
  }

  if (path.length === 1 && method === "POST") {
    const session = await getAuthenticatedProfile(request);
    const body = await bodyJson(request);
    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();
    const category = String(body.category ?? "Topluluk").trim();

    if (name.length < 3) throw new Error("Topluluk adÄ± Ã§ok kÄ±sa.");
    if (description.length < 10) throw new Error("Topluluk aÃ§Ä±klamasÄ± Ã§ok kÄ±sa.");

    const role = normalizeRole(String(session.profile.role));
    const slugBase = cleanUsername(name).replaceAll("_", "-").replaceAll(".", "-");
    const slug = `${slugBase}-${Date.now().toString().slice(-5)}`;
    const isApproved = role === "admin";
    const imageUrl = await uploadMobileImage(session.admin, "community-images", String(session.profile.id), body);

    const { data, error } = await session.admin
      .from("communities")
      .insert({
        name,
        slug,
        description,
        category,
        image_path: imageUrl,
        created_by: session.profile.id,
        status: isApproved ? "approved" : "pending",
        approved_by: isApproved ? session.profile.id : null,
        approved_at: isApproved ? new Date().toISOString() : null,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    if (isApproved) {
      await session.admin
        .from("community_members")
        .upsert(
          { community_id: data.id, user_id: session.profile.id, role: "admin" },
          { onConflict: "community_id,user_id" },
        );
    }

    const [dto] = await communityDtos(session.admin, [data as Record<string, unknown>], String(session.profile.id));
    return response(dto);
  }

  if (path.length === 1 && method === "GET") {
    const tab = request.nextUrl.searchParams.get("tab") ?? "recommended";
    let query = admin.from("communities").select("*").eq("status", "approved");

    if (tab === "active") query = query.order("updated_at", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error } = await query.limit(50);
    if (error) throw new Error(error.message);

    return response(await communityDtos(admin, (data ?? []) as Record<string, unknown>[], String(auth?.profile.id ?? "")));
  }

  if (path.length >= 2) {
    const communityId = path[1];

    if (path.length === 2 && method === "GET") {
      const { data, error } = await admin.from("communities").select("*").eq("id", communityId).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return response(null, 404);

      const [dto] = await communityDtos(admin, [data as Record<string, unknown>], String(auth?.profile.id ?? ""));
      return response(dto);
    }

    if (path.length === 3 && path[2] === "join" && method === "POST") {
      const session = await getAuthenticatedProfile(request);
      await joinCommunity(session, communityId);
      const { data } = await session.admin.from("communities").select("*").eq("id", communityId).single();
      const [dto] = await communityDtos(session.admin, [data as Record<string, unknown>], String(session.profile.id));
      return response(dto);
    }

    if (path.length === 3 && path[2] === "leave" && (method === "POST" || method === "DELETE")) {
      const session = await getAuthenticatedProfile(request);
      await leaveCommunity(session, communityId);
      const { data } = await session.admin.from("communities").select("*").eq("id", communityId).single();
      const [dto] = await communityDtos(session.admin, [data as Record<string, unknown>], String(session.profile.id));
      return response(dto);
    }

    if (path.length === 3 && path[2] === "members" && method === "POST") {
      const session = await getAuthenticatedProfile(request);
      const body = await bodyJson(request);
      const userId = String(body.user_id ?? "");
      await ensureCommunityManager(session.admin, session.profile, communityId);

      if (!userId) throw new Error("Eklenecek kullanÄ±cÄ± seÃ§ilmedi.");

      const { error } = await session.admin
        .from("community_members")
        .upsert({ community_id: communityId, user_id: userId, role: "member" }, { onConflict: "community_id,user_id" });
      if (error) throw new Error(error.message);

      const { data } = await session.admin.from("communities").select("*").eq("id", communityId).single();
      const [dto] = await communityDtos(session.admin, [data as Record<string, unknown>], String(session.profile.id));
      return response(dto);
    }

    if (path.length === 4 && path[2] === "members" && method === "DELETE") {
      const session = await getAuthenticatedProfile(request);
      const userId = path[3];
      await ensureCommunityManager(session.admin, session.profile, communityId);

      const { data: membership } = await session.admin
        .from("community_members")
        .select("role")
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .maybeSingle();

      if ((membership as { role?: string } | null)?.role === "admin") {
        throw new Error("Topluluk admini bu panelden Ã§Ä±karÄ±lamaz.");
      }

      const { error } = await session.admin
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);

      const { data } = await session.admin.from("communities").select("*").eq("id", communityId).single();
      const [dto] = await communityDtos(session.admin, [data as Record<string, unknown>], String(session.profile.id));
      return response(dto);
    }
  }

  return errorResponse("Endpoint bulunamadÄ±.", 404);
}

async function ensureCommunityManager(
  admin: SupabaseClientLike,
  profile: Record<string, unknown>,
  communityId: string,
) {
  if (normalizeRole(String(profile.role)) === "admin") return;

  const { data: community } = await admin.from("communities").select("created_by").eq("id", communityId).maybeSingle();
  if ((community as { created_by?: string } | null)?.created_by === profile.id) return;

  const { data: membership } = await admin
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", String(profile.id))
    .maybeSingle();

  if ((membership as { role?: string } | null)?.role !== "admin") {
    throw new Error("Bu topluluÄŸu yÃ¶netme yetkin yok.");
  }
}

async function handleEvents(request: NextRequest, path: string[]) {
  const auth = await getOptionalProfile(request);
  const admin = auth?.admin ?? createAdminClient();

  if (path.length === 1 && request.method === "POST") {
    const session = await getAuthenticatedProfile(request);
    const body = await bodyJson(request);
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const location = String(body.location ?? "").trim();
    const startsAt = new Date(String(body.starts_at ?? ""));
    const communityId = body.community_id ? String(body.community_id) : null;
    const capacity = body.capacity == null || body.capacity === ""
      ? null
      : Number.parseInt(String(body.capacity), 10);

    if (title.length < 3) throw new Error("Etkinlik baÅŸlÄ±ÄŸÄ± Ã§ok kÄ±sa.");
    if (description.length < 10) throw new Error("Etkinlik aÃ§Ä±klamasÄ± Ã§ok kÄ±sa.");
    if (!location) throw new Error("Konum gerekli.");
    if (Number.isNaN(startsAt.getTime())) throw new Error("GeÃ§erli tarih ve saat gerekli.");

    const role = normalizeRole(String(session.profile.role));
    const isApproved = role === "admin" || role === "teacher";
    const imageUrl = await uploadMobileImage(session.admin, "event-images", String(session.profile.id), body);

    const { data, error } = await session.admin
      .from("events")
      .insert({
        community_id: communityId,
        created_by: session.profile.id,
        title,
        description,
        event_date: startsAt.toISOString().slice(0, 10),
        start_time: startsAt.toISOString().slice(11, 19),
        location,
        image_url: imageUrl,
        capacity: capacity && capacity > 0 ? capacity : null,
        status: isApproved ? "approved" : "pending",
        approved_by: isApproved ? session.profile.id : null,
        approved_at: isApproved ? new Date().toISOString() : null,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const [dto] = await eventDtos(session.admin, [data as Record<string, unknown>], String(session.profile.id));
    return response(dto);
  }

  if (path.length === 1) {
    const tab = request.nextUrl.searchParams.get("tab") ?? "upcoming";
    let query = admin.from("events").select("*").eq("status", "approved");

    if (tab === "today") query = query.eq("event_date", new Date().toISOString().slice(0, 10));
    else if (tab !== "past") query = query.gte("event_date", new Date().toISOString().slice(0, 10));

    const { data, error } = await query.order("event_date", { ascending: tab !== "past" }).limit(50);
    if (error) throw new Error(error.message);

    return response(await eventDtos(admin, (data ?? []) as Record<string, unknown>[], String(auth?.profile.id ?? "")));
  }

  const eventId = path[1];

  if (path.length === 3 && path[2] === "participation" && request.method === "POST") {
    const session = await getAuthenticatedProfile(request);
    const body = await bodyJson(request);
    const status = validateParticipationStatus(body.status);

    const { error } = await session.admin
      .from("event_participants")
      .upsert(
        {
          event_id: eventId,
          user_id: session.profile.id,
          status,
        },
        { onConflict: "event_id,user_id" },
      );

    if (error) throw new Error(error.message);

    const { data } = await session.admin.from("events").select("*").eq("id", eventId).single();
    const [dto] = await eventDtos(session.admin, [data as Record<string, unknown>], String(session.profile.id));
    return response(dto);
  }

  const { data, error } = await admin.from("events").select("*").eq("id", eventId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return response(null, 404);

  const [dto] = await eventDtos(admin, [data as Record<string, unknown>], String(auth?.profile.id ?? ""));
  return response(dto);
}

async function conversationDto(admin: SupabaseClientLike, conversationId: string, currentUserId: string) {
  const { data: summary, error } = await admin
    .from("direct_conversation_summaries")
    .select("*")
    .eq("user_id", currentUserId)
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const row = summary as Record<string, unknown> | null;
  if (!row) throw new Error("KonuÅŸma bulunamadÄ±.");

  return {
    id: row.conversation_id,
    conversation_id: row.conversation_id,
    other_user: mobileUser({
      id: row.other_user_id,
      first_name: row.other_first_name,
      last_name: row.other_last_name,
      username: row.other_username,
      tag: row.other_tag,
      avatar_path: row.other_avatar_path,
    }),
    last_message_at: row.last_message_at,
    unread_count: Number(row.unread_count ?? 0),
    last_message: {
      id: row.last_message_id ?? `empty-${row.conversation_id}`,
      conversation_id: row.conversation_id,
      sender_id: row.last_message_sender_id ?? row.other_user_id,
      content: row.last_message_content ?? "",
      created_at: row.last_message_created_at ?? row.last_message_at ?? new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
    },
  };
}

async function handleMessages(request: NextRequest, path: string[], method: string) {
  const session = await getAuthenticatedProfile(request);
  const currentUserId = String(session.profile.id);

  if (path.length === 2 && path[1] === "conversations" && method === "GET") {
    const { data, error } = await session.admin
      .from("direct_conversation_summaries")
      .select("*")
      .eq("user_id", currentUserId)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) throw new Error(error.message);

    return response(
      await Promise.all(
        ((data ?? []) as Record<string, unknown>[]).map((row) =>
          conversationDto(session.admin, String(row.conversation_id), currentUserId),
        ),
      ),
    );
  }

  if (path.length === 2 && path[1] === "direct" && method === "POST") {
    const body = await bodyJson(request);
    const otherUserId = String(body.user_id ?? "");
    if (!otherUserId) throw new Error("MesajlaÅŸÄ±lacak kullanÄ±cÄ± seÃ§ilmedi.");

    const { data, error } = await session.client.rpc("start_direct_conversation", {
      p_other_user: otherUserId,
    });

    if (error) throw new Error(error.message);
    return response(await conversationDto(session.admin, String(data), currentUserId));
  }

  if (path.length >= 3 && path[1] === "conversations") {
    const conversationId = path[2];

    if (path.length === 3 && method === "GET") {
      const before = request.nextUrl.searchParams.get("before");
      let query = session.client
        .from("messages")
        .select("id,conversation_id,sender_id,content,created_at,edited_at,deleted_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (before) query = query.lt("created_at", before);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      await session.client
        .from("conversation_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", currentUserId);

      return response([...(data ?? [])].reverse());
    }

    if (path.length === 4 && path[3] === "read" && method === "POST") {
      const { error } = await session.client
        .from("conversation_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", currentUserId);
      if (error) throw new Error(error.message);
      return response({ ok: true });
    }

    if (path.length === 4 && path[3] === "messages" && method === "POST") {
      const body = await bodyJson(request);
      const content = validateMessageContent(body.content);

      const { data, error } = await session.client
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: currentUserId, content })
        .select("id,conversation_id,sender_id,content,created_at,edited_at,deleted_at")
        .single();

      if (error) throw new Error(error.message);

      await session.admin
        .from("conversations")
        .update({
          last_message_at: data.created_at,
          updated_at: data.created_at,
        })
        .eq("id", conversationId);

      await notifyDirectMessage(session.admin, conversationId, currentUserId, session.profile, content);

      return response(data);
    }

    if (path.length === 5 && path[3] === "messages" && method === "PUT") {
      const messageId = path[4];
      const body = await bodyJson(request);
      const content = String(body.content ?? "").trim();

      if (!content) throw new Error("Mesaj boÅŸ olamaz.");

      const { data, error } = await session.client
        .from("messages")
        .update({ content, edited_at: new Date().toISOString(), status: "edited" })
        .eq("id", messageId)
        .eq("conversation_id", conversationId)
        .eq("sender_id", currentUserId)
        .select("id,conversation_id,sender_id,content,created_at,edited_at,deleted_at")
        .single();

      if (error) throw new Error(error.message);
      return response(data);
    }

    if (path.length === 5 && path[3] === "messages" && method === "DELETE") {
      const messageId = path[4];
      const { error } = await session.client
        .from("messages")
        .update({
          content: null,
          deleted_at: new Date().toISOString(),
          status: "deleted",
        })
        .eq("id", messageId)
        .eq("conversation_id", conversationId)
        .eq("sender_id", currentUserId);

      if (error) throw new Error(error.message);
      return response({ ok: true });
    }
  }

  return errorResponse("Endpoint bulunamadÄ±.", 404);
}

async function handleNotifications(request: NextRequest, path: string[], method: string) {
  const session = await getAuthenticatedProfile(request);
  const userId = String(session.profile.id);

  if (path.length === 1 && method === "GET") {
    const { data, error } = await session.client
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    return response(
      ((data ?? []) as Record<string, unknown>[]).map((item) => ({
        ...item,
        is_read: Boolean(item.read_at),
        target_route: item.href,
      })),
    );
  }

  if (path.length === 2 && path[1] === "read-all" && method === "POST") {
    const { error } = await session.client
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) throw new Error(error.message);
    return response({ ok: true });
  }

  if (path.length === 3 && path[2] === "read" && method === "POST") {
    const { error } = await session.client
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", path[1])
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return response({ ok: true });
  }

  return errorResponse("Endpoint bulunamadÄ±.", 404);
}

async function handlePush(request: NextRequest, path: string[], method: string) {
  const session = await getAuthenticatedProfile(request);
  const userId = String(session.profile.id);

  if (path.length === 2 && path[1] === "token" && method === "POST") {
    const body = await bodyJson(request);
    const token = String(body.token ?? "").trim();
    const platform = String(body.platform ?? "android").trim() || "android";
    const deviceId = String(body.device_id ?? "").trim() || null;
    const deviceLabel = String(body.device_label ?? "").trim() || null;
    const appVersion = String(body.app_version ?? "").trim() || null;

    if (!token || token.length < 20) {
      throw new Error("Bildirim tokenı geçersiz.");
    }

    const { data, error } = await session.admin
      .from("mobile_push_tokens")
      .upsert(
        {
          user_id: userId,
          token,
          platform,
          device_id: deviceId,
          device_label: deviceLabel,
          app_version: appVersion,
          is_active: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "token" },
      )
      .select("id,user_id,platform,is_active,last_seen_at")
      .single();

    if (error) throw new Error(error.message);
    return response(data);
  }

  if (path.length === 2 && path[1] === "token" && method === "DELETE") {
    const body = await bodyJson(request);
    const token = String(body.token ?? "").trim();

    if (!token) return response({ ok: true });

    const { error } = await session.admin
      .from("mobile_push_tokens")
      .update({
        is_active: false,
        last_seen_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("token", token);

    if (error) throw new Error(error.message);
    return response({ ok: true });
  }

  return errorResponse("Endpoint bulunamadı.", 404);
}

async function friendshipDto(
  admin: SupabaseClientLike,
  friendship: Record<string, unknown>,
  currentUserId: string,
) {
  const otherId =
    String(friendship.requester_id) === currentUserId
      ? String(friendship.receiver_id)
      : String(friendship.requester_id);
  const profiles = await profileMapByIds(admin, [otherId]);

  return {
    id: friendship.id,
    status: friendship.status,
    created_at: friendship.created_at,
    user: profiles.get(otherId) ?? mobileUser(null),
  };
}

async function handleFriends(request: NextRequest, path: string[], method: string) {
  const session = await getAuthenticatedProfile(request);
  const userId = String(session.profile.id);

  if (path.length === 1 && method === "GET") {
    const status = request.nextUrl.searchParams.get("status") ?? "accepted";
    let query = session.admin.from("friendships").select("*").order("created_at", { ascending: false });

    if (status === "incoming") {
      query = query.eq("receiver_id", userId).eq("status", "pending");
    } else if (status === "outgoing") {
      query = query.eq("requester_id", userId).eq("status", "pending");
    } else {
      query = query.eq("status", status).or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
    }

    const { data, error } = await query.limit(50);
    if (error) throw new Error(error.message);

    return response(
      await Promise.all(
        ((data ?? []) as Record<string, unknown>[]).map((friendship) =>
          friendshipDto(session.admin, friendship, userId),
        ),
      ),
    );
  }

  if (path.length === 2 && path[1] === "search" && method === "GET") {
    const q = sanitizeFriendSearchQuery(request.nextUrl.searchParams.get("q"));
    if (q.length < 2) return response([]);

    const { data, error } = await session.admin
      .from("profiles")
      .select("id,first_name,last_name,full_name,username,tag,email,class_name,avatar_url,avatar_path,bio,role,participation_points")
      .neq("id", userId)
      .or(`username.ilike.%${q}%,tag.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .limit(12);

    if (error) throw new Error(error.message);

    const candidateIds = ((data ?? []) as Record<string, unknown>[]).map((profile) => String(profile.id));
    const { data: existing } = candidateIds.length
      ? await session.admin
          .from("friendships")
          .select("requester_id,receiver_id,status")
          .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      : { data: [] };

    const blocked = new Set<string>();
    for (const item of (existing ?? []) as Record<string, unknown>[]) {
      if (item.status !== "blocked") continue;
      blocked.add(String(item.requester_id) === userId ? String(item.receiver_id) : String(item.requester_id));
    }

    return response(
      ((data ?? []) as Record<string, unknown>[])
        .filter((profile) => !blocked.has(String(profile.id)))
        .map(mobileUser),
    );
  }

  if (path.length === 2 && path[1] === "requests" && method === "POST") {
    const body = await bodyJson(request);
    const receiverId = String(body.receiver_id ?? "");

    if (!receiverId || receiverId === userId) throw new Error("GeÃ§ersiz kullanÄ±cÄ±.");

    const { data: existing } = await session.admin
      .from("friendships")
      .select("*")
      .or(
        `and(requester_id.eq.${userId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${userId})`,
      )
      .maybeSingle();

    if (existing && ["pending", "accepted", "blocked"].includes(String(existing.status))) {
      throw new Error("Bu kullanÄ±cÄ±yla zaten bir arkadaÅŸlÄ±k kaydÄ± var.");
    }

    const { data, error } = await session.admin
      .from("friendships")
      .insert({ requester_id: userId, receiver_id: receiverId, status: "pending" })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    await notifyFriendRequest(session.admin, session.profile, userId, receiverId);

    return response(await friendshipDto(session.admin, data as Record<string, unknown>, userId));
  }

  if (path.length === 4 && path[1] === "requests" && method === "POST") {
    const friendshipId = path[2];
    const action = path[3];

    if (action === "accept" || action === "reject") {
      const { data, error } = await session.admin
        .from("friendships")
        .update({ status: action === "accept" ? "accepted" : "rejected" })
        .eq("id", friendshipId)
        .eq("receiver_id", userId)
        .eq("status", "pending")
        .select("*")
        .single();

      if (error) throw new Error(error.message);

      if (action === "accept") {
        await notifyFriendAccepted(session.admin, session.profile, userId, data.requester_id);
      }

      return response(await friendshipDto(session.admin, data as Record<string, unknown>, userId));
    }

    if (action === "cancel") {
      const { error } = await session.admin
        .from("friendships")
        .delete()
        .eq("id", friendshipId)
        .eq("requester_id", userId)
        .eq("status", "pending");
      if (error) throw new Error(error.message);
      return response({ ok: true });
    }
  }

  if (path.length === 2 && method === "DELETE") {
    const { error } = await session.admin
      .from("friendships")
      .delete()
      .eq("id", path[1])
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
    if (error) throw new Error(error.message);
    return response({ ok: true });
  }

  return errorResponse("Endpoint bulunamadÄ±.", 404);
}

async function handleAdmin(request: NextRequest, path: string[], method: string) {
  const session = await getAuthenticatedProfile(request);
  requireMobileAdminRole(session.profile);

  if (path.length === 2 && path[1] === "overview" && method === "GET") {
    const { q, role, page, limit, from, to } = adminListParams(request.nextUrl.searchParams);
    let usersQuery = session.admin
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (q) {
      usersQuery = usersQuery.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,username.ilike.%${q.replace("@", "")}%,tag.ilike.%${q}%`,
      );
    }

    if (role && ["student", "community_admin", "teacher", "admin"].includes(role)) {
      usersQuery = usersQuery.eq("role", role);
    }

    const [events, communities, polls, users] = await Promise.all([
      session.admin
        .from("events")
        .select("id,title,location,event_date,start_time,community_id,created_by")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(30),
      session.admin
        .from("communities")
        .select("id,name,description,created_by,created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(30),
      session.admin
        .from("polls")
        .select("id,title,description,created_by,created_at")
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(30),
      usersQuery,
    ]);

    for (const result of [events, communities, polls, users]) {
      if (result.error) throw new Error(result.error.message);
    }

    return response({
      events: ((events.data ?? []) as Record<string, unknown>[]).map((event) =>
        adminApprovalItem(event, `${event.event_date ?? ""} Â· ${event.location ?? ""}`),
      ),
      communities: ((communities.data ?? []) as Record<string, unknown>[]).map((community) =>
        adminApprovalItem(community, String(community.description ?? "Topluluk baÅŸvurusu")),
      ),
      polls: ((polls.data ?? []) as Record<string, unknown>[]).map((poll) =>
        adminApprovalItem(poll, String(poll.description ?? "Anket baÅŸvurusu")),
      ),
      users: ((users.data ?? []) as Record<string, unknown>[]).map(mobileUser),
      pagination: {
        page,
        limit,
        total: users.count ?? 0,
        has_more: to + 1 < (users.count ?? 0),
      },
    });
  }

  if (path.length === 2 && path[1] === "approvals" && method === "POST") {
    const body = await bodyJson(request);
    const type = String(body.type ?? "");
    const id = String(body.id ?? "");
    const decision = String(body.decision ?? "");
    const reason = String(body.reason ?? "Mobil admin panelinden reddedildi.").trim();

    if (!id || !["approve", "reject"].includes(decision)) {
      throw new Error("Onay iÅŸlemi eksik.");
    }

    if (type === "event") {
      const { error } = await session.admin
        .from("events")
        .update({
          status: decision === "approve" ? "approved" : "rejected",
          approved_by: decision === "approve" ? session.profile.id : null,
          approved_at: decision === "approve" ? new Date().toISOString() : null,
          rejection_reason: decision === "reject" ? reason : null,
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
      return response({ ok: true });
    }

    if (type === "community") {
      const { data: community, error } = await session.admin
        .from("communities")
        .update({
          status: decision === "approve" ? "approved" : "rejected",
          approved_by: decision === "approve" ? session.profile.id : null,
          approved_at: decision === "approve" ? new Date().toISOString() : null,
          rejection_reason: decision === "reject" ? reason : null,
        })
        .eq("id", id)
        .select("id,created_by")
        .maybeSingle();

      if (error) throw new Error(error.message);

      if (decision === "approve" && community) {
        await session.admin
          .from("community_members")
          .upsert(
            { community_id: community.id, user_id: community.created_by, role: "admin" },
            { onConflict: "community_id,user_id" },
          );
        await session.admin.from("profiles").update({ role: "community_admin" }).eq("id", community.created_by);
      }

      return response({ ok: true });
    }

    if (type === "poll") {
      const { error } = await session.admin
        .from("polls")
        .update({ status: decision === "approve" ? "open" : "closed" })
        .eq("id", id);
      if (error) throw new Error(error.message);
      return response({ ok: true });
    }

    throw new Error("Bilinmeyen onay tÃ¼rÃ¼.");
  }

  if (path.length === 4 && path[1] === "users" && path[3] === "role" && method === "PUT") {
    const userId = path[2];
    const body = await bodyJson(request);
    const role = String(body.role ?? "");

    if (!["student", "community_admin", "teacher", "admin"].includes(role)) {
      throw new Error("GeÃ§ersiz rol.");
    }

    if (userId === session.profile.id && role !== "admin") {
      throw new Error("Admin kendi rolÃ¼nÃ¼ dÃ¼ÅŸÃ¼remez.");
    }

    const { data, error } = await session.admin
      .from("profiles")
      .update({ role })
      .eq("id", userId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return response(mobileUser(data as Record<string, unknown>));
  }

  if (path.length === 4 && path[1] === "users" && path[3] === "suspension" && method === "PUT") {
    const userId = path[2];
    const body = await bodyJson(request);
    const isSuspended = Boolean(body.is_suspended);

    if (userId === session.profile.id && isSuspended) {
      throw new Error("Admin kendini askıya alamaz.");
    }

    const { data: target, error: targetError } = await session.admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (targetError) throw new Error(targetError.message);
    if (!target) throw new Error("Kullanıcı bulunamadı.");
    if (String(target.role) === "admin" && isSuspended) {
      throw new Error("Admin kullanıcısı askıya alınamaz.");
    }

    const { data, error } = await session.admin
      .from("profiles")
      .update({ is_suspended: isSuspended })
      .eq("id", userId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return response(mobileUser(data as Record<string, unknown>));
  }

  return errorResponse("Endpoint bulunamadÄ±.", 404);
}

export async function handleMobileRequest(request: NextRequest, context: MobileRouteContext, method: string) {
  try {
    const { path = [] } = await context.params;
    const root = path[0] ?? "";

    if (root === "auth" && path[1] === "login" && method === "POST") return handleAuthLogin(request);
    if (root === "auth" && path[1] === "register" && method === "POST") return handleAuthRegister(request);
    if (root === "auth" && path[1] === "me" && method === "GET") {
      const session = await getAuthenticatedProfile(request);
      return response(mobileUser(session.profile));
    }

    if (root === "profile") return handleProfile(request, path, method);
    if (root === "feed" && method === "GET") return handleFeed(request);
    if (root === "feed") return handleFeedWrite(request, path, method);
    if (root === "communities") return handleCommunities(request, path, method);
    if (root === "events") return handleEvents(request, path);
    if (root === "friends") return handleFriends(request, path, method);
    if (root === "messages") return handleMessages(request, path, method);
    if (root === "notifications") return handleNotifications(request, path, method);
    if (root === "push") return handlePush(request, path, method);
    if (root === "admin") return handleAdmin(request, path, method);

    return errorResponse("Endpoint bulunamadÄ±.", 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = /giriÅŸ|oturum|authenticated|unauthorized/i.test(message) ? 401 : 400;
    return errorResponse(error, status);
  }
}

