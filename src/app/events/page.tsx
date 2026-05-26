import Link from "next/link";
import { CalendarDays, Clock3, MapPin, Plus, UsersRound } from "lucide-react";
import { Button, LinkButton } from "@/components/ui";
import {
  DateBlock,
  FilterChips,
  InlineEmpty,
  PageTabs,
  RailItem,
  RailSection,
  SearchBox,
  SocialBadge,
  SocialPage,
  StickyPageHeader,
  TimelineRow,
  TimelineSurface,
} from "@/components/social-ui";
import { toggleEventParticipationAction } from "@/lib/actions/events";
import { getEventsData } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/utils";
import type { FriendAttendance } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; location?: string; q?: string; message?: string }>;
}) {
  const query = await searchParams;
  const data = await getEventsData(query);
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = data.events.filter((event: any) => event.event_date === today);
  const popularEvents = [...data.events]
    .sort((a: any, b: any) => participantCount(b) - participantCount(a))
    .slice(0, 5);
  const activeTab = query.date === today ? "Bugün" : query.q ? "Filtre" : "Yaklaşan";

  return (
    <SocialPage
      rail={<EventsRail events={data.events} todayEvents={todayEvents} popularEvents={popularEvents} />}
    >
      <StickyPageHeader
        title="Etkinlikler"
        action={
          <LinkButton href="/events/new" className="h-10 px-4">
            <Plus className="size-4" />
            Öner
          </LinkButton>
        }
      >
        <PageTabs
          tabs={[
            { label: "Yaklaşan", href: "/events", active: activeTab === "Yaklaşan" },
            { label: "Bugün", href: `/events?date=${today}`, active: activeTab === "Bugün" },
            { label: "Popüler", href: "/events?q=popüler", active: false },
            { label: "Takvim", href: "/calendar" },
          ]}
        />
        <form className="mt-3 flex flex-col gap-2 sm:flex-row">
          <SearchBox defaultValue={query.q} placeholder="Etkinlik ara" />
          <input
            name="date"
            type="date"
            defaultValue={query.date ?? ""}
            className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none"
          />
          <input
            name="location"
            defaultValue={query.location ?? ""}
            placeholder="Konum"
            className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none"
          />
          <Button variant="secondary">Ara</Button>
        </form>
        <div className="mt-3">
          <FilterChips
            chips={[
              { label: "Tümü", href: "/events", active: !query.q && !query.date && !query.location },
              { label: "Spor", href: "/events?q=spor", active: query.q === "spor" },
              { label: "Kulüp", href: "/events?q=kulüp", active: query.q === "kulüp" },
              { label: "Atölye", href: "/events?q=atölye", active: query.q === "atölye" },
              { label: "Sosyal", href: "/events?q=sosyal", active: query.q === "sosyal" },
              { label: "Yarışma", href: "/events?q=yarışma", active: query.q === "yarışma" },
            ]}
          />
        </div>
      </StickyPageHeader>

      {query.message ? (
        <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {query.message}
        </div>
      ) : null}

      <TimelineSurface>
        {data.events.length ? (
          data.events.map((event: any) => (
            <EventTimelineItem
              key={event.id}
              event={event}
              signedIn={Boolean(data.profile)}
              friends={data.friendAttendanceByEvent.get(event.id) ?? []}
            />
          ))
        ) : (
          <InlineEmpty
            title="Etkinlik bulunamadı"
            body="Bugün için etkinlik yok. Etkinlik öner."
            action={<LinkButton href="/events/new">Etkinlik öner</LinkButton>}
          />
        )}
      </TimelineSurface>
    </SocialPage>
  );
}

function EventTimelineItem({
  event,
  signedIn,
  friends,
}: {
  event: any;
  signedIn: boolean;
  friends: FriendAttendance[];
}) {
  const count = participantCount(event);
  const capacity = event.capacity ? `${count}/${event.capacity}` : `${count} katılımcı`;
  const friendText = friends.length
    ? `${friends[0]?.first_name ?? "Bir arkadaşın"}${friends.length > 1 ? ` ve ${friends.length - 1} arkadaşın` : ""} katılıyor`
    : null;

  return (
    <TimelineRow
      avatar={<DateBlock date={event.event_date} />}
      title={event.title}
      meta={`· ${event.communities?.name ?? "Okul"} · ${formatDate(event.event_date)}`}
      badge={event.lifecycle && event.lifecycle !== "scheduled" ? (
        <SocialBadge tone={event.lifecycle === "canceled" ? "red" : "amber"}>
          {event.lifecycle === "canceled" ? "İptal" : "Ertelendi"}
        </SocialBadge>
      ) : <SocialBadge tone="orange">Etkinlik</SocialBadge>}
      body={<span className="line-clamp-2">{event.description}</span>}
      actions={
        <>
          <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" />{formatTime(event.start_time)}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{event.location}</span>
          <span className="inline-flex items-center gap-1.5"><UsersRound className="size-4" />{capacity}</span>
          {signedIn ? (
            <>
              <ParticipationButton eventId={event.id} status="going" label="Katıl" strong />
              <ParticipationButton eventId={event.id} status="interested" label="İlgileniyorum" />
            </>
          ) : (
            <Link href="/login" className="font-black text-slate-950 hover:text-cyan-500">
              Katıl
            </Link>
          )}
          <Link href={`/events/${event.id}`} className="font-black text-slate-950 hover:text-cyan-500">
            Detay
          </Link>
        </>
      }
    >
      {friendText ? (
        <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
          {friendText}
        </div>
      ) : null}
    </TimelineRow>
  );
}

function ParticipationButton({
  eventId,
  status,
  label,
  strong = false,
}: {
  eventId: string;
  status: "going" | "interested";
  label: string;
  strong?: boolean;
}) {
  return (
    <form action={toggleEventParticipationAction}>
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="is_joined" value="false" />
      <input type="hidden" name="participation_status" value={status} />
      <button type="submit" className={strong ? "font-black text-slate-950 hover:text-cyan-500" : "hover:text-slate-950"}>
        {label}
      </button>
    </form>
  );
}

function EventsRail({
  events,
  todayEvents,
  popularEvents,
}: {
  events: any[];
  todayEvents: any[];
  popularEvents: any[];
}) {
  return (
    <>
      <RailSection title="Bugün okulda" actionHref={`/events?date=${new Date().toISOString().slice(0, 10)}`}>
        {todayEvents.length ? todayEvents.slice(0, 4).map((event) => (
          <RailItem
            key={event.id}
            title={event.title}
            meta={`${formatTime(event.start_time)} · ${event.location}`}
            href={`/events/${event.id}`}
            icon={CalendarDays}
          />
        )) : <RailItem title="Bugün henüz sakin." meta="Etkinlik öner." icon={CalendarDays} href="/events/new" />}
      </RailSection>
      <RailSection title="Yakında" actionHref="/calendar">
        {events.slice(0, 5).map((event) => (
          <RailItem
            key={event.id}
            title={event.title}
            meta={`${formatDate(event.event_date)} · ${formatTime(event.start_time)}`}
            href={`/events/${event.id}`}
            icon={Clock3}
          />
        ))}
      </RailSection>
      <RailSection title="İlgi görenler">
        {popularEvents.length ? popularEvents.map((event) => (
          <RailItem
            key={event.id}
            title={event.title}
            meta={`${participantCount(event)} katılım`}
            href={`/events/${event.id}`}
            icon={UsersRound}
          />
        )) : <RailItem title="İlk katılımı sen başlat." icon={UsersRound} />}
      </RailSection>
    </>
  );
}

function participantCount(event: any) {
  return event.participant_count ?? event.event_participants?.[0]?.count ?? 0;
}
