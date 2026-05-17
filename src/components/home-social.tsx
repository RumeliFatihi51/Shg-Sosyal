import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  Home,
  MapPin,
  Megaphone,
  MessageCircle,
  Send,
  Sparkles,
  UsersRound,
  Vote,
} from "lucide-react";
import { AnimatedCard, AnimatedSection, StaggeredGrid } from "@/components/motion";
import { SubmitButton } from "@/components/submit-button";
import { Avatar, Badge, Card, LinkButton } from "@/components/ui";
import { joinCommunityAction } from "@/lib/actions/communities";
import { toggleEventParticipationAction } from "@/lib/actions/events";
import { cn, formatDate, formatTime, fullName } from "@/lib/utils";
import { postScore } from "@/features/posts/post-card";
import type { FriendAttendance } from "@/lib/types";

type IconType = ComponentType<{ className?: string }>;
type Tone = "orange" | "blue" | "green" | "purple" | "amber" | "slate";

type FeedItem =
  | { type: "event"; event: any; friends: FriendAttendance[] }
  | { type: "post"; post: any }
  | { type: "announcement"; announcement: any }
  | { type: "poll"; poll: any }
  | { type: "community"; community: any }
  | { type: "friend"; title: string; body: string; href?: string; friends?: FriendAttendance[] };

const categoryTone: Record<string, "orange" | "blue" | "green" | "amber" | "purple" | "slate"> = {
  Etkinlik: "orange",
  Duyuru: "purple",
  Anket: "blue",
  Topluluk: "green",
  Arkadaş: "amber",
  Gönderi: "slate",
};

const toneClasses: Record<Tone, string> = {
  orange: "bg-orange-100 text-orange-700 ring-orange-200/80",
  blue: "bg-blue-100 text-blue-700 ring-blue-200/80",
  green: "bg-emerald-100 text-emerald-700 ring-emerald-200/80",
  purple: "bg-purple-100 text-purple-700 ring-purple-200/80",
  amber: "bg-amber-100 text-amber-800 ring-amber-200/80",
  slate: "bg-slate-100 text-slate-700 ring-slate-200/80",
};

const accentClasses: Record<Tone, string> = {
  orange: "from-orange-500 to-amber-300",
  blue: "from-blue-500 to-cyan-300",
  green: "from-emerald-500 to-lime-300",
  purple: "from-purple-500 to-fuchsia-300",
  amber: "from-amber-500 to-yellow-300",
  slate: "from-slate-800 to-slate-400",
};

export function FeedLayout({
  left,
  feed,
  right,
  signedIn,
}: {
  left: ReactNode;
  feed: ReactNode;
  right: ReactNode;
  signedIn: boolean;
}) {
  return (
    <div className="relative pb-20 lg:pb-0">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 rounded-[3rem] bg-[radial-gradient(circle_at_18%_14%,rgba(240,90,40,0.12),transparent_30%),radial-gradient(circle_at_86%_8%,rgba(14,165,233,0.09),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.6),transparent)]" />
      <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_304px] xl:items-start">
        <AnimatedSection className="hidden xl:sticky xl:top-8 xl:block">{left}</AnimatedSection>
        <AnimatedSection delay={0.03}>{feed}</AnimatedSection>
        <AnimatedSection className="xl:sticky xl:top-8" delay={0.06}>{right}</AnimatedSection>
      </div>
      <MobileBottomNav signedIn={signedIn} />
    </div>
  );
}

export const AppShell = FeedLayout;

export function LeftSidebar({ signedIn }: { signedIn: boolean }) {
  const links = [
    { href: "/", label: "Ana Akış", icon: Home },
    { href: "/events", label: "Etkinlikler", icon: CalendarDays },
    { href: "/communities", label: "Topluluklar", icon: UsersRound },
    { href: "/calendar", label: "Takvim", icon: Clock3 },
    { href: signedIn ? "/friends" : "/login", label: "Arkadaşlar", icon: UsersRound },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="px-3 pb-2 pt-1">
          <div className="text-sm font-black text-slate-950">ŞHG Sosyal</div>
          <div className="mt-0.5 text-xs font-bold text-slate-400">Okulun ana akışı.</div>
        </div>
        <nav className="grid gap-1">
          {links.map((item, index) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-black transition",
                index === 0
                  ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10"
                  : "text-slate-700 hover:bg-orange-50 hover:text-[var(--primary)]",
              )}
            >
              <span className="flex items-center gap-3">
                <item.icon className="size-4" />
                {item.label}
              </span>
              <ChevronRight className="size-4 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Link>
          ))}
        </nav>
      </Card>

      <QuickActionCard signedIn={signedIn} />
    </div>
  );
}

export function QuickActionCard({ signedIn }: { signedIn: boolean }) {
  const actions = [
    { href: signedIn ? "/events/new" : "/login", label: "Etkinlik öner", icon: CalendarDays },
    { href: signedIn ? "/communities/new" : "/login", label: "Topluluk kur", icon: UsersRound },
    { href: signedIn ? "/posts" : "/login", label: "Gönderi paylaş", icon: Send },
  ];

  return (
    <Card className="space-y-3 bg-slate-950 p-4 text-white">
      <div>
        <h2 className="text-base font-black">Hızlı oluştur</h2>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
          Okul akışına yeni bir hareket ekle.
        </p>
      </div>
      <div className="grid gap-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm font-black text-white transition hover:bg-white/20"
          >
            <span className="flex size-9 items-center justify-center rounded-2xl bg-white text-slate-950">
              <action.icon className="size-4" />
            </span>
            {action.label}
          </Link>
        ))}
      </div>
    </Card>
  );
}

export function MainFeed({
  todayCount,
  participantCount,
  weekPostCount,
  items,
  signedIn,
}: {
  todayCount: number;
  participantCount: number;
  weekPostCount: number;
  items: FeedItem[];
  signedIn: boolean;
}) {
  const featuredItem = items.find((item) => item.type === "event") ?? items[0];

  return (
    <main className="space-y-4">
      <CategoryChips signedIn={signedIn} />
      <TodayTimeline
        todayCount={todayCount}
        participantCount={participantCount}
        weekPostCount={weekPostCount}
        items={items}
        signedIn={signedIn}
      />
      <FeaturedMovementCard item={featuredItem} signedIn={signedIn} />

      {items.length ? (
        <section className="space-y-3">
          <SectionHeading
            eyebrow="Okul Akışı"
            title="Bugün konuşulanlar"
            body="Etkinlikler, duyurular ve topluluk hareketleri tek akışta."
          />
          <StaggeredGrid className="grid gap-4">
            {items.map((item, index) => (
              <FeedCard key={feedKey(item, index)} item={item} signedIn={signedIn} />
            ))}
          </StaggeredGrid>
        </section>
      ) : (
        <EmptyStateCard
          title="Bugün henüz sakin, ilk hareketi sen başlat."
          body="Bir etkinlik öner, topluluk kur ya da ilk paylaşımı yap. Okul akışı buradan dolmaya başlar."
          action={<LinkButton href={signedIn ? "/events/new" : "/login"}>İlk hareketi başlat</LinkButton>}
        />
      )}
    </main>
  );
}

export function CategoryChips({ signedIn }: { signedIn: boolean }) {
  const chips = [
    { href: "/", label: "Bugün" },
    { href: "/events", label: "Yaklaşan" },
    { href: "/posts?sort=popular", label: "Popüler" },
    { href: signedIn ? "/friends" : "/login", label: "Arkadaşların" },
    { href: "/communities", label: "Topluluklar" },
  ];

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((chip, index) => (
        <Link
          key={chip.label}
          href={chip.href}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-black shadow-sm transition",
            index === 0
              ? "border-slate-950 bg-slate-950 text-white"
              : "border-white/75 bg-white/82 text-slate-700 hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]",
          )}
        >
          {chip.label}
        </Link>
      ))}
    </div>
  );
}

export function TodayTimeline({
  todayCount,
  participantCount,
  weekPostCount,
  items,
  signedIn,
}: {
  todayCount: number;
  participantCount: number;
  weekPostCount: number;
  items: FeedItem[];
  signedIn: boolean;
}) {
  const timeline = buildTimelineItems(items, todayCount, participantCount, weekPostCount, signedIn);

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-white/70 bg-white/58 px-5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase text-[var(--primary)]">Bugün Okulda</div>
            <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
              Okulun canlı akışı burada.
            </h1>
          </div>
          <Badge tone={todayCount ? "green" : "amber"}>
            {todayCount ? "bugün hareket var" : "ilk hareket bekleniyor"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-3">
        {timeline.map((item) => (
          <div key={item.label} className="relative overflow-hidden rounded-3xl border border-white/75 bg-white/74 p-4 shadow-sm">
            <span className={cn("flex size-10 items-center justify-center rounded-2xl ring-1", toneClasses[item.tone])}>
              <item.icon className="size-4" />
            </span>
            <div className="mt-3 text-sm font-black text-slate-950">{item.value}</div>
            <div className="mt-0.5 text-xs font-bold text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function FeaturedMovementCard({
  item,
  signedIn,
}: {
  item?: FeedItem;
  signedIn: boolean;
}) {
  if (!item) {
    return (
      <EmptyStateCard
        title="Öne çıkan hareket yakında burada."
        body="Onaylanan etkinlikler, duyurular ve popüler gönderiler okul akışında öne çıkar."
        action={<LinkButton href={signedIn ? "/posts" : "/login"} variant="secondary">Paylaşım yap</LinkButton>}
      />
    );
  }

  const featured = getFeaturedMeta(item);

  return (
    <AnimatedCard>
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
        <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", accentClasses[featured.tone])} />
        <div className="absolute -right-16 -top-20 size-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={categoryTone[featured.category] ?? "orange"}>{featured.category}</Badge>
              <span className="text-xs font-black uppercase tracking-wide text-slate-300">Öne çıkan hareket</span>
            </div>
            <h2 className="mt-4 max-w-2xl text-2xl font-black leading-tight sm:text-3xl">
              {featured.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{featured.body}</p>
          </div>
          <LinkButton href={featured.href} variant="secondary" className="bg-white text-slate-950 hover:bg-orange-50">
            {featured.action}
          </LinkButton>
        </div>
      </section>
    </AnimatedCard>
  );
}

export function FeedCard({ item, signedIn }: { item: FeedItem; signedIn: boolean }) {
  if (item.type === "event") {
    return <EventFeedCard event={item.event} friends={item.friends} signedIn={signedIn} />;
  }

  if (item.type === "post") {
    return <PostFeedCard post={item.post} />;
  }

  if (item.type === "announcement") {
    return <AnnouncementCard announcement={item.announcement} />;
  }

  if (item.type === "poll") {
    return <PollFeedCard poll={item.poll} />;
  }

  if (item.type === "community") {
    return <CommunityFeedCard community={item.community} signedIn={signedIn} />;
  }

  return (
    <FriendActivityCard
      title={item.title}
      body={item.body}
      href={item.href}
      friends={item.friends}
      signedIn={signedIn}
    />
  );
}

export function EventFeedCard({
  event,
  friends,
  signedIn,
}: {
  event: any;
  friends: FriendAttendance[];
  signedIn: boolean;
}) {
  const { day, month } = getDateParts(event.event_date);
  const participantCount = getParticipantCount(event);

  return (
    <AnimatedCard>
      <Card className="overflow-hidden p-0 hover:border-orange-200 hover:shadow-[0_20px_58px_rgba(240,90,40,0.12)]">
        <div className="grid grid-cols-[5px_1fr]">
          <div className="bg-gradient-to-b from-orange-500 via-amber-300 to-orange-100" />
          <div>
            <div className="flex gap-4 p-5">
              <Link
                href={`/events/${event.id}`}
                className="flex size-16 shrink-0 flex-col items-center justify-center rounded-3xl bg-slate-950 text-white shadow-lg shadow-slate-950/15"
              >
                <span className="text-2xl font-black leading-none">{day}</span>
                <span className="mt-1 text-[11px] font-black uppercase">{month}</span>
              </Link>
              <div className="min-w-0 flex-1">
                <FeedMeta
                  category="Etkinlik"
                  icon={CalendarDays}
                  meta={`${formatTime(event.start_time)} · ${cleanText(event.location, "Konum yakında")}`}
                />
                <Link href={`/events/${event.id}`} className="mt-3 block text-xl font-black leading-snug text-slate-950 hover:text-[var(--primary)]">
                  {cleanText(event.title, "Yeni etkinlik")}
                </Link>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                  {cleanText(event.description, "Etkinlik detayları yakında paylaşılacak.")}
                </p>
              </div>
            </div>

            <div className="border-t border-white/70 bg-white/55 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-black text-slate-500">
                  <InfoPill icon={CalendarDays}>{formatDate(event.event_date)}</InfoPill>
                  <InfoPill icon={MapPin}>{cleanText(event.communities?.name, "Okul etkinliği")}</InfoPill>
                  <span>{participantCount ? `${participantCount} kişi katılıyor` : "İlk katılımı sen başlat"}</span>
                  {friends.length ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                      <span className="flex -space-x-2">
                        {friends.slice(0, 3).map((friend) => (
                          <Avatar key={friend.id} firstName={friend.first_name} lastName={friend.last_name} size="sm" />
                        ))}
                      </span>
                      {friends.length} arkadaşın gidiyor
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {signedIn ? (
                    <form action={toggleEventParticipationAction}>
                      <input type="hidden" name="event_id" value={event.id} />
                      <input type="hidden" name="is_joined" value="false" />
                      <SubmitButton pendingLabel="Kaydediliyor..." variant="secondary">
                        Katılıyorum
                      </SubmitButton>
                    </form>
                  ) : null}
                  <LinkButton href={`/events/${event.id}`} variant={signedIn ? "ghost" : "secondary"}>
                    Detayları gör
                  </LinkButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </AnimatedCard>
  );
}

export function CommunityFeedCard({
  community,
  signedIn,
}: {
  community: any;
  signedIn: boolean;
}) {
  const { members, posts } = getCommunityStats(community);

  return (
    <BaseFeedCard
      category="Topluluk"
      icon={UsersRound}
      meta="Bugün aktif"
      title={cleanText(community.name, "Yeni topluluk")}
      body={cleanText(community.description, "Bu topluluk okul akışında yeni hareketler başlatabilir.")}
      href={`/communities/${community.slug}`}
      tone="green"
      footer={
        <>
          <span>{members ? `${members} üye` : "Yeni üyeler bekleniyor"}</span>
          <span>{posts ? `${posts} paylaşım` : "İlk paylaşım bekleniyor"}</span>
          <span>Bu hafta aktif</span>
        </>
      }
      action={
        signedIn ? (
          <form action={joinCommunityAction}>
            <input type="hidden" name="community_id" value={community.id} />
            <input type="hidden" name="slug" value={community.slug} />
            <SubmitButton pendingLabel="Katılım kaydediliyor..." variant="secondary">
              Katıl
            </SubmitButton>
          </form>
        ) : (
          <LinkButton href="/login" variant="secondary">Giriş yap</LinkButton>
        )
      }
    />
  );
}

export function AnnouncementCard({ announcement }: { announcement: any }) {
  return (
    <BaseFeedCard
      category="Duyuru"
      icon={Megaphone}
      meta={`Sabit duyuru · ${relativeDate(announcement.created_at)}`}
      title={cleanText(announcement.title, "Yeni duyuru")}
      body={cleanText(announcement.body, "Duyurular yakında burada.")}
      href="/notifications"
      tone="purple"
      footer={<span>Okul duyurusu</span>}
      action={<LinkButton href="/notifications" variant="secondary">Bildirimleri gör</LinkButton>}
    />
  );
}

export function PollFeedCard({ poll }: { poll: any }) {
  const options = poll.poll_options ?? [];
  const totalVotes = options.reduce(
    (sum: number, option: any) => sum + (Array.isArray(option.poll_votes) ? option.poll_votes.length : 0),
    0,
  );

  return (
    <BaseFeedCard
      category="Anket"
      icon={Vote}
      meta="Okul anketi"
      title={cleanText(poll.title, "Yeni anket")}
      body={cleanText(poll.description, "Okul gündemine dair kısa bir anket.")}
      href="/polls"
      tone="blue"
      footer={<span>{totalVotes ? `${totalVotes} oy` : "İlk oyu sen ver"}</span>}
      action={<LinkButton href="/polls" variant="secondary">Oy ver</LinkButton>}
    >
      <div className="mt-4 grid gap-2">
        {(options.length ? options : [{ id: "empty", label: "Seçenekler hazırlanıyor", poll_votes: [] }])
          .slice(0, 3)
          .map((option: any) => {
            const votes = Array.isArray(option.poll_votes) ? option.poll_votes.length : 0;
            const percent = totalVotes ? Math.round((votes / totalVotes) * 100) : 16;

            return (
              <div key={option.id} className="rounded-2xl border border-blue-100 bg-blue-50/55 p-3">
                <div className="flex items-center justify-between gap-3 text-xs font-black text-slate-700">
                  <span className="line-clamp-1">{cleanText(option.label, "Seçenek")}</span>
                  <span>{totalVotes ? `%${percent}` : "oy bekliyor"}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(percent, 10)}%` }} />
                </div>
              </div>
            );
          })}
      </div>
    </BaseFeedCard>
  );
}

export function FriendActivityCard({
  title,
  body,
  href,
  friends,
  signedIn,
}: {
  title: string;
  body: string;
  href?: string;
  friends?: FriendAttendance[];
  signedIn: boolean;
}) {
  return (
    <BaseFeedCard
      category="Arkadaş"
      icon={UsersRound}
      meta={signedIn ? "Arkadaş hareketi" : "Giriş yapınca açılır"}
      title={cleanText(title, "Arkadaşların ne yapıyor?")}
      body={cleanText(body, "Giriş yapınca arkadaşlarının katıldığı etkinlikleri burada görebilirsin.")}
      href={href ?? (signedIn ? "/friends" : "/login")}
      tone="amber"
      footer={<span>Sadece kabul edilmiş arkadaşların görünür</span>}
      action={<LinkButton href={href ?? (signedIn ? "/friends" : "/login")} variant="secondary">Detayları gör</LinkButton>}
    >
      <div className="mt-4 flex items-center gap-3">
        <div className="flex -space-x-2">
          {(friends ?? []).slice(0, 4).map((friend) => (
            <Avatar key={friend.id} firstName={friend.first_name} lastName={friend.last_name} size="sm" />
          ))}
          {!friends?.length ? (
            <>
              <Avatar firstName="ŞHG" lastName="Sosyal" size="sm" />
              <Avatar firstName="Okul" lastName="Akışı" size="sm" />
            </>
          ) : null}
        </div>
        <span className="text-xs font-bold text-slate-500">Sosyal kanıt burada görünür.</span>
      </div>
    </BaseFeedCard>
  );
}

export function RightSidebar({
  events,
  communities,
  friendItems,
  signedIn,
}: {
  events: any[];
  communities: any[];
  friendItems: Array<{ title: string; body: string; href?: string; friends?: FriendAttendance[] }>;
  signedIn: boolean;
}) {
  const featuredEvent = events[0];

  return (
    <aside className="space-y-4">
      <MiniPanel icon={CalendarDays} title="Bugün ve yakında" href="/events">
        {events.length ? (
          <div className="grid gap-2">
            {events.slice(0, 4).map((event) => {
              const { day, month } = getDateParts(event.event_date);

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex gap-3 rounded-2xl border border-white/75 bg-white/72 p-3 transition hover:border-orange-200 hover:bg-orange-50/60"
                >
                  <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <span className="text-base font-black">{day}</span>
                    <span className="text-[10px] font-black uppercase">{month}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-1 text-sm font-black text-slate-950">{cleanText(event.title, "Etkinlik")}</span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">
                      {formatTime(event.start_time)} · {cleanText(event.location, "Konum yakında")}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyStateCard
            compact
            title="Bugün için etkinlik hazırlanıyor."
            body="Onaylanan etkinlikler burada görünecek."
            action={<LinkButton href={signedIn ? "/events/new" : "/login"} variant="secondary">Etkinlik öner</LinkButton>}
          />
        )}
      </MiniPanel>

      <CommunityPanel communities={communities} />
      <FriendActivityPanel items={friendItems} signedIn={signedIn} />

      <Card className="overflow-hidden p-0">
        <div className="bg-slate-950 p-5 text-white">
          <Badge tone="orange">Haftanın etkinliği</Badge>
          <h2 className="mt-4 text-xl font-black">
            {cleanText(featuredEvent?.title, "Öne çıkan etkinlik yakında burada")}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">
            {featuredEvent
              ? `${formatDate(featuredEvent.event_date)} · ${cleanText(featuredEvent.location, "Konum yakında")}`
              : "Yeni bir etkinlik yayınlandığında okul akışında öne çıkar."}
          </p>
        </div>
        <div className="p-4">
          <LinkButton href={featuredEvent ? `/events/${featuredEvent.id}` : signedIn ? "/events/new" : "/login"} variant="secondary" className="w-full">
            {featuredEvent ? "Detayları gör" : "Etkinlik öner"}
          </LinkButton>
        </div>
      </Card>
    </aside>
  );
}

export function CommunityPanel({ communities }: { communities: any[] }) {
  return (
    <MiniPanel icon={UsersRound} title="Aktif topluluklar" href="/communities">
      {communities.length ? (
        <div className="grid gap-2">
          {communities.slice(0, 4).map((community) => {
            const { members, posts } = getCommunityStats(community);

            return (
              <Link
                key={community.id}
                href={`/communities/${community.slug}`}
                className="rounded-2xl border border-white/75 bg-white/72 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/55"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-950">{cleanText(community.name, "Topluluk")}</div>
                    <div className="mt-1 text-xs font-bold text-slate-500">
                      {members ? `${members} üye` : "Yeni üyeler bekleniyor"} · {posts ? `${posts} paylaşım` : "İlk paylaşım bekleniyor"}
                    </div>
                  </div>
                  <Badge tone="green">aktif</Badge>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyStateCard
          compact
          title="Topluluklar hareketlenmeye hazır."
          body="Onaylanan ilk topluluk burada görünecek."
        />
      )}
    </MiniPanel>
  );
}

export function FriendActivityPanel({
  items,
  signedIn,
}: {
  items: Array<{ title: string; body: string; href?: string; friends?: FriendAttendance[] }>;
  signedIn: boolean;
}) {
  return (
    <MiniPanel icon={UsersRound} title="Arkadaşların ne yapıyor?" href={signedIn ? "/friends" : "/login"}>
      {items.length ? (
        <div className="grid gap-2">
          {items.slice(0, 3).map((item) => (
            <Link
              key={item.title}
              href={item.href ?? "/friends"}
              className="block rounded-2xl border border-blue-100 bg-blue-50/70 p-3 transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {(item.friends ?? []).slice(0, 3).map((friend) => (
                    <Avatar key={friend.id} firstName={friend.first_name} lastName={friend.last_name} size="sm" />
                  ))}
                </div>
                <div className="min-w-0">
                  <div className="line-clamp-1 text-sm font-black text-slate-950">{cleanText(item.title, "Arkadaş hareketi")}</div>
                  <div className="line-clamp-1 text-xs font-semibold text-slate-600">{cleanText(item.body, "Etkinlik")}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyStateCard
          compact
          title={signedIn ? "Arkadaş hareketleri yakında burada." : "Giriş yapınca arkadaşlarını görebilirsin."}
          body={signedIn ? "Arkadaşların etkinliklere katıldığında burada görünür." : "Arkadaşlarının katıldığı etkinlikler özel olarak öne çıkar."}
        />
      )}
    </MiniPanel>
  );
}

export function MobileBottomNav({ signedIn }: { signedIn: boolean }) {
  const links = [
    { href: "/", label: "Akış", icon: Home, active: true },
    { href: "/events", label: "Etkinlik", icon: CalendarDays },
    { href: "/communities", label: "Topluluk", icon: UsersRound },
    { href: signedIn ? "/friends" : "/login", label: "Arkadaş", icon: UsersRound },
    { href: signedIn ? "/notifications" : "/login", label: "Bildirim", icon: Bell },
  ];

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 gap-1 rounded-[1.6rem] border border-white/70 bg-white/88 p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:hidden">
      {links.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-black transition",
            item.active ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-orange-50 hover:text-[var(--primary)]",
          )}
        >
          <item.icon className="size-4" />
          <span className="truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function EmptyStateCard({
  title,
  body,
  action,
  compact = false,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-dashed border-orange-200/80 bg-white/72 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur",
        compact ? "p-4" : "p-7",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-300" />
      <div className={cn("mx-auto mb-3 flex items-center justify-center rounded-2xl bg-orange-50 text-[var(--primary)] shadow-inner", compact ? "size-10" : "size-12")}>
        <Sparkles className="size-5" />
      </div>
      <h3 className={cn("font-black text-slate-950", compact ? "text-sm" : "text-lg")}>{title}</h3>
      <p className={cn("mx-auto mt-2 leading-6 text-slate-600", compact ? "text-xs" : "max-w-md text-sm")}>{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

function PostFeedCard({ post }: { post: any }) {
  const commentCount = getCommentCount(post);
  const score = postScore(post);

  return (
    <BaseFeedCard
      category="Gönderi"
      icon={MessageCircle}
      meta={`${cleanText(post.communities?.name, "Topluluk")} · ${relativeDate(post.created_at)}`}
      title={cleanText(post.title, "Yeni gönderi")}
      body={cleanText(post.body, "Bu haftanın ilk paylaşımı burada öne çıkabilir.")}
      href={`/posts/${post.id}`}
      tone="slate"
      footer={
        <>
          <span>{score ? `${score} skor` : "İlk beğeni bekleniyor"}</span>
          <span>{commentCount ? `${commentCount} yorum` : "İlk yorum bekleniyor"}</span>
        </>
      }
      action={<LinkButton href={`/posts/${post.id}`} variant="secondary">Yorum yap</LinkButton>}
    >
      <Link href={`/profile/${post.author_id}`} className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950">
        <Avatar firstName={post.profiles?.first_name} lastName={post.profiles?.last_name} size="sm" />
        <span>{cleanText(fullName(post.profiles), "Öğrenci")}</span>
      </Link>
    </BaseFeedCard>
  );
}

function BaseFeedCard({
  category,
  icon,
  meta,
  title,
  body,
  href,
  tone,
  footer,
  action,
  children,
}: {
  category: string;
  icon: IconType;
  meta: string;
  title: string;
  body?: string | null;
  href?: string;
  tone: Tone;
  footer?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const titleNode = href ? (
    <Link href={href} className="hover:text-[var(--primary)]">
      {title}
    </Link>
  ) : (
    title
  );

  return (
    <AnimatedCard>
      <Card className="overflow-hidden p-0 hover:border-orange-200 hover:shadow-[0_18px_52px_rgba(15,23,42,0.10)]">
        <div className={cn("h-1 bg-gradient-to-r", accentClasses[tone])} />
        <div className="p-5">
          <FeedMeta category={category} icon={icon} meta={meta} />
          <h2 className="mt-3 text-xl font-black leading-snug text-slate-950">{titleNode}</h2>
          {body ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{body}</p> : null}
          {children}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/70 bg-white/55 px-5 py-4">
          <div className="flex flex-wrap gap-3 text-xs font-black text-slate-500">{footer}</div>
          {action}
        </div>
      </Card>
    </AnimatedCard>
  );
}

function FeedMeta({
  category,
  icon: Icon,
  meta,
}: {
  category: string;
  icon: IconType;
  meta: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className={cn("flex size-9 items-center justify-center rounded-2xl ring-1", toneClasses[toneForCategory(category)])}>
          <Icon className="size-4" />
        </span>
        <Badge tone={categoryTone[category] ?? "slate"}>{category}</Badge>
      </div>
      <span className="text-xs font-bold text-slate-500">{cleanText(meta, "az önce")}</span>
    </div>
  );
}

function MiniPanel({
  icon: Icon,
  title,
  href,
  children,
}: {
  icon: IconType;
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-orange-50 text-[var(--primary)]">
            <Icon className="size-4" />
          </span>
          <h2 className="text-base font-black text-slate-950">{title}</h2>
        </div>
        <Link href={href} className="text-xs font-black text-[var(--primary)]">
          Aç
        </Link>
      </div>
      {children}
    </Card>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-1">
      <div>
        <div className="text-xs font-black uppercase text-[var(--primary)]">{eyebrow}</div>
        <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
      </div>
      <p className="max-w-sm text-sm font-semibold leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function InfoPill({ icon: Icon, children }: { icon: IconType; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}

function buildTimelineItems(
  items: FeedItem[],
  todayCount: number,
  participantCount: number,
  weekPostCount: number,
  signedIn: boolean,
) {
  const hasPost = items.some((item) => item.type === "post");

  return [
    {
      label: "Bugün",
      value: todayCount ? `${todayCount} etkinlik hazırlanmış` : "Bugün için etkinlik hazırlanıyor",
      icon: CalendarDays,
      tone: "orange" as const,
    },
    {
      label: "Katılım",
      value: participantCount ? `${participantCount} kişi katılıyor` : "İlk katılımı sen başlat",
      icon: UsersRound,
      tone: "green" as const,
    },
    {
      label: "Konuşulanlar",
      value: weekPostCount || hasPost ? `${weekPostCount || "Yeni"} paylaşım var` : "Bu haftanın ilk paylaşımını yap",
      icon: MessageCircle,
      tone: signedIn ? "blue" as const : "amber" as const,
    },
  ];
}

function getFeaturedMeta(item: FeedItem) {
  if (item.type === "event") {
    return {
      category: "Etkinlik",
      tone: "orange" as const,
      title: cleanText(item.event.title, "Yakındaki etkinlik"),
      body: `${formatDate(item.event.event_date)} · ${formatTime(item.event.start_time)} · ${cleanText(item.event.location, "Konum yakında")}`,
      href: `/events/${item.event.id}`,
      action: "Etkinliği aç",
    };
  }

  if (item.type === "post") {
    return {
      category: "Gönderi",
      tone: "slate" as const,
      title: cleanText(item.post.title, "Yeni gönderi"),
      body: cleanText(item.post.body, "Okul gündemindeki yeni paylaşım."),
      href: `/posts/${item.post.id}`,
      action: "Yorum yap",
    };
  }

  if (item.type === "announcement") {
    return {
      category: "Duyuru",
      tone: "purple" as const,
      title: cleanText(item.announcement.title, "Yeni duyuru"),
      body: cleanText(item.announcement.body, "Duyurular yakında burada."),
      href: "/notifications",
      action: "Duyuruyu gör",
    };
  }

  if (item.type === "poll") {
    return {
      category: "Anket",
      tone: "blue" as const,
      title: cleanText(item.poll.title, "Yeni anket"),
      body: cleanText(item.poll.description, "Okul gündemine dair kısa bir anket."),
      href: "/polls",
      action: "Oy ver",
    };
  }

  if (item.type === "community") {
    return {
      category: "Topluluk",
      tone: "green" as const,
      title: cleanText(item.community.name, "Aktif topluluk"),
      body: cleanText(item.community.description, "Topluluklar okul akışını hareketlendirir."),
      href: `/communities/${item.community.slug}`,
      action: "Topluluğu aç",
    };
  }

  return {
    category: "Arkadaş",
    tone: "amber" as const,
    title: cleanText(item.title, "Arkadaş hareketi"),
    body: cleanText(item.body, "Arkadaşlarının etkinlik hareketleri burada görünür."),
    href: item.href ?? "/friends",
    action: "Detayları gör",
  };
}

function feedKey(item: FeedItem, index: number) {
  if (item.type === "event") return `event-${item.event.id}`;
  if (item.type === "post") return `post-${item.post.id}`;
  if (item.type === "announcement") return `announcement-${item.announcement.id ?? index}`;
  if (item.type === "poll") return `poll-${item.poll.id ?? index}`;
  if (item.type === "community") return `community-${item.community.id}`;
  return `friend-${index}`;
}

function toneForCategory(category: string): Tone {
  if (category === "Etkinlik") return "orange";
  if (category === "Duyuru") return "purple";
  if (category === "Anket") return "blue";
  if (category === "Topluluk") return "green";
  if (category === "Arkadaş") return "amber";
  return "slate";
}

function relativeDate(value?: string | null) {
  if (!value) return "az önce";

  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));

  if (minutes < 1) return "şimdi";
  if (minutes < 60) return `${minutes} dk`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;

  return `${Math.floor(hours / 24)} g`;
}

function getDateParts(value?: string | null) {
  const eventDate = value ? new Date(`${value}T00:00:00`) : new Date();

  return {
    day: eventDate.getDate(),
    month: eventDate.toLocaleDateString("tr-TR", { month: "short" }),
  };
}

function getParticipantCount(event: any) {
  return event.participant_count ?? event.event_participants?.[0]?.count ?? 0;
}

function getCommentCount(post: any) {
  if (Array.isArray(post.comments)) {
    return post.comments.length;
  }

  return post.comments?.[0]?.count ?? 0;
}

function getCommunityStats(community: any) {
  return {
    members: community.community_members?.[0]?.count ?? community.member_count ?? 0,
    posts: community.posts?.[0]?.count ?? community.post_count ?? 0,
  };
}

function cleanText(value?: string | null, fallback = "") {
  if (!value) {
    return fallback;
  }

  return value
    .replaceAll("Bilisim", "Bilişim")
    .replaceAll("Atolyesi", "Atölyesi")
    .replaceAll("Toplulugu", "Topluluğu")
    .replaceAll("Uretken", "Üretken")
    .replaceAll("Cok Amacli Salon", "Çok Amaçlı Salon")
    .replaceAll("Yapay Zeka Toplulugu", "Yapay Zeka Topluluğu")
    .replaceAll("Muzik", "Müzik")
    .replaceAll("Gonderi", "Gönderi")
    .replaceAll("Ogrenci", "Öğrenci")
    .replaceAll("Sos" + "yas", "ŞHG Sosyal")
    .replaceAll("Sosya\u015f", "ŞHG Sosyal");
}

export type { FeedItem };
