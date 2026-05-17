"use client";

import { Button } from "@/components/ui";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-[420px] place-items-center">
      <div className="max-w-md rounded-lg border border-red-100 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Bir şey ters gitti</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sayfayı tekrar yükleyebilir veya ana sayfaya dönebilirsin.
        </p>
        <Button className="mt-4" onClick={reset}>
          Tekrar dene
        </Button>
      </div>
    </div>
  );
}
