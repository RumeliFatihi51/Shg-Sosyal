import Link from "next/link";
import { CalendarDays, Clock3, MapPin, Plus, Radio, Search, Sparkles, UsersRound } from "lucide-react";
import { AnimatedSection, OrganicGrid } from "@/components/motion";
import {
  BentoCard,
  CampusBoardPanel,
  FriendPulsePanel,
  PulseBadge,
  SignalMetric,
} from "@/components/radar";
import { Button, Card, EmptyState, LinkButton } from "@/components/ui";
import { EventCard } from "@/features/events/event-card";
import { getEventsData } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; location?: string; q?: string; message?: string }>;
}) {
  const query = await searchParams;
  const data = await getEventsData(query);
  const participantTotal = data.events.reduce(
    (sum: number, event: any) =>
      sum + (event.participant_count ?? event.event_participants?.[0]?.count ?? 0),
    0,
  );
  const firstEvent = data.events[0];
  const todayISO = new Date().toISOString().slice(0, 10);
  const todayEvents = data.events.filter((event: any) => event.event_date === todayISO);
  const capacitySignals = data.events.filter((event: any) => event.capacity).slice(0, 3);
  const friendPulseItems = Array.from(data.friendAttendanceByEvent.entries())
    .map(([eventId, friends]) => {
      const event = data.events.find((item: any) => item.id === eventId);

      if (!event) {
        return null;
      }

      return {
        title:
          friends.length > 1
            ? `${friends[0]?.first_name ?? "Bir arkadaşın"} ve ${friends.length - 1} arkadaşın gidiyor`
            : `${friends[0]?.first_name ?? "Bir arkadaşın"} gidiyor`,
        body: event.title,
        href: `/events/${event.id}`,
        friends,
      };
    })
    .filter(Boolean) as Array<{
      title: string;
      body: string;
      href: string;
      friends: any[];
    }>;

  const boardItems = [
    {
      title: `${data.events.length} yaklaşan etkinlik`,
      body: query.q || query.date || query.location ? "Filtre sonucundaki etkinlikler." : "Okulun yaklaşan programı.",
      icon: CalendarDays,
      tone: "orange" as const,
    },
    {
      title: `${participantTotal} katılım hareketi`,
      body: "Onaylı etkinliklerdeki toplam katılım sayısı.",
      icon: UsersRound,
      tone: "green" as const,
    },
    {
      title: todayEvents.length ? `${todayEvents.length} etkinlik bugün` : "Bugün sakin görünüyor",
      body: todayEvents[0]?.title ?? "Yeni etkinlik onaylanınca bugünün akışına düşer.",
      icon: Clock3,
      tone: "blue" as const,
    },
    {
      title: friendPulseItems[0]?.title ?? "Arkadaş katılımı bekleniyor",
      body: friendPulseItems[0]?.body ?? "Giriş yapınca kabul edilmiş arkadaşların vurgulanır.",
      icon: Radio,
      tone: "purple" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <AnimatedSection className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <PulseBadge tone="orange" live>
            Etkinlik Akışı
          </PulseBadge>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-slate-950 text-balance sm:text-5xl">
            Okulda sıradaki hareket nerede?
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Etkinlikleri sadece tarih olarak değil, arkadaş katılımı ve kontenjan bilgisiyle birlikte oku.
          </p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-[var(--primary)]"
        >
          <Plus className="size-4" />
          Etkinlik Ekle
        </Link>
      </AnimatedSection>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <AnimatedSection>
          <CampusBoardPanel
            items={boardItems}
            eyebrow="Etkinlik Panosu"
            title="Yaklaşan Program"
            description="Etkinlikleri daha sakin, okunabilir ve sosyal bağlamı güçlü bir panoda takip et."
            featured={
              firstEvent
                ? {
                    title: firstEvent.title,
                    body: `${formatDate(firstEvent.event_date)} · ${formatTime(firstEvent.start_time)} · ${firstEvent.location}`,
                    href: `/events/${firstEvent.id}`,
                  }
                : null
            }
          />
        </AnimatedSection>
        <AnimatedSection delay={0.08}>
          <FriendPulsePanel items={friendPulseItems.slice(0, 4)} signedIn={Boolean(data.profile)} />
        </AnimatedSection>
      </div>

      <OrganicGrid className="grid gap-4 md:grid-cols-3">
        <SignalMetric icon={CalendarDays} label="listelenen etkinlik" value={data.events.length} tone="orange" />
        <SignalMetric icon={Sparkles} label="katılım hareketi" value={participantTotal} tone="green" />
        <SignalMetric icon={UsersRound} label="arkadaş vurgusu" value={data.profile ? "açık" : "giriş gerekli"} tone="blue" />
      </OrganicGrid>

      {query.message ? (
        <AnimatedSection>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
            {query.message}
          </div>
        </AnimatedSection>
      ) : null}

      <AnimatedSection>
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <PulseBadge tone="blue">akış filtresi</PulseBadge>
              <h2 className="mt-2 text-xl font-black text-slate-950">Etkinlikleri daralt</h2>
            </div>
            <LinkButton href="/events" variant="ghost">Filtreleri temizle</LinkButton>
          </div>
          <form className="grid gap-3 md:grid-cols-[1fr_160px_170px_auto]">
            <label className="relative">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={query.q ?? ""}
                placeholder="Etkinlik ara"
                className="h-11 w-full rounded-2xl border border-white/80 bg-white/85 pl-11 pr-4 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              />
            </label>
            <input
              name="date"
              type="date"
              defaultValue={query.date ?? ""}
              className="h-11 rounded-2xl border border-white/80 bg-white/85 px-4 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
            />
            <label className="relative">
              <MapPin className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                name="location"
                defaultValue={query.location ?? ""}
                placeholder="Konum"
                className="h-11 w-full rounded-2xl border border-white/80 bg-white/85 pl-11 pr-4 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              />
            </label>
            <Button variant="secondary">Tara</Button>
          </form>
        </Card>
      </AnimatedSection>

      <AnimatedSection className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <PulseBadge tone="green" live={data.events.length > 0}>
              yaklaşan program
            </PulseBadge>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Etkinlik akışı</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Tarih kutusu, konum, kontenjan ve arkadaş vurgusu aynı kartta okunur.
            </p>
          </div>
        </div>

        {data.events.length ? (
          <OrganicGrid className="grid gap-4 lg:grid-cols-2">
            {data.events.map((event: any) => (
              <EventCard
                key={event.id}
                event={event}
                friends={data.friendAttendanceByEvent.get(event.id) ?? []}
              />
            ))}
          </OrganicGrid>
        ) : (
          <EmptyState
            title="İlk hareketi sen başlat"
            body="Filtrelerde etkinlik bulunamadı. Yeni bir etkinlik önerisi göndererek okul akışını hareketlendirebilirsin."
            icon={<CalendarDays className="size-5" />}
            action={<LinkButton href="/events/new">Etkinlik oluştur</LinkButton>}
          />
        )}
      </AnimatedSection>

      {capacitySignals.length ? (
        <AnimatedSection className="grid gap-4 md:grid-cols-3">
          {capacitySignals.map((event: any) => {
            const count = event.participant_count ?? event.event_participants?.[0]?.count ?? 0;

            return (
              <BentoCard key={event.id} tone="amber">
                <PulseBadge tone="amber">kontenjan nabzı</PulseBadge>
                <h3 className="mt-4 text-xl font-black text-slate-950">{event.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {count}/{event.capacity} kontenjan dolu. Etkinlik yaklaştıkça hareket artabilir.
                </p>
              </BentoCard>
            );
          })}
        </AnimatedSection>
      ) : null}
    </div>
  );
}
