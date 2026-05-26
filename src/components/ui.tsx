/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn, initials } from "@/lib/utils";

export function Card({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl",
        "transition-colors duration-300",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const variants = {
    primary:
      "bg-[var(--primary)] text-slate-950 shadow-lg shadow-cyan-950/15 hover:brightness-105",
    secondary:
      "border border-[var(--border)] bg-[var(--surface-muted)] text-slate-900 shadow-sm hover:border-cyan-300/50 hover:bg-cyan-400/10",
    danger: "bg-red-600 text-white shadow-lg shadow-red-900/15 hover:bg-red-700",
    ghost: "text-slate-700 hover:bg-white/70 hover:text-slate-950",
  };

  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-black transition",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  href,
  className,
  variant = "primary",
}: {
  children: ReactNode;
  href: string;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const variants = {
    primary:
      "bg-[var(--primary)] text-slate-950 shadow-lg shadow-cyan-950/15 hover:brightness-105",
    secondary:
      "border border-[var(--border)] bg-[var(--surface-muted)] text-slate-900 shadow-sm hover:border-cyan-300/50 hover:bg-cyan-400/10",
    ghost: "text-slate-700 hover:bg-white/70 hover:text-slate-950",
  };

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-black transition",
        variants[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "amber" | "red" | "blue" | "orange" | "purple";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-black", tones[tone])}>
      {children}
    </span>
  );
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | readonly string[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <input
        className="h-11 rounded-2xl border border-white/80 bg-white/85 px-4 text-slate-950 outline-none shadow-inner shadow-slate-950/[0.02] transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <textarea
        className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-slate-950 outline-none shadow-inner shadow-slate-950/[0.02] transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        rows={rows}
      />
    </label>
  );
}

export function EmptyState({
  title,
  body,
  icon,
  action,
}: {
  title: string;
  body: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-orange-200/80 bg-white/72 p-7 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-300" />
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-orange-50 text-[var(--primary)] shadow-inner">
        {icon ?? <Sparkles className="size-5" />}
      </div>
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Avatar({
  firstName,
  lastName,
  src,
  size = "md",
}: {
  firstName?: string | null;
  lastName?: string | null;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-16 text-lg",
  };

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn("rounded-full object-cover ring-2 ring-white", sizes[size])}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-slate-950 font-black text-white ring-2 ring-white",
        sizes[size],
      )}
    >
      {initials(firstName, lastName)}
    </span>
  );
}

export function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-white/75 bg-white/78 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.07)] backdrop-blur">
      <div className="text-3xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-600">{label}</div>
    </div>
  );
}
