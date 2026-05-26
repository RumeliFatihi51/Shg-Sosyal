import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type IconType = ComponentType<{ className?: string }>;

export function SocialPage({
  children,
  rail,
  className,
}: {
  children: ReactNode;
  rail?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-6xl grid-cols-1 lg:grid-cols-[minmax(0,720px)_minmax(280px,1fr)]",
        "lg:min-h-screen lg:border-x lg:border-[var(--border)]",
        className,
      )}
    >
      <section className="min-w-0 border-[var(--border)] lg:border-r">{children}</section>
      {rail ? (
        <aside className="hidden min-w-0 bg-[var(--surface-muted)] px-5 py-5 lg:block">
          <div className="sticky top-5 space-y-4">{rail}</div>
        </aside>
      ) : null}
    </div>
  );
}

export function StickyPageHeader({
  title,
  eyebrow,
  subtitle,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-16 z-20 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 backdrop-blur-xl lg:top-0">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="truncate text-xl font-black text-[var(--foreground)]">{title}</h1>
          {subtitle ? (
            <p className="mt-1 max-w-xl text-sm leading-5 text-[var(--muted)]">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </header>
  );
}

export function PageTabs({
  tabs,
}: {
  tabs: Array<{ label: string; href: string; active?: boolean }>;
}) {
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-0.5 scrollbar-none">
      {tabs.map((tab) => (
        <Link
          key={`${tab.label}-${tab.href}`}
          href={tab.href}
          className={cn(
            "relative flex h-10 shrink-0 items-center px-3 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]",
            tab.active && "font-black text-[var(--foreground)]",
          )}
        >
          {tab.label}
          {tab.active ? (
             <span className="absolute inset-x-2 bottom-0 h-1 rounded-full bg-[var(--accent)]" />
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

export function FilterChips({
  chips,
}: {
  chips: Array<{ label: string; href: string; active?: boolean }>;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {chips.map((chip) => (
        <Link
          key={`${chip.label}-${chip.href}`}
          href={chip.href}
          className={cn(
            "inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-xs font-black transition",
            chip.active
              ? "border-cyan-300/50 bg-cyan-400/12 text-cyan-100"
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-cyan-300/40 hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
          )}
        >
          {chip.label}
        </Link>
      ))}
    </div>
  );
}

export function SearchBox({
  name = "q",
  defaultValue,
  placeholder,
}: {
  name?: string;
  defaultValue?: string;
  placeholder: string;
}) {
  return (
    <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm">
      <Search className="size-4 shrink-0 text-slate-400" />
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
      />
    </label>
  );
}

export function TimelineSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-[var(--border)] bg-[var(--surface)]", className)}>
      {children}
    </div>
  );
}

export function TimelineRow({
  icon,
  avatar,
  title,
  meta,
  badge,
  body,
  children,
  actions,
  href,
  compact = false,
}: {
  icon?: ReactNode;
  avatar?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
  body?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  href?: string;
  compact?: boolean;
}) {
  const content = (
    <>
      <div className="shrink-0">{avatar ?? icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 truncate text-sm font-black text-[var(--foreground)]">{title}</span>
          {meta ? <span className="text-xs font-medium text-[var(--muted)]">{meta}</span> : null}
          {badge}
        </div>
        {body ? <div className="mt-1 text-sm leading-6 text-slate-300">{body}</div> : null}
        {children ? <div className="mt-3">{children}</div> : null}
        {actions ? <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">{actions}</div> : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "flex gap-3 px-4 transition hover:bg-[var(--surface-muted)]",
          compact ? "py-3" : "py-4",
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("flex gap-3 px-4", compact ? "py-3" : "py-4")}>
      {content}
    </div>
  );
}

export function RailSection({
  title,
  children,
  actionHref,
  actionLabel = "Tümü",
}: {
  title: string;
  children: ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-base font-black text-[var(--foreground)]">{title}</h2>
        {actionHref ? (
          <Link href={actionHref} className="text-xs font-black text-[var(--accent)] hover:text-[var(--foreground)]">
            {actionLabel}
          </Link>
        ) : null}
      </div>
      <div className="divide-y divide-[var(--border)]">{children}</div>
    </section>
  );
}

export function RailItem({
  title,
  meta,
  href,
  icon: Icon,
}: {
  title: ReactNode;
  meta?: ReactNode;
  href?: string;
  icon?: IconType;
}) {
  const inner = (
    <>
      {Icon ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)]">
          <Icon className="size-4" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-[var(--foreground)]">{title}</span>
        {meta ? <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{meta}</span> : null}
      </span>
      {href ? <ArrowRight className="size-4 shrink-0 text-slate-300" /> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--surface-muted)]">
        {inner}
      </Link>
    );
  }

  return <div className="flex items-center gap-3 px-4 py-3">{inner}</div>;
}

export function InlineEmpty({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-4 py-8 text-center">
      <h3 className="text-base font-black text-[var(--foreground)]">{title}</h3>
      {body ? <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[var(--muted)]">{body}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function DateBlock({ date }: { date: string }) {
  const parsed = new Date(`${date}T00:00:00`);

  return (
    <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[var(--primary)] text-[#020617]">
      <span className="text-lg font-black leading-none">{parsed.getDate()}</span>
      <span className="mt-1 text-[10px] font-black uppercase">
        {parsed.toLocaleDateString("tr-TR", { month: "short" })}
      </span>
    </span>
  );
}

export function SocialBadge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "amber" | "red" | "blue" | "orange" | "purple";
}) {
  const tones = {
    slate: "border border-slate-400/20 bg-slate-400/10 text-slate-200",
    green: "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    amber: "border border-amber-400/20 bg-amber-400/10 text-amber-200",
    red: "border border-red-400/20 bg-red-400/10 text-red-200",
    blue: "border border-blue-400/20 bg-blue-400/10 text-blue-200",
    orange: "border border-orange-400/20 bg-orange-400/10 text-orange-200",
    purple: "border border-purple-400/20 bg-purple-400/10 text-purple-200",
  };

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-black", tones[tone])}>
      {children}
    </span>
  );
}
