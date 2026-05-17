import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ArrowRight, Clock3, Sparkles, UsersRound } from "lucide-react";
import { AnimatedCard } from "@/components/motion";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

type IconType = ComponentType<{ className?: string }>;

const toneClasses = {
  orange: "from-orange-500 to-amber-400 text-orange-700 bg-orange-50",
  blue: "from-blue-500 to-cyan-400 text-blue-700 bg-blue-50",
  green: "from-emerald-500 to-teal-400 text-emerald-700 bg-emerald-50",
  purple: "from-purple-500 to-fuchsia-400 text-purple-700 bg-purple-50",
  slate: "from-slate-700 to-slate-500 text-slate-700 bg-slate-50",
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? (
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-black uppercase text-[var(--primary)] shadow-sm">
            <Sparkles className="size-3.5" />
            {eyebrow}
          </div>
        ) : null}
        <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "orange",
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: IconType;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <AnimatedCard>
      <Card className="relative h-full overflow-hidden p-5">
        <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", toneClasses[tone].split(" ").slice(0, 2).join(" "))} />
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-3xl font-black text-slate-950">{value}</div>
            <div className="mt-1 text-sm font-black text-slate-800">{label}</div>
            {detail ? <p className="mt-2 text-xs font-semibold text-slate-500">{detail}</p> : null}
          </div>
          <span className={cn("flex size-12 items-center justify-center rounded-2xl", toneClasses[tone].split(" ").slice(2).join(" "))}>
            <Icon className="size-5" />
          </span>
        </div>
      </Card>
    </AnimatedCard>
  );
}

export function CommunityCard({ community }: { community: any }) {
  const memberCount = community.member_count ?? community.community_members?.[0]?.count ?? 0;
  const postCount = community.post_count ?? community.posts?.[0]?.count ?? 0;
  const followerCount = community.follower_count ?? community.community_followers?.[0]?.count ?? 0;

  return (
    <AnimatedCard>
      <Link href={`/communities/${community.slug}`} className="group block h-full">
        <Card className="flex h-full flex-col overflow-hidden p-0">
          <div className="bg-gradient-to-br from-slate-950 via-slate-800 to-orange-700 p-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white/12 text-white ring-1 ring-white/20">
                <UsersRound className="size-6" />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-3 py-1 text-xs font-black ring-1 ring-white/15">
                Bu hafta aktif
                <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
              </span>
            </div>
            <h3 className="mt-5 text-xl font-black">{community.name}</h3>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <p className="line-clamp-3 text-sm leading-6 text-slate-600">
              {community.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
              <Badge tone="orange">{memberCount} üye</Badge>
              <Badge tone="blue">{followerCount} takipçi</Badge>
              <Badge tone="green">{postCount} gönderi</Badge>
            </div>
          </div>
        </Card>
      </Link>
    </AnimatedCard>
  );
}

export function ActivityItem({
  icon: Icon,
  title,
  body,
  tone = "orange",
  pulse = false,
}: {
  icon: IconType;
  title: string;
  body: string;
  tone?: keyof typeof toneClasses;
  pulse?: boolean;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/70 bg-white/68 p-3 shadow-sm backdrop-blur transition hover:bg-white">
      <span className={cn("relative flex size-10 shrink-0 items-center justify-center rounded-2xl", toneClasses[tone].split(" ").slice(2).join(" "))}>
        {pulse ? (
          <span className="absolute inset-0 rounded-2xl bg-current opacity-10 motion-safe:animate-pulse" />
        ) : null}
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black text-slate-950">{title}</span>
        <span className="mt-0.5 line-clamp-2 block text-xs font-semibold leading-5 text-slate-500">
          {body}
        </span>
      </span>
    </div>
  );
}

export function StepCard({
  index,
  title,
  body,
  icon: Icon,
}: {
  index: number;
  title: string;
  body: string;
  icon: IconType;
}) {
  return (
    <AnimatedCard>
      <Card className="h-full p-5">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15">
            <Icon className="size-5" />
          </span>
          <div>
            <span className="text-xs font-black uppercase text-[var(--primary)]">
              Adım {index}
            </span>
            <h3 className="mt-1 text-lg font-black text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </div>
        </div>
      </Card>
    </AnimatedCard>
  );
}

export function MiniTimelineItem({
  title,
  meta,
}: {
  title: string;
  meta: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 shadow-sm ring-1 ring-white/70">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[var(--primary)]">
        <Clock3 className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-slate-950">{title}</span>
        <span className="block text-xs font-semibold text-slate-500">{meta}</span>
      </span>
    </div>
  );
}
