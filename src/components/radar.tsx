import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  MessageCircle,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { AnimatedCard } from "@/components/motion";
import { Avatar, Badge, Card, LinkButton } from "@/components/ui";
import { cn } from "@/lib/utils";

type IconType = ComponentType<{ className?: string }>;
type Tone = "orange" | "blue" | "green" | "purple" | "amber" | "slate";

const toneMap: Record<Tone, string> = {
  orange: "bg-orange-100 text-orange-700 ring-orange-200/80",
  blue: "bg-blue-100 text-blue-700 ring-blue-200/80",
  green: "bg-emerald-100 text-emerald-700 ring-emerald-200/80",
  purple: "bg-purple-100 text-purple-700 ring-purple-200/80",
  amber: "bg-amber-100 text-amber-800 ring-amber-200/80",
  slate: "bg-slate-100 text-slate-700 ring-slate-200/80",
};

const gradientMap: Record<Tone, string> = {
  orange: "from-orange-500 via-amber-300 to-rose-300",
  blue: "from-blue-500 via-cyan-300 to-emerald-300",
  green: "from-emerald-500 via-teal-300 to-lime-300",
  purple: "from-purple-500 via-fuchsia-300 to-orange-300",
  amber: "from-amber-400 via-orange-300 to-emerald-300",
  slate: "from-slate-800 via-slate-500 to-orange-300",
};

const categoryTone: Record<string, "orange" | "blue" | "green" | "amber" | "purple" | "slate"> = {
  Soru: "blue",
  Duyuru: "orange",
  Etkinlik: "green",
  Anket: "purple",
  Yardım: "amber",
  Sohbet: "slate",
};

export function PulseBadge({
  children,
  tone = "orange",
  live = false,
}: {
  children: ReactNode;
  tone?: Tone;
  live?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1",
        toneMap[tone],
      )}
    >
      {live ? (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full rounded-full bg-current opacity-35 motion-safe:animate-ping" />
          <span className="relative inline-flex size-2 rounded-full bg-current" />
        </span>
      ) : null}
      {children}
    </span>
  );
}

export function BentoCard({
  children,
  className,
  tone = "orange",
  size = "md",
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
  size?: "sm" | "md" | "lg" | "wide";
}) {
  return (
    <AnimatedCard>
      <Card
        className={cn(
          "relative h-full overflow-hidden p-0",
          size === "lg" && "md:col-span-2 md:row-span-2",
          size === "wide" && "md:col-span-2",
          className,
        )}
      >
        <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", gradientMap[tone])} />
        <div className="absolute -right-16 -top-16 size-36 rounded-full bg-white/55 blur-2xl" />
        <div className="relative h-full p-5 sm:p-6">{children}</div>
      </Card>
    </AnimatedCard>
  );
}

export function CampusTimeline({
  title = "Bugünün Akışı",
  items,
  emptyAction,
}: {
  title?: string;
  items: Array<{
    time: string;
    label: string;
    title: string;
    body?: string;
    href?: string;
    tone?: Tone;
  }>;
  emptyAction?: ReactNode;
}) {
  return (
    <Card className="h-full overflow-hidden p-0">
      <div className="border-b border-white/70 bg-white/60 p-5">
        <PulseBadge tone="amber" live>
          okul akışı
        </PulseBadge>
        <h2 className="mt-3 text-2xl font-black text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Saat saat etkinlik, duyuru ve topluluk hareketleri.
        </p>
      </div>
      <div className="space-y-4 p-5">
        {items.length ? (
          items.map((item, index) => {
            const content = (
              <div className="group relative flex gap-3">
                <div className="flex w-16 shrink-0 flex-col items-end">
                  <span className="text-xs font-black text-slate-400">{item.time}</span>
                  <span className="mt-2 h-full w-px bg-gradient-to-b from-orange-200 to-transparent" />
                </div>
                <div className="min-w-0 flex-1 rounded-3xl border border-white/75 bg-white/72 p-4 shadow-sm transition group-hover:border-orange-200 group-hover:bg-white">
                  <div className="flex flex-wrap items-center gap-2">
                    <PulseBadge tone={item.tone ?? "orange"}>{item.label}</PulseBadge>
                    {index === 0 ? <PulseBadge tone="green" live>şimdi yakın</PulseBadge> : null}
                  </div>
                  <div className="mt-3 text-sm font-black text-slate-950">{item.title}</div>
                  {item.body ? (
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                      {item.body}
                    </p>
                  ) : null}
                </div>
              </div>
            );

            return item.href ? (
              <Link key={`${item.time}-${item.title}`} href={item.href} className="block">
                {content}
              </Link>
            ) : (
              <div key={`${item.time}-${item.title}`}>{content}</div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 p-5">
            <div className="text-lg font-black text-slate-950">İlk hareketi sen başlat</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Bugünün akışı şu an sakin. Bir etkinlik oluşturabilir, topluluk kurabilir veya gündeme konu bırakabilirsin.
            </p>
            {emptyAction ? <div className="mt-4">{emptyAction}</div> : null}
          </div>
        )}
      </div>
    </Card>
  );
}

export function CampusBoardPanel({
  items,
  featured,
  eyebrow = "Okul Panosu",
  title = "Okul Nabzı",
  description = "Bugünün etkinlikleri, topluluk hareketleri ve okul gündemi daha okunabilir bir merkezde toplanır.",
}: {
  items: Array<{ title: string; body?: string; tone?: Tone; icon?: IconType }>;
  featured?: {
    title: string;
    body: string;
    href?: string;
  } | null;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const visibleItems = items.slice(0, 4);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 p-5 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:p-7">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-300 to-emerald-300" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(240,90,40,0.20),transparent_36%),radial-gradient(circle_at_80%_15%,rgba(59,130,246,0.18),transparent_26%),radial-gradient(circle_at_18%_85%,rgba(16,185,129,0.14),transparent_30%)]" />
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-12 size-72 rounded-full bg-orange-400/10 blur-3xl" />

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <PulseBadge tone="orange" live>
            {eyebrow}
          </PulseBadge>
          <h1 className="mt-4 max-w-xl text-4xl font-black leading-tight text-balance sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
            {description}
          </p>
        </div>
        <div className="rounded-3xl border border-white/12 bg-white/10 px-4 py-3 text-sm font-black text-orange-100">
          canlı okul özeti
        </div>
      </div>

      <div className="relative z-10 mt-8 grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="flex min-h-80 flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <div>
            <PulseBadge tone="green" live={Boolean(featured)}>
              öne çıkan
            </PulseBadge>
            <h2 className="mt-5 text-3xl font-black leading-tight text-balance sm:text-4xl">
              {featured?.title ?? "Bugün henüz sakin."}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              {featured?.body ?? "İlk etkinliği sen öner."}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-3xl bg-white/10 px-4 py-3 text-sm font-black ring-1 ring-white/15">
              Bugün
            </div>
            {featured?.href ? (
              <LinkButton href={featured.href} className="bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]">
                İncele
              </LinkButton>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-4 backdrop-blur">
            <div className="text-sm font-black text-orange-100">Neler oluyor?</div>
            <div className="mt-3 grid gap-3">
              {visibleItems.map((item, index) => {
                const Icon = item.icon ?? Sparkles;

                return (
                  <div
                    key={`${item.title}-${index}`}
                    className="rounded-3xl border border-white/12 bg-white/10 p-3 transition hover:bg-white/14"
                  >
                    <div className="flex gap-3">
                      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl ring-1", toneMap[item.tone ?? "orange"])}>
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black text-white">{item.title}</span>
                        {item.body ? (
                          <span className="mt-0.5 line-clamp-2 block text-xs font-semibold leading-5 text-slate-300">
                            {item.body}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {visibleItems.slice(0, 2).map((item, index) => {
              const Icon = item.icon ?? Sparkles;

              return (
                <div
                  key={`${item.title}-mini-${index}`}
                  className="rounded-3xl border border-white/12 bg-white/10 p-4 backdrop-blur"
                >
                  <Icon className="size-5 text-orange-200" />
                  <div className="mt-3 line-clamp-2 text-xs font-black leading-5 text-white">
                    {item.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
export function FriendPulsePanel({
  items,
  signedIn,
}: {
  items: Array<{
    title: string;
    body: string;
    href?: string;
    friends?: Array<{ id: string; first_name?: string | null; last_name?: string | null; avatar_path?: string | null }>;
  }>;
  signedIn: boolean;
}) {
  return (
    <Card className="h-full overflow-hidden p-0">
      <div className="border-b border-white/70 bg-white/60 p-5">
        <PulseBadge tone="blue" live={items.length > 0}>
          arkadaş hareketleri
        </PulseBadge>
        <h2 className="mt-3 text-2xl font-black text-slate-950">Arkadaşların gidiyor</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Yalnızca kabul edilmiş arkadaşların özel olarak vurgulanır.
        </p>
      </div>
      <div className="space-y-3 p-5">
        {items.length ? (
          items.map((item) => {
            const content = (
              <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4 transition hover:border-blue-200 hover:bg-blue-50">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {(item.friends ?? []).slice(0, 3).map((friend) => (
                      <Avatar
                        key={friend.id}
                        firstName={friend.first_name}
                        lastName={friend.last_name}
                        size="sm"
                      />
                    ))}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-950">{item.title}</div>
                    <div className="mt-0.5 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">
                      {item.body}
                    </div>
                  </div>
                </div>
              </div>
            );

            return item.href ? (
              <Link key={item.title} href={item.href} className="block">
                {content}
              </Link>
            ) : (
              <div key={item.title}>{content}</div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/55 p-5">
            <UsersRound className="size-6 text-blue-700" />
            <h3 className="mt-3 text-lg font-black text-slate-950">
              {signedIn ? "Arkadaş hareketleri yakında" : "Arkadaş hareketleri için giriş yap"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {signedIn
                ? "Arkadaşların bir etkinliğe katıldığında bu panel okul içi sosyal tetikleyici gibi çalışacak."
                : "Giriş yaptıktan sonra arkadaşlarının katıldığı etkinlikleri burada görebilirsin."}
            </p>
            <div className="mt-4">
              <LinkButton href={signedIn ? "/friends" : "/login"} variant="secondary">
                {signedIn ? "Arkadaşları yönet" : "Giriş yap"}
              </LinkButton>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export function AgendaItem({
  category,
  title,
  body,
  meta,
  href,
  score,
  comments,
}: {
  category: string;
  title: string;
  body?: string;
  meta?: string;
  href?: string;
  score?: number;
  comments?: number;
}) {
  const tone = categoryTone[category] ?? "slate";
  const content = (
    <div className="group rounded-3xl border border-white/75 bg-white/72 p-4 shadow-sm backdrop-blur transition hover:border-orange-200 hover:bg-white hover:shadow-[0_18px_50px_rgba(240,90,40,0.10)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge tone={tone}>{category}</Badge>
        {meta ? <span className="text-xs font-bold text-slate-500">{meta}</span> : null}
      </div>
      <h3 className="mt-3 text-lg font-black leading-snug text-slate-950 transition group-hover:text-[var(--primary)]">
        {title}
      </h3>
      {body ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{body}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-black text-slate-500">
        {typeof score === "number" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1.5">
            <Sparkles className="size-3.5 text-[var(--primary)]" />
            {score} skor
          </span>
        ) : null}
        {typeof comments === "number" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1.5">
            <MessageCircle className="size-3.5 text-blue-600" />
            {comments} yorum
          </span>
        ) : null}
        {href ? (
          <span className="ml-auto inline-flex items-center gap-1 text-[var(--primary)]">
            Aç
            <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
          </span>
        ) : null}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

export function SignalMetric({
  icon: Icon = Sparkles,
  label,
  value,
  tone = "orange",
}: {
  icon?: IconType;
  label: string;
  value: string | number;
  tone?: Tone;
}) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/72 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl ring-1", toneMap[tone])}>
          <Icon className="size-4" />
        </span>
        <div>
          <div className="text-2xl font-black text-slate-950">{value}</div>
          <div className="text-xs font-black text-slate-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

export function guessPostCategory(post: { title?: string | null; body?: string | null; communities?: { name?: string | null } | null }) {
  const text = `${post.title ?? ""} ${post.body ?? ""} ${post.communities?.name ?? ""}`.toLocaleLowerCase("tr");

  if (text.includes("?") || text.includes("nasıl") || text.includes("mi ") || text.includes("mı ")) {
    return "Soru";
  }

  if (text.includes("duyuru") || text.includes("önemli") || text.includes("bilgilendirme")) {
    return "Duyuru";
  }

  if (text.includes("etkinlik") || text.includes("turnuva") || text.includes("buluşma") || text.includes("gezi")) {
    return "Etkinlik";
  }

  if (text.includes("anket") || text.includes("oyla") || text.includes("oylama")) {
    return "Anket";
  }

  if (text.includes("yardım") || text.includes("acil") || text.includes("destek")) {
    return "Yardım";
  }

  return "Sohbet";
}

export function featuredCommunityLabel(community: any) {
  const members = community?.member_count ?? community?.community_members?.[0]?.count ?? 0;
  const posts = community?.post_count ?? community?.posts?.[0]?.count ?? 0;
  const events = community?.event_count ?? community?.events?.[0]?.count ?? 0;

  if (posts > 0) {
    return `${posts} gündem başlığı`;
  }

  if (events > 0) {
    return `${events} etkinlik hareketi`;
  }

  return `${members} üye nabzı`;
}
