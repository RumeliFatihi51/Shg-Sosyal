import Link from "next/link";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarDays, Clock3, List, Search } from "lucide-react";
import { Button, LinkButton } from "@/components/ui";
import {
  DateBlock,
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
import { getCalendarData } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; location?: string; q?: string; view?: string }>;
}) {
  const filters = await searchParams;
  const view = ["month", "week", "list"].includes(filters.view ?? "") ? filters.view! : "list";
  const selectedDate = filters.date ? parseISO(filters.date) : new Date();
  const selectedISO = format(selectedDate, "yyyy-MM-dd");
  const { events } = await getCalendarData({ ...filters, view });
  const selectedDayEvents = events.filter((event: any) => isSameDay(parseISO(event.event_date), selectedDate));

  return (
    <SocialPage
      rail={<CalendarRail events={events} selectedEvents={selectedDayEvents} selectedDate={selectedDate} />}
    >
      <StickyPageHeader title="Takvim" subtitle={format(selectedDate, "d MMMM yyyy", { locale: tr })}>
        <PageTabs
          tabs={[
            { label: "Liste", href: `/calendar?view=list&date=${selectedISO}`, active: view === "list" },
            { label: "Haftalık", href: `/calendar?view=week&date=${selectedISO}`, active: view === "week" },
            { label: "Aylık", href: `/calendar?view=month&date=${selectedISO}`, active: view === "month" },
          ]}
        />
        <form className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="view" value={view} />
          <SearchBox defaultValue={filters.q} placeholder="Takvimde ara" />
          <input
            name="date"
            type="date"
            defaultValue={filters.date ?? selectedISO}
            className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none"
          />
          <input
            name="location"
            defaultValue={filters.location ?? ""}
            placeholder="Konum"
            className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none"
          />
          <Button variant="secondary">Filtrele</Button>
        </form>
      </StickyPageHeader>

      {view === "month" ? <MonthCalendar selectedDate={selectedDate} events={events} /> : null}
      {view === "week" ? <WeekCalendar selectedDate={selectedDate} events={events} /> : null}
      {view === "list" ? <CalendarList events={events} /> : null}
    </SocialPage>
  );
}

function CalendarList({ events }: { events: any[] }) {
  return (
    <TimelineSurface>
      {events.length ? events.map((event: any) => (
        <CalendarEventRow key={event.id} event={event} />
      )) : (
        <InlineEmpty
          title="Etkinlik yok"
          body="Bugün için etkinlik yok. Etkinlik öner."
          action={<LinkButton href="/events/new">Etkinlik öner</LinkButton>}
        />
      )}
    </TimelineSurface>
  );
}

function CalendarEventRow({ event }: { event: any }) {
  return (
    <TimelineRow
      avatar={<DateBlock date={event.event_date} />}
      title={event.title}
      meta={`· ${formatDate(event.event_date)} · ${formatTime(event.start_time)}`}
      badge={<SocialBadge tone="orange">Etkinlik</SocialBadge>}
      body={`${event.location}${event.communities?.name ? ` · ${event.communities.name}` : ""}`}
      actions={
        <>
          <Link href={`/events/${event.id}`} className="font-black text-slate-950 hover:text-orange-700">
            Etkinliği görüntüle
          </Link>
          <Link href="/events/new" className="hover:text-slate-950">Etkinlik öner</Link>
        </>
      }
    />
  );
}

function MonthCalendar({ selectedDate, events }: { selectedDate: Date; events: any[] }) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 1 }),
  });

  return (
    <div className="bg-white">
      <div className="grid grid-cols-7 border-b border-slate-100 text-center text-[11px] font-black uppercase text-slate-500">
        {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
          <div key={day} className="p-2 sm:p-3">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = events.filter((event) => isSameDay(parseISO(event.event_date), day));
          const currentMonth = day.getMonth() === selectedDate.getMonth();

          return (
            <Link
              key={day.toISOString()}
              href={`/calendar?view=list&date=${format(day, "yyyy-MM-dd")}`}
              className={`min-h-24 border-b border-r border-slate-100 p-2 transition hover:bg-slate-50 sm:min-h-32 ${
                currentMonth ? "bg-white" : "bg-slate-50/60 text-slate-400"
              }`}
            >
              <div className="text-sm font-black">{format(day, "d")}</div>
              <div className="mt-2 grid gap-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <span
                    key={event.id}
                    className="truncate rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black text-orange-700"
                  >
                    {formatTime(event.start_time)} {event.title}
                  </span>
                ))}
                {dayEvents.length > 2 ? (
                  <span className="text-[10px] font-black text-slate-500">+{dayEvents.length - 2}</span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function WeekCalendar({ selectedDate, events }: { selectedDate: Date; events: any[] }) {
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), index),
  );

  return (
    <div className="divide-y divide-slate-100 bg-white">
      {weekDays.map((day) => {
        const dayEvents = events.filter((event) => isSameDay(parseISO(event.event_date), day));

        return (
          <section key={day.toISOString()} className="px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-black text-slate-950">{format(day, "EEEE, d MMMM", { locale: tr })}</h2>
              <SocialBadge tone={dayEvents.length ? "orange" : "slate"}>
                {dayEvents.length ? `${dayEvents.length} etkinlik` : "Sakin"}
              </SocialBadge>
            </div>
            {dayEvents.length ? (
              <div className="grid gap-2">
                {dayEvents.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-orange-50">
                    {formatTime(event.start_time)} · {event.title}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Bugün için etkinlik yok.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function CalendarRail({
  events,
  selectedEvents,
  selectedDate,
}: {
  events: any[];
  selectedEvents: any[];
  selectedDate: Date;
}) {
  return (
    <>
      <RailSection title="Seçili gün">
        {selectedEvents.length ? selectedEvents.map((event) => (
          <RailItem
            key={event.id}
            title={event.title}
            meta={`${formatTime(event.start_time)} · ${event.location}`}
            href={`/events/${event.id}`}
            icon={Clock3}
          />
        )) : <RailItem title="Bugün için etkinlik yok." meta="Etkinlik öner." href="/events/new" icon={CalendarDays} />}
      </RailSection>
      <RailSection title="Yakında" actionHref="/events">
        {events.slice(0, 5).map((event) => (
          <RailItem key={event.id} title={event.title} meta={formatDate(event.event_date)} href={`/events/${event.id}`} icon={List} />
        ))}
      </RailSection>
      <RailSection title={format(selectedDate, "MMMM", { locale: tr })}>
        <RailItem title="Takvimde ara" meta="Tarih, konum veya konu" icon={Search} />
      </RailSection>
    </>
  );
}
