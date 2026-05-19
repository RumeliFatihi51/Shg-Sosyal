import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Home,
  MapPin,
  Megaphone,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  UsersRound,
  Vote,
} from "lucide-react";
import { AnimatedCard, AnimatedSection, StaggeredGrid } from "@/components/motion";
import { SubmitButton } from "@/components/submit-button";
import { Avatar, Badge, LinkButton } from "@/components/ui";
import { joinCommunityAction } from "@/lib/actions/communities";
import { toggleEventParticipationAction } from "@/lib/actions/events";
import { cn, formatDate, formatTime, fullName } from "@/lib/utils";
import { postScore } from "@/features/posts/post-card";
import type { FriendAttendance } from "@/lib/types";

type IconType = ComponentType<{ className?: string }>;
type Tone = "ember" | "sky" | "mint" | "violet" | "sun" | "ink";

type FeedItem =
  | { type: "event"; event: any; friends: FriendAttendance[] }
  | { type: "post"; post: any }
  | { type: "announcement"; announcement: any }
  | { type: "poll"; poll: any }
  | { type: "community"; community: any }
  | { type: "friend"; title: string; body: string; href?: string; friends?: FriendAttendance[] };

const tone = {
  ember: {
    chip: "bg-orange-100 text-orange-800 ring-orange-200",
    text: "text-orange-600",
    line: "from-orange-500 via-amber-300 to-rose-300",
    wash: "bg-orange-50/80",
    border: "border-orange-200/80",
  },
  sky: {
    chip: "bg-sky-100 text-sky-800 ring-sky-200",
    text: "text-sky-600",
    line: "from-sky-500 via-cyan-300 to-blue-300",
    wash: "bg-sky-50/80",
    border: "border-sky-200/80",
  },
  mint: {
    chip: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    text: "text-emerald-600",
    line: "from-emerald-500 via-lime-300 to-teal-300",
    wash: "bg-emerald-50/80",
    border: "border-emerald-200/80",
  },
  violet: {
    chip: "bg-violet-100 text-violet-800 ring-violet-200",
    text: "text-violet-600",
    line: "from-violet-500 via-fuchsia-300 to-indigo-300",
    wash: "bg-violet-50/80",
    border: "border-violet-200/80",
  },
  sun: {
    chip: "bg-amber-100 text-amber-900 ring-amber-200",
    text: "text-amber-700",
    line: "from-amber-500 via-yellow-300 to-orange-300",
    wash: "bg-amber-50/80",
    border: "border-amber-200/80",
  },
  ink: {
    chip: "bg-slate-100 text-slate-800 ring-slate-200",
    text: "text-slate-700",
    line: "from-slate-950 via-slate-500 to-slate-300",
    wash: "bg-slate-50/80",
    border: "border-slate-200/80",
  },
};

export function FeedLayout({
  feed,
  right,
  signedIn,
}: {
  left?: ReactNode;
  feed: ReactNode;
  right: ReactNode;
  signedIn: boolean;
}) {
  return (
    <div className="relative isolate pb-20 lg:pb-2">
      <div className="pointer-events-none absolute inset-x-[-1rem] top-[-2rem] -z-10 h-[28rem] overflow-hidden rounded-[3rem]">
        <div className="absolute left-[8%] top-8 h-44 w-44 rounded-full bg-orange-300/24 blur-3xl" />
        <div className="absolute right-[8%] top-16 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.68),rgba(255,248,239,0.45),rgba(255,255,255,0.34))]" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px] xl:items-start">
        <AnimatedSection delay={0.02}>{feed}</AnimatedSection>
        <AnimatedSection className="xl:sticky xl:top-8" delay={0.07}>{right}</AnimatedSection>
      </div>
      <MobileBottomNav signedIn={signedIn} />
    </div>
  );
}

export const AppShell = FeedLayout;

export function LeftSidebar({ signedIn }: { signedIn: boolean }) {
  return <QuickActionCard signedIn={signedIn} />;
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
    <main className="space-y-5">
      <StreamHeader
        todayCount={todayCount}
        participantCount={participantCount}
        weekPostCount={weekPostCount}
        signedIn={signedIn}
      />

      <CategoryChips signedIn={signedIn} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)]">
        <FeaturedMovementCard item={featuredItem} signedIn={signedIn} />
        <TodayTimeline
          todayCount={todayCount}
          participantCount={participantCount}
          weekPostCount={weekPostCount}
          items={items}
          signedIn={signedIn}
        />
      </div>

      {items.length ? (
        <section className="space-y-4">
          <SectionHeading
            eyebrow="Canlı Akış"
            title="Okulda şu an olanlar"
            body="Her içerik türü kendi ritmiyle akar; etkinlik, duyuru, anket ve arkadaş hareketleri tek bakışta ayrılır."
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
          body="Bir etkinlik öner, topluluk kur ya da okul gündemine ilk paylaşımı bırak."
          action={<LinkButton href={signedIn ? "/events/new" : "/login"}>İlk hareketi başlat</LinkButton>}
        />
      )}
    </main>
  );
}

export function StreamHeader({
  todayCount,
  participantCount,
  weekPostCount,
  signedIn,
}: {
  todayCount: number;
  participantCount: number;
  weekPostCount: number;
  signedIn: boolean;
}) {
  const metrics = [
    {
      label: "Bugün",
      value: todayCount ? `${todayCount} etkinlik` : "Etkinlik hazırlanıyor",
      icon: CalendarDays,
      tone: "ember" as const,
    },
    {
      label: "Katılım",
      value: participantCount ? `${participantCount} kişi` : "İlk katılımı başlat",
      icon: UsersRound,
      tone: "mint" as const,
    },
    {
      label: "Konuşma",
      value: weekPostCount ? `${weekPostCount} paylaşım` : "İlk paylaşımı yap",
      icon: MessageCircle,
      tone: "sky" as const,
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[2.2rem] bg-[#12100f] p-5 text-white shadow-[0_30px_90px_rgba(18,16,15,0.25)] sm:p-7">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-300 to-sky-300" />
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-orange-400/18 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-12 size-72 rounded-full bg-sky-400/14 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-black text-slate-200">
            <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
            ŞHG Sosyal · okulun ana akışı
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[0.96] tracking-tight text-balance sm:text-6xl">
            Okulda olan biten, tek ekranda canlı.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Etkinlikleri gör, topluluklara katıl, arkadaşlarının nereye aktığını takip et. Burası duyuru panosu değil; okulun sosyal akışı.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="/posts" className="bg-white text-slate-950 hover:bg-orange-50">
              Akışa gir
            </LinkButton>
            <LinkButton href={signedIn ? "/events/new" : "/login"} variant="secondary" className="border-white/15 bg-white/10 text-white hover:bg-white/20">
              <Plus className="size-4" />
              Hareket başlat
            </LinkButton>
          </div>
        </div>

        <div className="grid gap-2 rounded-[1.7rem] border border-white/10 bg-white/10 p-2 backdrop-blur">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex items-center gap-3 rounded-[1.3rem] bg-white/10 px-3 py-3">
              <span className={cn("flex size-10 items-center justify-center rounded-2xl ring-1", tone[metric.tone].chip)}>
                <metric.icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black">{metric.value}</span>
                <span className="block text-xs font-bold text-slate-400">{metric.label}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CategoryChips({ signedIn }: { signedIn: boolean }) {
  const chips = [
    { href: "/", label: "Bugün", icon: Flame },
    { href: "/events", label: "Etkinlik", icon: CalendarDays },
    { href: "/posts?sort=popular", label: "Popüler", icon: Sparkles },
    { href: signedIn ? "/friends" : "/login", label: "Arkadaşların", icon: UsersRound },
    { href: "/communities", label: "Topluluk", icon: Home },
  ];

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((chip, index) => (
        <Link
          key={chip.label}
          href={chip.href}
          className={cn(
            "group inline-flex h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-black shadow-sm transition",
            index === 0
              ? "border-slate-950 bg-slate-950 text-white"
              : "border-white/80 bg-white/80 text-slate-700 backdrop-blur hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50",
          )}
        >
          <chip.icon className="size-4" />
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
    <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/74 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="absolute inset-y-6 left-8 w-px bg-gradient-to-b from-orange-300 via-sky-300 to-transparent" />
      <div className="relative mb-4 pl-9">
        <div className="text-xs font-black uppercase text-[var(--primary)]">Bugün Okulda</div>
        <h2 className="mt-1 text-xl font-black text-slate-950">Günün kısa ritmi</h2>
      </div>
      <div className="relative grid gap-3">
        {timeline.map((item) => (
          <div key={item.label} className="grid grid-cols-[2.35rem_1fr] items-center gap-3">
            <span className={cn("z-10 flex size-10 items-center justify-center rounded-2xl ring-1 shadow-sm", tone[item.tone].chip)}>
              <item.icon className="size-4" />
            </span>
            <div className="rounded-[1.3rem] border border-white/80 bg-white/78 px-3 py-3">
              <div className="text-sm font-black text-slate-950">{item.value}</div>
              <div className="mt-0.5 text-xs font-bold text-slate-500">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
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
        title="Bugünün öne çıkanı yakında burada."
        body="Onaylanan etkinlikler, duyurular ve popüler paylaşımlar okul akışında öne çıkar."
        action={<LinkButton href={signedIn ? "/posts" : "/login"} variant="secondary">İlk paylaşımı yap</LinkButton>}
      />
    );
  }

  const featured = getFeaturedMeta(item);

  return (
    <AnimatedCard>
      <section className="group relative min-h-[22rem] overflow-hidden rounded-[2.2rem] bg-[#181411] p-5 text-white shadow-[0_34px_95px_rgba(24,20,17,0.26)]">
        <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", tone[featured.tone].line)} />
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className={cn("absolute -bottom-28 left-8 size-64 rounded-full blur-3xl", tone[featured.tone].wash)} />
        <div className="relative flex h-full flex-col justify-between gap-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-950">Bugünün öne çıkanı</span>
              <TonePill toneName={featured.tone}>{featured.category}</TonePill>
            </div>
            <h2 className="mt-5 max-w-2xl text-3xl font-black leading-[1.02] tracking-tight text-balance sm:text-5xl">
              {featured.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">{featured.body}</p>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/10 px-4 py-3 text-xs font-bold text-slate-300">
              Okul akışında bugün dikkat çeken hareket
            </div>
            <LinkButton href={featured.href} variant="secondary" className="bg-white text-slate-950">
              {featured.action}
            </LinkButton>
          </div>
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
    return <AnnouncementFeedCard announcement={item.announcement} />;
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
  const capacity = Number(event.capacity ?? 0);
  const hasCapacity = capacity > 0;
  const fill = hasCapacity ? Math.min(100, Math.round((participantCount / capacity) * 100)) : 0;
  const fillWidth = hasCapacity ? `${Math.max(fill, participantCount ? 8 : 4)}%` : "100%";

  return (
    <AnimatedCard>
      <article className="group overflow-hidden rounded-[2.1rem] border border-orange-200/70 bg-white/82 shadow-[0_24px_72px_rgba(240,90,40,0.11)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-orange-300">
        <div className="grid md:grid-cols-[11.5rem_1fr]">
          <Link
            href={`/events/${event.id}`}
            className="relative min-h-44 overflow-hidden bg-[#17110e] p-5 text-white md:min-h-full"
          >
            <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-orange-500 via-amber-300 to-rose-300" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_22%,rgba(251,146,60,0.42),transparent_34%),radial-gradient(circle_at_90%_80%,rgba(14,165,233,0.22),transparent_36%)]" />
            <div className="relative flex h-full flex-col justify-between">
              <span className="inline-flex w-fit rounded-full bg-white/12 px-2.5 py-1 text-xs font-black uppercase text-orange-100 ring-1 ring-white/15">
                Etkinlik
              </span>
              <span>
                <span className="block text-6xl font-black leading-none">{day}</span>
                <span className="mt-1 block text-sm font-black uppercase tracking-wide text-orange-100">{month}</span>
              </span>
            </div>
          </Link>

          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <InfoPill icon={Clock3}>{formatTime(event.start_time)}</InfoPill>
                <InfoPill icon={MapPin}>{cleanText(event.location, "Konum yakında")}</InfoPill>
                <InfoPill icon={UsersRound}>{cleanText(event.communities?.name, "Okul etkinliği")}</InfoPill>
              </div>
              <TonePill toneName="ember">Canlı etkinlik</TonePill>
            </div>

            <Link href={`/events/${event.id}`} className="mt-4 block text-2xl font-black leading-tight text-slate-950 hover:text-[var(--primary)] sm:text-3xl">
              {cleanText(event.title, "Yeni etkinlik")}
            </Link>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
              {cleanText(event.description, "Etkinlik detayları yakında paylaşılacak.")}
            </p>

            <div className="mt-5 rounded-[1.35rem] border border-orange-100 bg-orange-50/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-black text-slate-700">
                <span>{participantCount ? `${participantCount} kişi katılıyor` : "İlk katılımı sen başlat"}</span>
                <span>{hasCapacity ? `${capacity} kontenjan` : "Kontenjan açık"}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className={cn(
                    "h-full rounded-full",
                    hasCapacity ? "bg-gradient-to-r from-orange-500 to-amber-300" : "bg-gradient-to-r from-emerald-400 to-sky-300",
                  )}
                  style={{ width: fillWidth }}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {friends.length ? (
                    friends.slice(0, 4).map((friend) => (
                      <Avatar key={friend.id} firstName={friend.first_name} lastName={friend.last_name} size="sm" />
                    ))
                  ) : (
                    <>
                      <Avatar firstName="İlk" lastName="Katılım" size="sm" />
                      <Avatar firstName="ŞHG" lastName="Sosyal" size="sm" />
                    </>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {friends.length ? `${friends.length} arkadaşın gidiyor` : "Arkadaş katılımı yakında görünür"}
                </span>
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
                  Detayı aç
                </LinkButton>
              </div>
            </div>
          </div>
        </div>
      </article>
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
  const initials = communityInitials(cleanText(community.name, "Topluluk"));

  return (
    <AnimatedCard>
      <article className="overflow-hidden rounded-[2rem] border border-emerald-200/70 bg-white/82 p-5 shadow-[0_22px_68px_rgba(16,185,129,0.10)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-300">
        <div className="flex items-start justify-between gap-4">
          <Link
            href={`/communities/${community.slug}`}
            className="flex size-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-emerald-500 via-lime-300 to-sky-300 text-xl font-black text-slate-950 shadow-lg shadow-emerald-900/10"
          >
            {initials}
          </Link>
          <TonePill toneName="mint">Bugün aktif</TonePill>
        </div>

        <Link href={`/communities/${community.slug}`} className="mt-5 block text-2xl font-black leading-tight text-slate-950 hover:text-emerald-700">
          {cleanText(community.name, "Yeni topluluk")}
        </Link>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
          {cleanText(community.description, "Bu topluluk okul akışında yeni hareketler başlatabilir.")}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <MiniMetric label="Üye" value={members ? String(members) : "bekleniyor"} />
          <MiniMetric label="Paylaşım" value={posts ? String(posts) : "ilk gönderi"} />
          <MiniMetric label="Aktivite" value="bugün" />
        </div>

        <div className="mt-5 flex justify-end">
          {signedIn ? (
            <form action={joinCommunityAction}>
              <input type="hidden" name="community_id" value={community.id} />
              <input type="hidden" name="slug" value={community.slug} />
              <SubmitButton pendingLabel="Katılım kaydediliyor..." variant="secondary">
                Katıl
              </SubmitButton>
            </form>
          ) : (
            <LinkButton href="/login" variant="secondary">Giriş yap</LinkButton>
          )}
        </div>
      </article>
    </AnimatedCard>
  );
}

export function AnnouncementFeedCard({ announcement }: { announcement: any }) {
  return (
    <AnimatedCard>
      <article className="overflow-hidden rounded-[1.8rem] border border-violet-100 bg-white/86 shadow-[0_18px_54px_rgba(88,28,135,0.08)] backdrop-blur-xl">
        <div className="grid grid-cols-[0.45rem_1fr]">
          <div className="bg-gradient-to-b from-violet-500 via-fuchsia-300 to-indigo-300" />
          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-black text-violet-700">
                <span className="flex size-9 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <Megaphone className="size-4" />
                </span>
                Okul duyurusu
              </div>
              <Badge tone="purple">Sabitlendi</Badge>
            </div>
            <h2 className="mt-4 text-xl font-black leading-tight text-slate-950">
              {cleanText(announcement.title, "Yeni duyuru")}
            </h2>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
              {cleanText(announcement.body, "Duyurular yakında burada.")}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-500">
              <span>{relativeDate(announcement.created_at)}</span>
              <Link href="/notifications" className="font-black text-violet-700">
                Bildirimleri gör
              </Link>
            </div>
          </div>
        </div>
      </article>
    </AnimatedCard>
  );
}

export function PollFeedCard({ poll }: { poll: any }) {
  const options = poll.poll_options ?? [];
  const totalVotes = options.reduce(
    (sum: number, option: any) => sum + (Array.isArray(option.poll_votes) ? option.poll_votes.length : 0),
    0,
  );
  const pollOptions = options.length
    ? options
    : [{ id: "empty", label: "İlk seçenek hazırlanıyor", poll_votes: [] }];
  const closesLabel = poll.closes_at
    ? `Kapanış: ${formatDate(poll.closes_at.slice(0, 10))}`
    : "Açık anket";

  return (
    <AnimatedCard>
      <article className="overflow-hidden rounded-[2rem] border border-sky-200/70 bg-sky-950 text-white shadow-[0_24px_76px_rgba(12,74,110,0.22)]">
        <div className="relative p-5">
          <div className="absolute -right-16 -top-20 size-56 rounded-full bg-sky-300/20 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-sky-100 ring-1 ring-white/10">
                <Vote className="size-4" />
                Anket
              </span>
              <span className="text-xs font-black text-sky-200">{closesLabel}</span>
            </div>
            <h2 className="mt-5 text-2xl font-black leading-tight text-white">
              {cleanText(poll.title, "Yeni anket")}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-sky-100/80">
              {cleanText(poll.description, "Okul gündemine dair kısa bir anket.")}
            </p>

            <div className="mt-5 grid gap-2">
              {pollOptions.slice(0, 4).map((option: any) => {
                const votes = Array.isArray(option.poll_votes) ? option.poll_votes.length : 0;
                const percent = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;

                return (
                  <div key={option.id} className="rounded-[1.15rem] border border-white/10 bg-white/10 p-3">
                    <div className="flex items-center justify-between gap-3 text-xs font-black">
                      <span className="line-clamp-1">{cleanText(option.label, "Seçenek")}</span>
                      <span>{totalVotes ? `%${percent}` : "oy bekliyor"}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-sky-100"
                        style={{ width: `${totalVotes ? Math.max(percent, 8) : 18}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-black text-sky-100">
                {totalVotes ? `${totalVotes} oy kullanıldı` : "İlk oyu sen ver"}
              </span>
              <LinkButton href="/polls" variant="secondary" className="bg-white text-slate-950">
                Oy ver
              </LinkButton>
            </div>
          </div>
        </div>
      </article>
    </AnimatedCard>
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
  const targetHref = href ?? (signedIn ? "/friends" : "/login");

  return (
    <AnimatedCard>
      <Link
        href={targetHref}
        className="group flex items-center gap-4 rounded-[1.6rem] border border-amber-200/70 bg-amber-50/82 px-4 py-3 shadow-[0_16px_44px_rgba(245,158,11,0.10)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-amber-300"
      >
        <span className="relative flex -space-x-2">
          {(friends ?? []).length ? (
            friends?.slice(0, 4).map((friend) => (
              <Avatar key={friend.id} firstName={friend.first_name} lastName={friend.last_name} size="sm" />
            ))
          ) : (
            <>
              <Avatar firstName="ŞHG" lastName="Sosyal" size="sm" />
              <Avatar firstName="Okul" lastName="Akışı" size="sm" />
            </>
          )}
          <span className="absolute -right-1 -top-1 size-3 rounded-full bg-emerald-400 ring-2 ring-amber-50" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block line-clamp-1 text-sm font-black text-slate-950">
            {cleanText(title, "Arkadaşların ne yapıyor?")}
          </span>
          <span className="mt-0.5 block line-clamp-1 text-xs font-bold text-slate-600">
            {cleanText(body, "Giriş yapınca arkadaşlarının katıldığı etkinlikleri burada görebilirsin.")}
          </span>
        </span>
        <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-black text-amber-800 sm:inline-flex">
          hareket
        </span>
      </Link>
    </AnimatedCard>
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
      <QuickActionCard signedIn={signedIn} />
      <MiniPanel icon={CalendarDays} title="Yakında" href="/events" toneName="ember">
        {events.length ? (
          <div className="grid gap-2">
            {events.slice(0, 4).map((event) => {
              const { day, month } = getDateParts(event.event_date);

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="grid grid-cols-[3rem_1fr] gap-3 rounded-[1.35rem] border border-white/75 bg-white/75 p-3 transition hover:border-orange-200 hover:bg-orange-50/70"
                >
                  <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-950 text-white">
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
            title="Etkinlik hazırlanıyor."
            body="Onaylanan etkinlikler burada görünür."
            action={<LinkButton href={signedIn ? "/events/new" : "/login"} variant="secondary">Etkinlik öner</LinkButton>}
          />
        )}
      </MiniPanel>

      <CommunityPanel communities={communities} />
      <FriendActivityPanel items={friendItems} signedIn={signedIn} />

      <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
        <div className="p-5">
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
        <div className="border-t border-white/10 p-4">
          <LinkButton href={featuredEvent ? `/events/${featuredEvent.id}` : signedIn ? "/events/new" : "/login"} variant="secondary" className="w-full bg-white text-slate-950">
            {featuredEvent ? "Detayları gör" : "Etkinlik öner"}
          </LinkButton>
        </div>
      </section>
    </aside>
  );
}

export function CommunityPanel({ communities }: { communities: any[] }) {
  return (
    <MiniPanel icon={UsersRound} title="Aktif topluluklar" href="/communities" toneName="mint">
      {communities.length ? (
        <div className="grid gap-2">
          {communities.slice(0, 4).map((community) => {
            const { members, posts } = getCommunityStats(community);

            return (
              <Link
                key={community.id}
                href={`/communities/${community.slug}`}
                className="rounded-[1.35rem] border border-white/75 bg-white/75 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/65"
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
        <EmptyStateCard compact title="Topluluklar hazır." body="Onaylanan ilk topluluk burada görünecek." />
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
    <MiniPanel icon={UsersRound} title="Arkadaşların" href={signedIn ? "/friends" : "/login"} toneName="sky">
      {items.length ? (
        <div className="grid gap-2">
          {items.slice(0, 3).map((item) => (
            <Link
              key={item.title}
              href={item.href ?? "/friends"}
              className="block rounded-[1.35rem] border border-sky-100 bg-sky-50/72 p-3 transition hover:border-sky-200 hover:bg-sky-50"
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
          title={signedIn ? "Arkadaş hareketleri yakında." : "Giriş yapınca açılır."}
          body={signedIn ? "Arkadaşların etkinliklere katıldığında burada görünür." : "Arkadaşlarının katıldığı etkinlikler öne çıkar."}
        />
      )}
    </MiniPanel>
  );
}

export function QuickActionCard({ signedIn }: { signedIn: boolean }) {
  const actions = [
    { href: signedIn ? "/events/new" : "/login", label: "Etkinlik öner", icon: CalendarDays },
    { href: signedIn ? "/communities/new" : "/login", label: "Topluluk kur", icon: UsersRound },
    { href: signedIn ? "/posts" : "/login", label: "Gönderi paylaş", icon: Send },
  ];

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-950">Hızlı hareket</h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Akışa yeni bir şey ekle.</p>
        </div>
        <Sparkles className="size-5 text-[var(--primary)]" />
      </div>
      <div className="mt-4 grid gap-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 rounded-[1.25rem] border border-white/75 bg-white/72 px-3 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50"
          >
            <span className="flex size-9 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <action.icon className="size-4" />
            </span>
            {action.label}
          </Link>
        ))}
      </div>
    </section>
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
        "relative overflow-hidden rounded-[2rem] border border-dashed border-orange-200/80 bg-gradient-to-br from-white via-orange-50/80 to-sky-50/70 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur",
        compact ? "p-4" : "p-7",
      )}
    >
      <div className="absolute -right-10 -top-10 size-32 rounded-full bg-orange-200/40 blur-2xl" />
      <div className="absolute -bottom-12 left-10 size-36 rounded-full bg-sky-200/40 blur-2xl" />
      <div className={cn("relative mx-auto mb-3 flex items-center justify-center rounded-2xl bg-white text-[var(--primary)] shadow-inner", compact ? "size-10" : "size-12")}>
        <Sparkles className="size-5" />
      </div>
      <h3 className={cn("relative font-black text-slate-950", compact ? "text-sm" : "text-lg")}>{title}</h3>
      <p className={cn("relative mx-auto mt-2 leading-6 text-slate-600", compact ? "text-xs" : "max-w-md text-sm")}>{body}</p>
      {action ? <div className="relative mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

function PostFeedCard({ post }: { post: any }) {
  const commentCount = getCommentCount(post);
  const score = postScore(post);

  return (
    <AnimatedCard>
      <article className="overflow-hidden rounded-[1.9rem] border border-slate-200/80 bg-white/84 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-slate-300">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <Avatar firstName={post.profiles?.first_name} lastName={post.profiles?.last_name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                <Link href={`/profile/${post.author_id}`} className="font-black text-slate-800 hover:text-slate-950">
                  {cleanText(fullName(post.profiles), "Öğrenci")}
                </Link>
                <span>·</span>
                <span>{cleanText(post.communities?.name, "Topluluk")}</span>
                <span>·</span>
                <span>{relativeDate(post.created_at)}</span>
              </div>
              <Link href={`/posts/${post.id}`} className="mt-2 block text-xl font-black leading-tight text-slate-950 hover:text-[var(--primary)]">
                {cleanText(post.title, "Yeni gönderi")}
              </Link>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                {cleanText(post.body, "Bu haftanın ilk paylaşımı burada öne çıkabilir.")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-3">
          <div className="flex gap-2 text-xs font-black text-slate-600">
            <span className="rounded-full bg-white px-3 py-1">{score ? `${score} skor` : "İlk beğeni bekleniyor"}</span>
            <span className="rounded-full bg-white px-3 py-1">{commentCount ? `${commentCount} yorum` : "İlk yorum bekleniyor"}</span>
          </div>
          <Link href={`/posts/${post.id}`} className="text-xs font-black text-slate-900">
            Yorum yap
          </Link>
        </div>
      </article>
    </AnimatedCard>
  );
}

function MiniPanel({
  icon: Icon,
  title,
  href,
  toneName,
  children,
}: {
  icon: IconType;
  title: string;
  href: string;
  toneName: Tone;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/74 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn("flex size-9 items-center justify-center rounded-2xl ring-1", tone[toneName].chip)}>
            <Icon className="size-4" />
          </span>
          <h2 className="text-base font-black text-slate-950">{title}</h2>
        </div>
        <Link href={href} className={cn("text-xs font-black", tone[toneName].text)}>
          Aç
        </Link>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TonePill({ toneName, children }: { toneName: Tone; children: ReactNode }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-black ring-1", tone[toneName].chip)}>
      {children}
    </span>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/70 px-3 py-2">
      <div className="text-sm font-black text-slate-950">{value}</div>
      <div className="text-[11px] font-bold text-slate-500">{label}</div>
    </div>
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
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
      </div>
      <p className="max-w-sm text-sm font-semibold leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function InfoPill({ icon: Icon, children }: { icon: IconType; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-slate-600 shadow-sm">
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
      tone: "ember" as const,
    },
    {
      label: "Katılım",
      value: participantCount ? `${participantCount} kişi katılıyor` : "İlk katılımı sen başlat",
      icon: CheckCircle2,
      tone: "mint" as const,
    },
    {
      label: "Konuşulanlar",
      value: weekPostCount || hasPost ? `${weekPostCount || "Yeni"} paylaşım var` : "Bu haftanın ilk paylaşımını yap",
      icon: MessageCircle,
      tone: signedIn ? "sky" as const : "sun" as const,
    },
  ];
}

function getFeaturedMeta(item: FeedItem) {
  if (item.type === "event") {
    return {
      category: "Etkinlik",
      tone: "ember" as const,
      title: cleanText(item.event.title, "Yakındaki etkinlik"),
      body: `${formatDate(item.event.event_date)} · ${formatTime(item.event.start_time)} · ${cleanText(item.event.location, "Konum yakında")}`,
      href: `/events/${item.event.id}`,
      action: "Etkinliği aç",
    };
  }

  if (item.type === "post") {
    return {
      category: "Gönderi",
      tone: "ink" as const,
      title: cleanText(item.post.title, "Yeni gönderi"),
      body: cleanText(item.post.body, "Okul gündemindeki yeni paylaşım."),
      href: `/posts/${item.post.id}`,
      action: "Yorum yap",
    };
  }

  if (item.type === "announcement") {
    return {
      category: "Duyuru",
      tone: "violet" as const,
      title: cleanText(item.announcement.title, "Yeni duyuru"),
      body: cleanText(item.announcement.body, "Duyurular yakında burada."),
      href: "/notifications",
      action: "Duyuruyu gör",
    };
  }

  if (item.type === "poll") {
    return {
      category: "Anket",
      tone: "sky" as const,
      title: cleanText(item.poll.title, "Yeni anket"),
      body: cleanText(item.poll.description, "Okul gündemine dair kısa bir anket."),
      href: "/polls",
      action: "Oy ver",
    };
  }

  if (item.type === "community") {
    return {
      category: "Topluluk",
      tone: "mint" as const,
      title: cleanText(item.community.name, "Aktif topluluk"),
      body: cleanText(item.community.description, "Topluluklar okul akışını hareketlendirir."),
      href: `/communities/${item.community.slug}`,
      action: "Topluluğu aç",
    };
  }

  return {
    category: "Arkadaş",
    tone: "sun" as const,
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

function communityInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
    .join("");
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
    .replaceAll("gelistirme", "geliştirme")
    .replaceAll("Cok Amacli Salon", "Çok Amaçlı Salon")
    .replaceAll("Dogaclama", "Doğaçlama")
    .replaceAll("Muzik Kulubu", "Müzik Kulübü")
    .replaceAll("Ogle Arasi", "Öğle Arası")
    .replaceAll("Yapay Zeka Toplulugu", "Yapay Zeka Topluluğu")
    .replaceAll("Muzik", "Müzik")
    .replaceAll("Gonderi", "Gönderi")
    .replaceAll("Ogrenci", "Öğrenci")
    .replaceAll("Sos" + "yas", "ŞHG Sosyal")
    .replaceAll("Sosya\u015f", "ŞHG Sosyal");
}

export type { FeedItem };
