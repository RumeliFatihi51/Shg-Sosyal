import Link from "next/link";
import { Bell, CalendarDays, CheckCheck, MessageCircle, UsersRound } from "lucide-react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/notifications";
import { getNotificationsData } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";
import { Button, LinkButton } from "@/components/ui";
import {
  InlineEmpty,
  PageTabs,
  RailItem,
  RailSection,
  SocialBadge,
  SocialPage,
  StickyPageHeader,
  TimelineRow,
  TimelineSurface,
} from "@/components/social-ui";
import type { Notification } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const query = await searchParams;
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <SocialPage rail={<RailSection title="Bildirimler"><RailItem title="Giriş yap" meta="Bildirimlerini gör." icon={Bell} /></RailSection>}>
        <StickyPageHeader title="Bildirimler" />
        <TimelineSurface>
          <InlineEmpty
            title="Giriş yap"
            body="Bildirimlerin hesabına bağlı tutulur."
            action={<LinkButton href="/login">Giriş yap</LinkButton>}
          />
        </TimelineSurface>
      </SocialPage>
    );
  }

  const { notifications } = await getNotificationsData();
  const unread = notifications.filter((item) => !item.read_at).length;
  const tab = query.tab ?? "all";
  const filtered = filterNotifications(notifications, tab);

  return (
    <SocialPage rail={<NotificationsRail notifications={notifications} unread={unread} />}>
      <StickyPageHeader
        title="Bildirimler"
        action={unread ? (
          <form action={markAllNotificationsReadAction}>
            <Button variant="secondary" className="h-10 px-4">
              <CheckCheck className="size-4" />
              Okundu yap
            </Button>
          </form>
        ) : null}
      >
        <PageTabs
          tabs={[
            { label: "Tümü", href: "/notifications?tab=all", active: tab === "all" },
            { label: "Okunmamış", href: "/notifications?tab=unread", active: tab === "unread" },
            { label: "Arkadaşlar", href: "/notifications?tab=friends", active: tab === "friends" },
            { label: "Etkinlikler", href: "/notifications?tab=events", active: tab === "events" },
            { label: "Topluluklar", href: "/notifications?tab=communities", active: tab === "communities" },
          ]}
        />
      </StickyPageHeader>

      <TimelineSurface>
        {filtered.length ? filtered.map((notification) => (
          <NotificationRow key={notification.id} notification={notification} />
        )) : (
          <InlineEmpty
            title={tab === "unread" ? "Okunmamış bildirim yok" : "Bildirim yok"}
            body="Yeni bildirim gelince listelenir."
          />
        )}
      </TimelineSurface>
    </SocialPage>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  const unread = !notification.read_at;

  return (
    <TimelineRow
      icon={
        <span className={`relative flex size-9 items-center justify-center rounded-full ${unread ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
          {unread ? <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-blue-600" /> : null}
          <NotificationGlyph type={notification.type} />
        </span>
      }
      title={notification.title}
      meta={`· ${formatRelative(notification.created_at)}`}
      badge={unread ? <SocialBadge tone="blue">Yeni</SocialBadge> : null}
      body={notification.body}
      actions={
        <>
          {notification.href ? (
            <Link href={notification.href} className="font-black text-slate-950 hover:text-orange-700">
              Aç
            </Link>
          ) : null}
          {unread ? (
            <form action={markNotificationReadAction}>
              <input type="hidden" name="notification_id" value={notification.id} />
              <input type="hidden" name="href" value="/notifications" />
              <button type="submit" className="hover:text-slate-950">Okundu</button>
            </form>
          ) : null}
        </>
      }
    />
  );
}

function NotificationsRail({
  notifications,
  unread,
}: {
  notifications: Notification[];
  unread: number;
}) {
  const latest = notifications.slice(0, 4);

  return (
    <>
      <RailSection title="Bildirim durumu">
        <RailItem title={`${unread} okunmamış`} meta="Yeni bildirimler" icon={Bell} />
        <RailItem title={`${notifications.length} bildirim`} meta="Son kayıtlar" icon={CheckCheck} />
      </RailSection>
      <RailSection title="Son aktiviteler">
        {latest.length ? latest.map((notification) => (
            <RailItem
              key={notification.id}
              title={notification.title}
              meta={formatRelative(notification.created_at)}
              href={notification.href ?? undefined}
              icon={Bell}
            />
        )) : <RailItem title="Henüz bildirim yok." icon={Bell} />}
      </RailSection>
    </>
  );
}

function filterNotifications(notifications: Notification[], tab: string) {
  if (tab === "unread") {
    return notifications.filter((item) => !item.read_at);
  }

  if (tab === "friends") {
    return notifications.filter((item) => item.type.includes("friend") || item.type === "dm_message");
  }

  if (tab === "events") {
    return notifications.filter((item) => item.type.includes("event"));
  }

  if (tab === "communities") {
    return notifications.filter((item) => item.type.includes("community"));
  }

  return notifications;
}

function NotificationGlyph({ type }: { type: Notification["type"] }) {
  if (type.includes("friend") || type === "dm_message") return <UsersRound className="size-4" />;
  if (type.includes("event")) return <CalendarDays className="size-4" />;
  if (type.includes("comment") || type.includes("post")) return <MessageCircle className="size-4" />;

  return <Bell className="size-4" />;
}

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));

  if (minutes < 1) return "şimdi";
  if (minutes < 60) return `${minutes} dk`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;

  return `${Math.floor(hours / 24)} g`;
}
