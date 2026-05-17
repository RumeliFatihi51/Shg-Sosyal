"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const errorWords = [
  "hata",
  "eksik",
  "edilemedi",
  "olmadı",
  "geçersiz",
  "reddedildi",
  "gerekli",
  "askıya",
];

export function Toast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryMessage = searchParams.get("message");
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);
  const visible = Boolean(queryMessage && dismissedMessage !== queryMessage);
  const tone = useMemo(() => {
    const lower = (queryMessage ?? "").toLocaleLowerCase("tr");

    return errorWords.some((word) => lower.includes(word)) ? "error" : "success";
  }, [queryMessage]);

  useEffect(() => {
    if (!queryMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDismissedMessage(queryMessage);
      const next = new URLSearchParams(searchParams.toString());
      next.delete("message");
      const nextUrl = next.toString() ? `${pathname}?${next}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [pathname, queryMessage, router, searchParams]);

  if (!queryMessage || !visible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-lg border px-4 py-3 text-sm font-semibold shadow-xl transition ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-emerald-200 bg-white text-slate-900"
      }`}
      role="status"
    >
      <CheckCircle2
        className={`mt-0.5 size-4 shrink-0 ${
          tone === "error" ? "text-red-600" : "text-emerald-600"
        }`}
      />
      <span className="min-w-0 flex-1 leading-6">{queryMessage}</span>
      <button
        type="button"
        onClick={() => setDismissedMessage(queryMessage)}
        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        aria-label="Bildirimi kapat"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
