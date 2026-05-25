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
  MessageCircle,
  Menu,
  PenLine,
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
  { href: "/events", label: "Etkinlikler", icon: CalendarDays },
  { href: "/communities", label: "Topluluklar", icon: UsersRound },
  { href: "/calendar", label: "Takvim", icon: ListChecks },
  { href: "/friends", label: "Arkadaşlar", icon: UserRound },
  { href: "/messages", label: "Mesajlar", icon: MessageCircle },
  { href: "/notifications", label: "Bildirimler", icon: Bell },
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
  const profileItem = profile
    ? [{ href: `/profile/${profile.id}`, label: "Profil", icon: UserRound }]
    : [];
  const adminItems = showAdmin
    ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }]
    : [];
  const items = [...nav, ...profileItem, ...adminItems];

  return (
    <div className="min-h-screen text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-24 flex-col border-r border-slate-200 bg-white/92 px-3 py-4 backdrop-blur-xl lg:flex xl:w-72 xl:px-5">
        <Link href="/" className="mb-4 flex h-12 items-center gap-3 rounded-full px-2 transition hover:bg-slate-100" aria-label={displayName}>
          <LogoMark />
          <span className="hidden min-w-0 xl:block">
            <span className="block truncate text-lg font-black leading-5">{displayName}</span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <DockLink
              key={item.href}
              item={item}
              pathname={pathname}
              unreadCount={unreadCount}
            />
          ))}
          <Link
            href={profile ? "/posts" : "/login"}
            className="mt-3 flex h-12 items-center justify-center gap-3 rounded-full bg-slate-950 px-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 xl:justify-start xl:px-5"
          >
            <PenLine className="size-5" />
            <span className="hidden xl:inline">Paylaş</span>
          </Link>
        </nav>

        <div className="mt-5">
          {profile ? (
            <div className="rounded-full p-2 transition hover:bg-slate-100 xl:rounded-2xl">
              <Link href={`/profile/${profile.id}`} className="flex items-center justify-center gap-3 xl:justify-start">
                <Avatar firstName={profile.first_name} lastName={profile.last_name} size="sm" />
                <span className="hidden min-w-0 flex-1 xl:block">
                  <span className="block truncate text-sm font-black">{fullName(profile)}</span>
                  <span className="block truncate text-xs font-semibold text-slate-500">{profile.role}</span>
                </span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-2">
              <LinkButton href="/login" variant="secondary" className="hidden xl:flex">
                Giriş
              </LinkButton>
              <Link
                href="/login"
                className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800 xl:hidden"
                title="Giriş"
              >
                <UserRound className="size-5" />
              </Link>
            </div>
          )}
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/92 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark />
            <span>
              <span className="block text-sm font-black leading-4">{displayName}</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="relative text-slate-700">
              <Bell className="size-5" />
              {unreadCount ? (
                <span className="absolute -right-2 -top-2 rounded-full bg-slate-950 px-1.5 text-[10px] font-black text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm"
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
          <div className="relative flex h-full w-80 max-w-[84vw] flex-col border-r border-slate-200 bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <div className="flex items-center gap-2">
                <LogoMark />
                <span className="font-black">{displayName}</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-full hover:bg-slate-100"
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

      <main className="min-h-screen pt-16 lg:ml-24 lg:pt-0 xl:ml-72">
        <div className="mx-auto w-full max-w-[1440px] px-0 lg:px-4 xl:px-6">
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
        "group relative flex h-12 items-center justify-center gap-4 rounded-full px-3 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 xl:justify-start xl:px-4",
        active && "font-black text-slate-950",
      )}
    >
      <Icon className={cn("size-6", active && "stroke-[2.8]")} />
      <span className="hidden text-xl font-medium xl:inline">{item.label}</span>
      {badge ? (
        <span className="absolute left-10 top-1 rounded-full bg-slate-950 px-1.5 text-[10px] font-black text-white xl:left-8">
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
              "flex h-12 items-center gap-3 rounded-full px-4 text-sm font-black transition",
              active
                ? "bg-slate-950 text-white"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
            )}
          >
            <Icon className="size-5 shrink-0" />
            <span>{item.label}</span>
            {badge ? (
              <span
                className={cn(
                  "ml-auto rounded-full px-1.5 text-[10px] font-black",
                  active ? "bg-white/20 text-white" : "bg-slate-950 text-white",
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
    <div className="border-t border-slate-200 p-4">
      {profile ? (
        <div className="space-y-3 rounded-3xl bg-slate-50 p-3">
          <Link
            href={`/profile/${profile.id}`}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-white"
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
        <div className="grid gap-2 rounded-3xl bg-slate-50 p-3">
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
      className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-950 text-white shadow-sm"
    >
      <span className="text-sm font-black">Ş</span>
      <span className="absolute right-2 top-2 size-2 rounded-full bg-orange-400" />
    </span>
  );
}
