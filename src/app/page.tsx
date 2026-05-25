import {
  FeedLayout,
  LeftSidebar,
  MainFeed,
  RightSidebar,
  type FeedItem,
} from "@/components/home-social";
import { getHomeData } from "@/lib/data";
import type { FriendAttendance } from "@/lib/types";

export const dynamic = "force-dynamic";

type HomeTab = "for-you" | "today" | "events" | "communities";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tab = normalizeTab(params.tab);
  const data = await getHomeData();
  const signedIn = Boolean(data.profile);
  const friendItems = buildFriendItems(data);
  const feedItems = buildFeedItems(data, friendItems, tab, signedIn);

  return (
    <FeedLayout
      left={<LeftSidebar signedIn={signedIn} />}
      feed={
        <MainFeed
          items={feedItems}
          signedIn={signedIn}
          activeTab={tab}
        />
      }
      right={
        <RightSidebar
          events={data.events}
          communities={data.communities}
          friendItems={friendItems}
          signedIn={signedIn}
        />
      }
      signedIn={signedIn}
    />
  );
}

function buildFeedItems(
  data: Awaited<ReturnType<typeof getHomeData>>,
  friendItems: Array<{ title: string; body: string; href?: string; friends?: FriendAttendance[] }>,
  tab: HomeTab,
  signedIn: boolean,
) {
  const items: FeedItem[] = [];
  const today = new Date().toISOString().slice(0, 10);

  if (tab === "events") {
    data.events.forEach((event: any) => {
      items.push({
        type: "event",
        event,
        friends: data.friendAttendanceByEvent.get(event.id) ?? [],
      });
    });

    return items.slice(0, 12);
  }

  if (tab === "communities") {
    data.communities.forEach((community: any) => {
      items.push({ type: "community", community });
    });
    data.posts.slice(0, 4).forEach((post: any) => {
      items.push({ type: "post", post });
    });

    return items.slice(0, 12);
  }

  if (tab === "today") {
    data.events
      .filter((event: any) => event.event_date === today)
      .forEach((event: any) => {
        items.push({
          type: "event",
          event,
          friends: data.friendAttendanceByEvent.get(event.id) ?? [],
        });
      });
    data.announcements.slice(0, 2).forEach((announcement: any) => {
      items.push({ type: "announcement", announcement });
    });
    data.posts
      .filter((post: any) => post.created_at?.slice(0, 10) === today)
      .slice(0, 4)
      .forEach((post: any) => {
        items.push({ type: "post", post });
      });
    data.polls.slice(0, 1).forEach((poll: any) => {
      items.push({ type: "poll", poll });
    });
    if (signedIn && friendItems[0]) {
      items.push({ type: "friend", ...friendItems[0] });
    }

    return items.slice(0, 12);
  }

  if (data.events[0]) {
    items.push({
      type: "event",
      event: data.events[0],
      friends: data.friendAttendanceByEvent.get(data.events[0].id) ?? [],
    });
  }

  if (data.posts[0]) {
    items.push({ type: "post", post: data.posts[0] });
  }

  if (data.announcements[0]) {
    items.push({ type: "announcement", announcement: data.announcements[0] });
  }

  if (data.polls[0]) {
    items.push({ type: "poll", poll: data.polls[0] });
  }

  if (data.communities[0]) {
    items.push({ type: "community", community: data.communities[0] });
  }

  if (signedIn && friendItems[0]) {
    items.push({ type: "friend", ...friendItems[0] });
  }

  data.events.slice(1, 4).forEach((event: any) => {
    items.push({
      type: "event",
      event,
      friends: data.friendAttendanceByEvent.get(event.id) ?? [],
    });
  });

  data.posts.slice(1, 4).forEach((post: any) => {
    items.push({ type: "post", post });
  });

  data.communities.slice(1, 3).forEach((community: any) => {
    items.push({ type: "community", community });
  });

  return items.slice(0, 12);
}

function normalizeTab(value: string | string[] | undefined): HomeTab {
  const tab = Array.isArray(value) ? value[0] : value;

  if (tab === "today" || tab === "events" || tab === "communities") {
    return tab;
  }

  return "for-you";
}

function buildFriendItems(data: Awaited<ReturnType<typeof getHomeData>>) {
  return Array.from(data.friendAttendanceByEvent.entries())
    .map(([eventId, friends]) => {
      const event = data.events.find((item: any) => item.id === eventId);

      if (!event) {
        return null;
      }

      const firstFriend = friends[0];
      const title =
        friends.length > 1
          ? `${firstFriend?.first_name ?? "Bir arkadaşın"} ve ${friends.length - 1} arkadaşın gidiyor`
          : `${firstFriend?.first_name ?? "Bir arkadaşın"} gidiyor`;

      return {
        title,
        body: event.title,
        href: `/events/${event.id}`,
        friends,
      };
    })
    .filter(Boolean) as Array<{
    title: string;
    body: string;
    href: string;
    friends: FriendAttendance[];
  }>;
}
