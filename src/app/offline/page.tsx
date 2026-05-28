import { WifiOff } from "lucide-react";
import { LinkButton } from "@/components/ui";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-10">
      <section className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-200">
          <WifiOff className="size-7" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-[var(--foreground)]">Bağlantı yok.</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          ŞHG Sosyal çevrimdışı modda. Bağlantın geri gelince akış ve bildirimler güncellenir.
        </p>
        <div className="mt-6 flex justify-center">
          <LinkButton href="/" variant="secondary">
            Ana Akış
          </LinkButton>
        </div>
      </section>
    </main>
  );
}
