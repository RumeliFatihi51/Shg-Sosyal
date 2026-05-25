import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Heart,
  Home,
  MapPin,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Search,
  Send,
  Share2,
  Sparkles,
  UsersRound,
  Vote,
} from "lucide-react";
import { AnimatedSection, StaggeredGrid } from "@/components/motion";
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
    chip: "bg-orange-100 text-orange-800",
    text: "text-orange-600",
    line: "from-orange-500 to-amber-300",
    soft: "bg-orange-50 text-orange-900 border-orange-100",
  },
  sky: {
    chip: "bg-sky-100 text-sky-800",
    text: "text-sky-600",
    line: "from-sky-500 to-cyan-300",
    soft: "bg-sky-50 text-sky-900 border-sky-100",
  },
  mint: {
    chip: "bg-emerald-100 text-emerald-800",
    text: "text-emerald-600",
    line: "from-emerald-500 to-lime-300",
    soft: "bg-emerald-50 text-emerald-900 border-emerald-100",
  },
  violet: {
    chip: "bg-violet-100 text-violet-800",
    text: "text-violet-600",
    line: "from-violet-500 to-fuchsia-300",
    soft: "bg-violet-50 text-violet-900 border-violet-100",
  },
  sun: {
    chip: "bg-amber-100 text-amber-900",
    text: "text-amber-700",
    line: "from-amber-500 to-yellow-300",
    soft: "bg-amber-50 text-amber-900 border-amber-100",
  },
  ink: {
    chip: "bg-slate-100 text-slate-800",
    text: "text-slate-700",
    line: "from-slate-950 to-slate-400",
    soft: "bg-slate-50 text-slate-900 border-slate-200",
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
    <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[1040px] grid-cols-1 lg:grid-cols-[minmax(0,640px)_minmax(300px,360px)]">
      <AnimatedSection className="min-w-0 border-x border-slate-200/80 bg-white/88 backdrop-blur-xl" delay={0.02}>
        {feed}
      </AnimatedSection>
      <AnimatedSection className="hidden min-w-0 border-r border-slate-200/80 bg-white/55 px-5 py-4 lg:block" delay={0.06}>
        {right}
      </AnimatedSection>
      <MobileBottomNav signedIn={signedIn} />
    </div>
  );
}

export const AppShell = FeedLayout;
export const HomeShell = FeedLayout;

export function LeftSidebar({ signedIn }: { signedIn: boolean }) {
  return <QuickActions signedIn={signedIn} />;
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
  return (
    <main className="min-w-0">
      <TimelineHeader
        todayCount={todayCount}
        participantCount={participantCount}
        weekPostCount={weekPostCount}
      />
      <ComposerPrompt signedIn={signedIn} />
      <TodayPulseStrip
        todayCount={todayCount}
        participantCount={participantCount}
        weekPostCount={weekPostCount}
        signedIn={signedIn}
      />
      <MainSchoolFeed items={items} signedIn={signedIn} />
    </main>
  );
}

export function TimelineHeader({
  todayCount,
  participantCount,
  weekPostCount,
}: {
  todayCount: number;
  participantCount: number;
  weekPostCount: number;
}) {
  const stats = [
    todayCount ? `${todayCount} etkinlik` : "Etkinlik hazırlanıyor",
    participantCount ? `${participantCount} katılım` : "İlk katılım bekleniyor",
    weekPostCount ? `${weekPostCount} paylaşım` : "İlk paylaşımı yap",
  ];

  return (
    <header className="sticky top-16 z-20 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl lg:top-0">
      <div className="px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black tracking-tight text-slate-950">Ana akış</h1>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">ŞHG Sosyal · okulda bugün olanlar</p>
          </div>
          <Link
            href="/posts"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            aria-label="Akışta ara"
          >
            <Search className="size-5" />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-3 border-t border-slate-100 text-center text-sm font-black">
        {["Sana göre", "Bugün", "Yakında"].map((tab, index) => (
          <Link
            key={tab}
            href={index === 2 ? "/events" : index === 1 ? "/" : "/posts"}
            className={cn(
              "relative py-3 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950",
              index === 0 && "text-slate-950",
            )}
          >
            {tab}
            {index === 0 ? <span className="absolute inset-x-10 bottom-0 h-1 rounded-full bg-slate-950" /> : null}
          </Link>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 text-xs font-bold text-slate-500 scrollbar-none">
        {stats.map((stat) => (
          <span key={stat} className="shrink-0 rounded-full bg-slate-50 px-3 py-1.5">
            {stat}
          </span>
        ))}
      </div>
    </header>
  );
}

export function ComposerPrompt({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="border-b border-slate-200/80 px-4 py-4 sm:px-5">
      <div className="flex gap-3">
        <Avatar firstName="ŞHG" lastName="Sosyal" size="md" />
        <div className="min-w-0 flex-1">
          <Link
            href={signedIn ? "/posts" : "/login"}
            className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-base font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-white"
          >
            Okulda neler oluyor?
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1 text-xs font-black text-slate-500">
              <QuickComposerLink href={signedIn ? "/events/new" : "/login"} icon={CalendarDays}>Etkinlik</QuickComposerLink>
              <QuickComposerLink href={signedIn ? "/communities/new" : "/login"} icon={UsersRound}>Topluluk</QuickComposerLink>
              <QuickComposerLink href={signedIn ? "/posts" : "/login"} icon={MessageCircle}>Gönderi</QuickComposerLink>
            </div>
            <Link
              href={signedIn ? "/posts" : "/login"}
              className="inline-flex h-9 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Paylaş
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickComposerLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: IconType;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950">
      <Icon className="size-4" />
      {children}
    </Link>
  );
}

export function TodayPulseStrip({
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
  const pulses = [
    {
      href: "/events",
      icon: CalendarDays,
      toneName: "ember" as const,
      label: "Bugün",
      value: todayCount ? `${todayCount} etkinlik var` : "İlk etkinliği sen öner",
    },
    {
      href: "/events",
      icon: CheckCircle2,
      toneName: "mint" as const,
      label: "Katılım",
      value: participantCount ? `${participantCount} kişi katılıyor` : "İlk katılımı başlat",
    },
    {
      href: signedIn ? "/posts" : "/login",
      icon: MessageCircle,
      toneName: "sky" as const,
      label: "Konuşulanlar",
      value: weekPostCount ? `${weekPostCount} paylaşım` : "İlk paylaşımı yap",
    },
  ];

  return (
    <section className="border-b border-slate-200/80 px-4 py-3 sm:px-5">
      <div className="flex gap-3 overflow-x-auto scrollbar-none">
        {pulses.map((pulse) => (
          <Link
            key={pulse.label}
            href={pulse.href}
            className={cn(
              "flex min-w-[13rem] items-center gap-3 rounded-2xl border px-3 py-3 transition hover:bg-white",
              tone[pulse.toneName].soft,
            )}
          >
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", tone[pulse.toneName].chip)}>
              <pulse.icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">{pulse.value}</span>
              <span className="block truncate text-xs font-semibold opacity-70">{pulse.label}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function MainSchoolFeed({
  items,
  signedIn,
}: {
  items: FeedItem[];
  signedIn: boolean;
}) {
  if (!items.length) {
    return (
      <EmptyTimelineItem
        signedIn={signedIn}
        title="Bugün henüz sakin."
        body="İlk etkinliği öner, bir topluluk kur ya da okul gündemine ilk paylaşımı bırak."
      />
    );
  }

  return (
    <StaggeredGrid className="divide-y divide-slate-200/80">
      {items.map((item, index) => (
        <FeedCard key={feedKey(item, index)} item={item} signedIn={signedIn} />
      ))}
    </StaggeredGrid>
  );
}

export function FeedCard({ item, signedIn }: { item: FeedItem; signedIn: boolean }) {
  if (item.type === "event") {
    return <EventTweet event={item.event} friends={item.friends} signedIn={signedIn} />;
  }

  if (item.type === "post") {
    return <PostTweet post={item.post} />;
  }

  if (item.type === "announcement") {
    return <AnnouncementTweet announcement={item.announcement} />;
  }

  if (item.type === "poll") {
    return <PollTweet poll={item.poll} />;
  }

  if (item.type === "community") {
    return <CommunityTweet community={item.community} signedIn={signedIn} />;
  }

  return (
    <FriendTweet
      title={item.title}
      body={item.body}
      href={item.href}
      friends={item.friends}
      signedIn={signedIn}
    />
  );
}

export const EventFeedCard = EventTweet;
export const CommunityFeedCard = CommunityTweet;
export const AnnouncementFeedCard = AnnouncementTweet;
export const PollFeedCard = PollTweet;
export const FriendActivityCard = FriendTweet;

function TimelineItem({
  avatar,
  author,
  handle,
  time,
  toneName = "ink",
  children,
  actions,
}: {
  avatar: ReactNode;
  author: string;
  handle: string;
  time?: string;
  toneName?: Tone;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <article className="group px-4 py-4 transition hover:bg-slate-50/80 sm:px-5">
      <div className="grid grid-cols-[2.75rem_1fr] gap-3">
        <div>{avatar}</div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1 text-sm">
            <span className="truncate font-black text-slate-950">{author}</span>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black", tone[toneName].chip)}>
              {handle}
            </span>
            {time ? <span className="truncate text-xs font-semibold text-slate-500">· {time}</span> : null}
            <MoreHorizontal className="ml-auto size-4 shrink-0 text-slate-400" />
          </div>
          <div className="mt-2">{children}</div>
          {actions ?? <TimelineActions />}
        </div>
      </div>
    </article>
  );
}

function EventTweet({
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
  const fill = hasCapacity ? Math.min(100, Math.round((participantCount / capacity) * 100)) : 100;

  return (
    <TimelineItem
      avatar={<TimelineIcon toneName="ember" icon={CalendarDays} />}
      author="Etkinlik Takvimi"
      handle="@takvim"
      time={formatDate(event.event_date)}
      toneName="ember"
    >
      <Link href={`/events/${event.id}`} className="block">
        <div className="overflow-hidden rounded-[1.35rem] border border-orange-200 bg-white transition group-hover:border-orange-300">
          <div className="grid sm:grid-cols-[6rem_1fr]">
            <div className="flex min-h-28 flex-row items-center gap-3 bg-slate-950 p-4 text-white sm:flex-col sm:items-start sm:justify-between">
              <span className="rounded-full bg-white/12 px-2 py-1 text-[11px] font-black uppercase text-orange-100">Etkinlik</span>
              <span>
                <span className="block text-4xl font-black leading-none">{day}</span>
                <span className="block text-xs font-black uppercase tracking-wide text-orange-100">{month}</span>
              </span>
            </div>
            <div className="p-4">
              <h2 className="text-xl font-black leading-tight text-slate-950">{cleanText(event.title, "Yeni etkinlik")}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                {cleanText(event.description, "Etkinlik detayları yakında paylaşılacak.")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                <InfoPill icon={Clock3}>{formatTime(event.start_time)}</InfoPill>
                <InfoPill icon={MapPin}>{cleanText(event.location, "Konum yakında")}</InfoPill>
                <InfoPill icon={UsersRound}>{cleanText(event.communities?.name, "Okul etkinliği")}</InfoPill>
              </div>
              <div className="mt-4">
                <div className="flex justify-between gap-3 text-xs font-black text-slate-600">
                  <span>{participantCount ? `${participantCount} kişi katılıyor` : "İlk katılımı sen başlat"}</span>
                  <span>{hasCapacity ? `${capacity} kontenjan` : "Kontenjan açık"}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300" style={{ width: `${Math.max(fill, participantCount ? 8 : 18)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <AvatarStack friends={friends} fallback />
          <span className="truncate text-xs font-semibold text-slate-500">
            {friends.length ? `${friends.length} arkadaşın gidiyor` : "Arkadaş katılımı burada görünür"}
          </span>
        </div>
        <div className="flex gap-2">
          {signedIn ? (
            <form action={toggleEventParticipationAction}>
              <input type="hidden" name="event_id" value={event.id} />
              <input type="hidden" name="is_joined" value="false" />
              <SubmitButton pendingLabel="Kaydediliyor..." variant="secondary" className="h-9 px-4 text-xs">
                Katılıyorum
              </SubmitButton>
            </form>
          ) : null}
          <LinkButton href={`/events/${event.id}`} variant={signedIn ? "ghost" : "secondary"} className="h-9 px-4 text-xs">
            Detay
          </LinkButton>
        </div>
      </div>
    </TimelineItem>
  );
}

function PostTweet({ post }: { post: any }) {
  const commentCount = getCommentCount(post);
  const score = postScore(post);

  return (
    <TimelineItem
      avatar={<Avatar firstName={post.profiles?.first_name} lastName={post.profiles?.last_name} size="md" />}
      author={cleanText(fullName(post.profiles), "Öğrenci")}
      handle={`@${cleanHandle(post.communities?.name ?? "topluluk")}`}
      time={relativeDate(post.created_at)}
    >
      <Link href={`/posts/${post.id}`} className="block">
        <h2 className="text-lg font-black leading-tight text-slate-950">{cleanText(post.title, "Yeni gönderi")}</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
          {cleanText(post.body, "Bu haftanın ilk paylaşımı burada öne çıkabilir.")}
        </p>
      </Link>
      <TimelineActions
        comments={commentCount ? String(commentCount) : "Yorum"}
        likes={score ? String(score) : "Beğen"}
      />
    </TimelineItem>
  );
}

function AnnouncementTweet({ announcement }: { announcement: any }) {
  return (
    <TimelineItem
      avatar={<TimelineIcon toneName="violet" icon={Megaphone} />}
      author="Okul duyurusu"
      handle="@duyuru"
      time={relativeDate(announcement.created_at)}
      toneName="violet"
    >
      <div className="rounded-[1.25rem] border border-violet-200 bg-violet-50/70 p-4">
        <div className="flex items-center gap-2">
          <Badge tone="purple">Sabitlendi</Badge>
          <span className="text-xs font-bold text-violet-700">Duyuru</span>
        </div>
        <h2 className="mt-3 text-lg font-black leading-tight text-slate-950">{cleanText(announcement.title, "Yeni duyuru")}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">{cleanText(announcement.body, "Duyurular yakında burada.")}</p>
      </div>
    </TimelineItem>
  );
}

function PollTweet({ poll }: { poll: any }) {
  const options = Array.isArray(poll.poll_options) ? poll.poll_options : [];
  const totalVotes = options.reduce(
    (sum: number, option: any) => sum + (Array.isArray(option.poll_votes) ? option.poll_votes.length : 0),
    0,
  );
  const pollOptions = options.length
    ? options
    : [{ id: "empty", label: "İlk seçenek hazırlanıyor", poll_votes: [] }];

  return (
    <TimelineItem
      avatar={<TimelineIcon toneName="sky" icon={Vote} />}
      author="Okul anketi"
      handle="@anket"
      time={poll.closes_at ? `kapanış ${formatDate(poll.closes_at.slice(0, 10))}` : "açık"}
      toneName="sky"
    >
      <div className="rounded-[1.25rem] border border-sky-200 bg-sky-50/70 p-4">
        <h2 className="text-lg font-black leading-tight text-slate-950">{cleanText(poll.title, "Yeni anket")}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{cleanText(poll.description, "Okul gündemine dair kısa bir anket.")}</p>
        <div className="mt-4 grid gap-2">
          {pollOptions.slice(0, 4).map((option: any) => {
            const votes = Array.isArray(option.poll_votes) ? option.poll_votes.length : 0;
            const percent = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;

            return (
              <div key={option.id} className="rounded-2xl border border-white bg-white/80 p-3">
                <div className="flex justify-between gap-3 text-xs font-black text-slate-700">
                  <span className="line-clamp-1">{cleanText(option.label, "Seçenek")}</span>
                  <span>{totalVotes ? `%${percent}` : "oy bekliyor"}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${totalVotes ? Math.max(percent, 8) : 16}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-xs font-black text-sky-700">{totalVotes ? `${totalVotes} oy kullanıldı` : "İlk oyu sen ver"}</div>
      </div>
    </TimelineItem>
  );
}

function CommunityTweet({
  community,
  signedIn,
}: {
  community: any;
  signedIn: boolean;
}) {
  const { members, posts } = getCommunityStats(community);
  const initials = communityInitials(cleanText(community.name, "Topluluk"));

  return (
    <TimelineItem
      avatar={<CommunityMonogram>{initials}</CommunityMonogram>}
      author={cleanText(community.name, "Topluluk")}
      handle="@topluluk"
      time="bugün aktif"
      toneName="mint"
      actions={null}
    >
      <p className="line-clamp-3 text-sm leading-6 text-slate-700">
        {cleanText(community.description, "Bu topluluk okul akışında yeni hareketler başlatabilir.")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-600">
        <span className="rounded-full bg-slate-100 px-3 py-1.5">{members ? `${members} üye` : "Yeni üyeler bekleniyor"}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1.5">{posts ? `${posts} paylaşım` : "İlk paylaşım bekleniyor"}</span>
        <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-700">Bugün aktif</span>
      </div>
      <div className="mt-4 flex gap-2">
        {signedIn ? (
          <form action={joinCommunityAction}>
            <input type="hidden" name="community_id" value={community.id} />
            <input type="hidden" name="slug" value={community.slug} />
            <SubmitButton pendingLabel="Kaydediliyor..." variant="secondary" className="h-9 px-4 text-xs">
              Katıl
            </SubmitButton>
          </form>
        ) : (
          <LinkButton href="/login" variant="secondary" className="h-9 px-4 text-xs">Giriş yap</LinkButton>
        )}
        <LinkButton href={`/communities/${community.slug}`} variant="ghost" className="h-9 px-4 text-xs">
          Aç
        </LinkButton>
      </div>
    </TimelineItem>
  );
}

function FriendTweet({
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
    <TimelineItem
      avatar={<TimelineIcon toneName="sun" icon={UsersRound} />}
      author="Arkadaş hareketi"
      handle="@arkadaşlar"
      toneName="sun"
      actions={null}
    >
      <Link href={href ?? (signedIn ? "/friends" : "/login")} className="flex items-center gap-3 rounded-[1.25rem] border border-amber-200 bg-amber-50/80 p-3 transition hover:bg-amber-50">
        <AvatarStack friends={friends ?? []} fallback />
        <span className="min-w-0">
          <span className="block line-clamp-1 text-sm font-black text-slate-950">{cleanText(title, "Arkadaşların ne yapıyor?")}</span>
          <span className="mt-0.5 block line-clamp-1 text-xs font-semibold text-slate-600">{cleanText(body, "Giriş yapınca arkadaşlarının katıldığı etkinlikleri burada görebilirsin.")}</span>
        </span>
      </Link>
    </TimelineItem>
  );
}

function EmptyTimelineItem({
  signedIn,
  title,
  body,
}: {
  signedIn: boolean;
  title: string;
  body: string;
}) {
  return (
    <article className="px-4 py-10 text-center sm:px-5">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-700">
        <Sparkles className="size-6" />
      </div>
      <h2 className="mt-4 text-xl font-black text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{body}</p>
      <div className="mt-5 flex justify-center">
        <LinkButton href={signedIn ? "/events/new" : "/login"}>İlk hareketi başlat</LinkButton>
      </div>
    </article>
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
  return (
    <aside className="space-y-4">
      <SearchWidget />
      <UpcomingWidget events={events} signedIn={signedIn} />
      <TrendingWidget events={events} communities={communities} />
      <CommunitiesWidget communities={communities} />
      <FriendsWidget items={friendItems} signedIn={signedIn} />
    </aside>
  );
}

function SearchWidget() {
  return (
    <Link href="/posts" className="flex h-12 items-center gap-3 rounded-full border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-500 transition hover:bg-white">
      <Search className="size-5" />
      Okul akışında ara
    </Link>
  );
}

function UpcomingWidget({ events, signedIn }: { events: any[]; signedIn: boolean }) {
  return (
    <Widget title="Bugün ve yakında" href="/events">
      {events.length ? (
        <div className="divide-y divide-slate-200">
          {events.slice(0, 4).map((event) => {
            const { day, month } = getDateParts(event.event_date);

            return (
              <Link key={event.id} href={`/events/${event.id}`} className="grid grid-cols-[2.7rem_1fr] gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex size-11 flex-col items-center justify-center rounded-xl bg-slate-950 text-white">
                  <span className="text-sm font-black">{day}</span>
                  <span className="text-[9px] font-black uppercase">{month}</span>
                </span>
                <span className="min-w-0">
                  <span className="block line-clamp-1 text-sm font-black text-slate-950">{cleanText(event.title, "Etkinlik")}</span>
                  <span className="mt-1 block line-clamp-1 text-xs font-semibold text-slate-500">{formatTime(event.start_time)} · {cleanText(event.location, "Konum yakında")}</span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <WidgetEmpty
          title="Etkinlik hazırlanıyor."
          body="Onaylanan etkinlikler burada görünür."
          href={signedIn ? "/events/new" : "/login"}
          action="Etkinlik öner"
        />
      )}
    </Widget>
  );
}

function TrendingWidget({ events, communities }: { events: any[]; communities: any[] }) {
  const topics = [
    events[0] ? { label: cleanText(events[0].title, "Yakındaki etkinlik"), href: `/events/${events[0].id}` } : null,
    communities[0] ? { label: cleanText(communities[0].name, "Aktif topluluk"), href: `/communities/${communities[0].slug}` } : null,
    { label: "Bu haftanın ilk paylaşımı", href: "/posts" },
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  return (
    <Widget title="Konuşulanlar" href="/posts">
      <div className="divide-y divide-slate-200">
        {topics.map((topic, index) => (
          <Link key={topic.label} href={topic.href} className="block py-3 first:pt-0 last:pb-0">
            <div className="text-xs font-semibold text-slate-500">Okul gündemi · {index + 1}</div>
            <div className="mt-0.5 line-clamp-2 text-sm font-black text-slate-950">#{topic.label}</div>
          </Link>
        ))}
      </div>
    </Widget>
  );
}

function CommunitiesWidget({ communities }: { communities: any[] }) {
  return (
    <Widget title="Aktif topluluklar" href="/communities">
      {communities.length ? (
        <div className="divide-y divide-slate-200">
          {communities.slice(0, 4).map((community) => {
            const { members } = getCommunityStats(community);
            const initials = communityInitials(cleanText(community.name, "Topluluk"));

            return (
              <Link key={community.id} href={`/communities/${community.slug}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <CommunityMonogram small>{initials}</CommunityMonogram>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-950">{cleanText(community.name, "Topluluk")}</span>
                  <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">{members ? `${members} üye` : "Yeni üyeler bekleniyor"}</span>
                </span>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">Aç</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <WidgetEmpty title="Topluluklar hareketlenmeye hazır." body="Onaylanan ilk topluluk burada görünecek." />
      )}
    </Widget>
  );
}

function FriendsWidget({
  items,
  signedIn,
}: {
  items: Array<{ title: string; body: string; href?: string; friends?: FriendAttendance[] }>;
  signedIn: boolean;
}) {
  return (
    <Widget title="Arkadaşların" href={signedIn ? "/friends" : "/login"}>
      {items.length ? (
        <div className="divide-y divide-slate-200">
          {items.slice(0, 3).map((item) => (
            <Link key={item.title} href={item.href ?? "/friends"} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <AvatarStack friends={item.friends ?? []} />
              <span className="min-w-0">
                <span className="block line-clamp-1 text-sm font-black text-slate-950">{cleanText(item.title, "Arkadaş hareketi")}</span>
                <span className="mt-0.5 block line-clamp-1 text-xs font-semibold text-slate-500">{cleanText(item.body, "Etkinlik")}</span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <WidgetEmpty
          title={signedIn ? "Arkadaş hareketleri yakında." : "Giriş yapınca açılır."}
          body={signedIn ? "Arkadaşların etkinliklere katıldığında burada görünür." : "Arkadaşlarının katıldığı etkinlikler öne çıkar."}
        />
      )}
    </Widget>
  );
}

export function QuickActions({ signedIn, compact = false }: { signedIn: boolean; compact?: boolean }) {
  const actions = [
    { href: signedIn ? "/events/new" : "/login", label: "Etkinlik öner", icon: CalendarDays },
    { href: signedIn ? "/communities/new" : "/login", label: "Topluluk kur", icon: UsersRound },
    { href: signedIn ? "/posts" : "/login", label: "Gönderi paylaş", icon: Send },
  ];

  return (
    <section className={cn("rounded-3xl border border-slate-200 bg-white p-3", compact && "p-2")}>
      <div className="grid gap-1">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <action.icon className="size-5" />
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function Widget({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <Link href={href} className="text-xs font-black text-sky-600">Tümü</Link>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </section>
  );
}

function WidgetEmpty({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4">
      <div className="text-sm font-black text-slate-950">{title}</div>
      <p className="mt-1 text-xs leading-5 text-slate-500">{body}</p>
      {href && action ? (
        <Link href={href} className="mt-3 inline-flex text-xs font-black text-sky-600">
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export const EmptyActionState = EmptyTimelineItem;
export const EmptyStateCard = EmptyTimelineItem;

export function MobileBottomNav({ signedIn }: { signedIn: boolean }) {
  const links = [
    { href: "/", label: "Akış", icon: Home, active: true },
    { href: "/events", label: "Etkinlik", icon: CalendarDays },
    { href: "/communities", label: "Topluluk", icon: UsersRound },
    { href: signedIn ? "/friends" : "/login", label: "Arkadaş", icon: UsersRound },
    { href: signedIn ? "/notifications" : "/login", label: "Bildirim", icon: Bell },
  ];

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 gap-1 rounded-full border border-slate-200 bg-white/92 p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl lg:hidden">
      {links.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "flex min-w-0 flex-col items-center justify-center gap-1 rounded-full px-1 py-2 text-[10px] font-black transition",
            item.active ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
          )}
        >
          <item.icon className="size-4" />
          <span className="truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function TimelineActions({
  comments = "Yorum",
  likes = "Beğen",
}: {
  comments?: string;
  likes?: string;
}) {
  const actions = [
    { label: comments, icon: MessageCircle },
    { label: "Paylaş", icon: Repeat2 },
    { label: likes, icon: Heart },
    { label: "Gönder", icon: Share2 },
  ];

  return (
    <div className="mt-3 flex max-w-md justify-between gap-3 text-xs font-bold text-slate-500">
      {actions.map((action) => (
        <span key={action.label} className="inline-flex items-center gap-1.5 rounded-full py-1 transition group-hover:text-slate-700">
          <action.icon className="size-4" />
          {action.label}
        </span>
      ))}
    </div>
  );
}

function TimelineIcon({
  toneName,
  icon: Icon,
}: {
  toneName: Tone;
  icon: IconType;
}) {
  return (
    <span className={cn("flex size-11 items-center justify-center rounded-full", tone[toneName].chip)}>
      <Icon className="size-5" />
    </span>
  );
}

function CommunityMonogram({
  children,
  small = false,
}: {
  children: ReactNode;
  small?: boolean;
}) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-slate-950 font-black text-white", small ? "size-10 text-xs" : "size-11 text-sm")}>
      {children}
    </span>
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

function AvatarStack({ friends, fallback = false }: { friends: FriendAttendance[]; fallback?: boolean }) {
  return (
    <span className="relative flex shrink-0 -space-x-2">
      {friends.length ? (
        friends.slice(0, 4).map((friend) => (
          <Avatar key={friend.id} firstName={friend.first_name} lastName={friend.last_name} size="sm" />
        ))
      ) : fallback ? (
        <>
          <Avatar firstName="ŞHG" lastName="Sosyal" size="sm" />
          <Avatar firstName="Okul" lastName="Akışı" size="sm" />
        </>
      ) : null}
      <span className="absolute -right-1 -top-1 size-3 rounded-full bg-emerald-400 ring-2 ring-white" />
    </span>
  );
}

function feedKey(item: FeedItem, index: number) {
  if (item.type === "event") return `event-${item.event.id}-${index}`;
  if (item.type === "post") return `post-${item.post.id}-${index}`;
  if (item.type === "announcement") return `announcement-${item.announcement.id ?? index}`;
  if (item.type === "poll") return `poll-${item.poll.id ?? index}`;
  if (item.type === "community") return `community-${item.community.id}-${index}`;
  return `friend-${item.href ?? item.title}-${index}`;
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

function cleanHandle(value: string) {
  return cleanText(value, "topluluk")
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18) || "topluluk";
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
    .replaceAll("Gelistirme", "Geliştirme")
    .replaceAll("Cok Amacli Salon", "Çok Amaçlı Salon")
    .replaceAll("Dogaclama", "Doğaçlama")
    .replaceAll("Muzik Kulubu", "Müzik Kulübü")
    .replaceAll("Ogle Arasi", "Öğle Arası")
    .replaceAll("Siniflar arasi", "Sınıflar arası")
    .replaceAll("hizli", "hızlı")
    .replaceAll("Hizli", "Hızlı")
    .replaceAll("maclari", "maçları")
    .replaceAll("Maclari", "Maçları")
    .replaceAll("Yapay Zeka Toplulugu", "Yapay Zeka Topluluğu")
    .replaceAll("Muzik", "Müzik")
    .replaceAll("Gonderi", "Gönderi")
    .replaceAll("Ogrenci", "Öğrenci")
    .replaceAll("Sos" + "yas", "ŞHG Sosyal")
    .replaceAll("Sosya\u015f", "ŞHG Sosyal");
}

export type { FeedItem };
