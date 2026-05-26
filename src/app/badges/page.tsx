import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Flame,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  Megaphone,
  MessageCircle,
  Sparkles,
  Trophy,
  UsersRound,
} from "lucide-react";
import { getBadgeCatalog } from "@/features/rewards/queries";
import {
  InlineEmpty,
  PageTabs,
  RailItem,
  RailSection,
  SocialBadge,
  SocialPage,
  StickyPageHeader,
  TimelineSurface,
} from "@/components/social-ui";
import { LinkButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { BadgeCatalogItem, BadgeCategory } from "@/features/rewards/types";

export const dynamic = "force-dynamic";

const categories: Array<BadgeCategory | "Tümü"> = [
  "Tümü",
  "Katılım",
  "Üretim",
  "Topluluk",
  "Sosyal",
  "Haftalık başarı",
];

export default async function BadgesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const query = await searchParams;
  const activeCategory = categories.includes(query.category as BadgeCategory)
    ? query.category!
    : "Tümü";
  const { profile, badges, points } = await getBadgeCatalog();
  const filtered = activeCategory === "Tümü"
    ? badges
    : badges.filter((badge) => badge.category === activeCategory);
  const earned = badges.filter((badge) => badge.earned_at);

  return (
    <SocialPage
      rail={
        <>
          <RailSection title="Puanların">
            <RailItem title={`${points?.total_points ?? 0} toplam puan`} meta="Tüm zamanlar" icon={Trophy} />
            <RailItem title={`${points?.weekly_points ?? 0} haftalık puan`} meta="Bu hafta" icon={Flame} />
            <RailItem title={`${earned.length} rozet`} meta="Kazanıldı" icon={BadgeCheck} />
          </RailSection>
          <RailSection title="Sıralama">
            <RailItem title="Haftalık liste" meta="Kimler aktif?" href="/leaderboard" icon={UsersRound} />
            <RailItem title="Profiline dön" meta="Vitrinini gör" href={`/profile/${profile.id}`} icon={Sparkles} />
          </RailSection>
        </>
      }
    >
      <StickyPageHeader title="Rozetler" subtitle="Kazanımların ve sıradaki hedeflerin.">
        <PageTabs
          tabs={categories.map((category) => ({
            label: category,
            href: category === "Tümü" ? "/badges" : `/badges?category=${encodeURIComponent(category)}`,
            active: activeCategory === category,
          }))}
        />
      </StickyPageHeader>

      <TimelineSurface className="p-4">
        {filtered.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((badge) => (
              <BadgeTile key={badge.code} badge={badge} />
            ))}
          </div>
        ) : (
          <InlineEmpty
            title="Rozet bulunamadı"
            body="Yeni rozetler eklendikçe burada görünecek."
            action={<LinkButton href="/">Ana Akış</LinkButton>}
          />
        )}
      </TimelineSurface>
    </SocialPage>
  );
}

function BadgeTile({ badge }: { badge: BadgeCatalogItem }) {
  const earned = Boolean(badge.earned_at);

  return (
    <Link
      href={`/badges?category=${encodeURIComponent(badge.category)}`}
      className={cn(
        "group rounded-3xl border p-4 transition hover:-translate-y-0.5",
        earned
          ? "border-cyan-400/40 bg-cyan-400/10 shadow-[0_20px_70px_rgba(34,211,238,0.12)]"
          : "border-slate-800 bg-slate-950/55 opacity-80 hover:opacity-100",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl",
            earned ? "bg-cyan-300 text-[#020617]" : "bg-slate-800 text-slate-400",
          )}
        >
          {earned ? renderBadgeIcon(badge.icon) : <LockKeyhole className="size-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <b className="text-base text-slate-50">{badge.name}</b>
            <SocialBadge tone={earned ? "blue" : "slate"}>{earned ? "Kazanıldı" : "Kilitli"}</SocialBadge>
          </span>
          <span className="mt-1 block text-sm leading-6 text-slate-300">{badge.description}</span>
          <span className="mt-3 block text-xs font-black uppercase tracking-wide text-slate-500">
            {badge.category}
          </span>
        </span>
      </div>
    </Link>
  );
}

function renderBadgeIcon(icon: string) {
  switch (icon) {
    case "calendar-check":
      return <CalendarCheck className="size-5" />;
    case "users":
      return <UsersRound className="size-5" />;
    case "trophy":
      return <Trophy className="size-5" />;
    case "lightbulb":
      return <Lightbulb className="size-5" />;
    case "megaphone":
      return <Megaphone className="size-5" />;
    case "message-circle":
      return <MessageCircle className="size-5" />;
    case "list-checks":
      return <ListChecks className="size-5" />;
    case "check-circle":
      return <CheckCircle2 className="size-5" />;
    case "flame":
      return <Flame className="size-5" />;
    case "badge-plus":
      return <BadgeCheck className="size-5" />;
    default:
      return <Sparkles className="size-5" />;
  }
}
