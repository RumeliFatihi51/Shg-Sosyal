"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ComponentType } from "react";
import {
  Bell,
  CalendarDays,
  Compass,
  Home,
  ListChecks,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Avatar, Button, LinkButton } from "@/components/ui";
import { signOutAction } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";
import { cn, fullName } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const nav: NavItem[] = [
  { href: "/", label: "Ana Akış", icon: Home },
  { href: "/posts", label: "Keşfet", icon: Compass },
  { href: "/events", label: "Etkinlik", icon: CalendarDays },
  { href: "/communities", label: "Topluluk", icon: UsersRound },
  { href: "/calendar", label: "Takvim", icon: ListChecks },
  { href: "/friends", label: "Arkadaş", icon: UserRound },
  { href: "/notifications", label: "Bildirim", icon: Bell },
];

export function ShellFrame({
  children,
  profile,
  unreadCount,
  showAdmin,
  displayName,
}: {
  children: React.ReactNode;
  profile: Profile | null;
  unreadCount: number;
  showAdmin: boolean | null;
  displayName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = showAdmin
    ? [...nav, { href: "/admin", label: "Admin", icon: ShieldCheck }]
    : nav;

  return (
    <div className="min-h-screen text-slate-950">
      <aside className="fixed inset-y-4 left-4 z-30 hidden w-24 flex-col items-center rounded-[2rem] border border-white/60 bg-[#11100f]/92 px-3 py-4 text-white shadow-[0_24px_90px_rgba(15,23,42,0.28)] backdrop-blur-2xl lg:flex">
        <Link href="/" className="group flex flex-col items-center gap-2" aria-label={displayName}>
          <LogoMark />
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">ŞHG</span>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col items-center gap-2">
          {items.map((item) => (
            <DockLink
              key={item.href}
              item={item}
              pathname={pathname}
              unreadCount={unreadCount}
            />
          ))}
        </nav>

        <div className="mt-5 w-full">
          {profile ? (
            <Link
              href={`/profile/${profile.id}`}
              className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/10 transition hover:bg-white/16"
              title={fullName(profile)}
            >
              <Avatar firstName={profile.first_name} lastName={profile.last_name} size="sm" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-slate-950 transition hover:bg-orange-50"
              title="Giriş"
            >
              <UserRound className="size-5" />
            </Link>
          )}
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/70 bg-white/78 shadow-sm backdrop-blur-2xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark />
            <span>
              <span className="block text-sm font-black leading-4">{displayName}</span>
              <span className="block text-[10px] font-bold text-slate-500">Okulun ana akışı</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="relative text-slate-700">
              <Bell className="size-5" />
              {unreadCount ? (
                <span className="absolute -right-2 -top-2 rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-black text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/80 bg-white/80 shadow-sm"
              aria-label="Menüyü aç"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            aria-label="Menüyü kapat"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-80 max-w-[84vw] flex-col border-r border-white/70 bg-white/90 shadow-2xl backdrop-blur-2xl">
            <div className="flex h-16 items-center justify-between border-b border-white/70 px-4">
              <div className="flex items-center gap-2">
                <LogoMark />
                <span className="font-black">{displayName}</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-2xl hover:bg-orange-50"
                aria-label="Menüyü kapat"
              >
                <X className="size-5" />
              </button>
            </div>
            <MobileDrawerNav
              items={items}
              pathname={pathname}
              unreadCount={unreadCount}
              onNavigate={() => setOpen(false)}
            />
            <DrawerProfile profile={profile} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <main className="min-h-screen pt-16 lg:ml-28 lg:pt-0">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function DockLink({
  item,
  pathname,
  unreadCount,
}: {
  item: NavItem;
  pathname: string;
  unreadCount: number;
}) {
  const Icon = item.icon;
  const active = item.href === "/"
    ? pathname === "/"
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const badge = item.href === "/notifications" ? unreadCount : 0;

  return (
    <Link
      href={item.href}
      title={item.label}
      className={cn(
        "group relative flex size-[3.25rem] items-center justify-center rounded-[1.25rem] transition",
        active
          ? "bg-white text-slate-950 shadow-[0_12px_30px_rgba(255,255,255,0.12)]"
          : "text-slate-400 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className="size-5" />
      <span className="pointer-events-none absolute left-[4.2rem] top-1/2 hidden -translate-y-1/2 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white opacity-0 shadow-xl transition group-hover:translate-x-1 group-hover:opacity-100 xl:block">
        {item.label}
      </span>
      {badge ? (
        <span className="absolute -right-1 -top-1 rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-black text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

function MobileDrawerNav({
  items,
  pathname,
  unreadCount,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  unreadCount: number;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const badge = item.href === "/notifications" ? unreadCount : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-black transition",
              active
                ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15"
                : "text-slate-700 hover:bg-white/82 hover:text-slate-950",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
            {badge ? (
              <span
                className={cn(
                  "ml-auto rounded-full px-1.5 text-[10px] font-black",
                  active ? "bg-white/20 text-white" : "bg-[var(--primary)] text-white",
                )}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function DrawerProfile({
  profile,
  onNavigate,
}: {
  profile: Profile | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="border-t border-white/70 p-4">
      {profile ? (
        <div className="space-y-3 rounded-3xl bg-white/65 p-3 shadow-inner shadow-slate-950/[0.03]">
          <Link
            href={`/profile/${profile.id}`}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-orange-50"
          >
            <Avatar firstName={profile.first_name} lastName={profile.last_name} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">{fullName(profile)}</span>
              <span className="block text-xs font-bold text-slate-500">{profile.role}</span>
            </span>
          </Link>
          <form action={signOutAction}>
            <Button variant="secondary" className="w-full justify-center">
              <LogOut className="size-4" />
              Çıkış
            </Button>
          </form>
        </div>
      ) : (
        <div className="grid gap-2 rounded-3xl bg-white/65 p-3">
          <LinkButton href="/login" variant="secondary" className="w-full">
            Giriş
          </LinkButton>
          <LinkButton href="/register" className="w-full">
            Kayıt Ol
          </LinkButton>
        </div>
      )}
    </div>
  );
}

function LogoMark() {
  return (
    <span
      aria-hidden="true"
      className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-orange-500 via-amber-400 to-sky-400 shadow-lg shadow-orange-900/20"
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.65),transparent_28%)]" />
      <span className="relative size-3.5 rounded-full bg-white" />
      <span className="absolute bottom-2.5 right-2.5 size-1.5 rounded-full bg-white/85" />
    </span>
  );
}
