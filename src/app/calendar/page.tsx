import Link from "next/link";
import type { ReactNode } from "react";
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
import { CalendarDays, LayoutGrid, List, Search } from "lucide-react";
import { getCalendarData } from "@/lib/data";
import { Button, Card, EmptyState, Field, LinkButton } from "@/components/ui";
import { EventCard } from "@/features/events/event-card";
import { formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; location?: string; q?: string; view?: string }>;
}) {
  const filters = await searchParams;
  const view = ["month", "week", "list"].includes(filters.view ?? "")
    ? filters.view!
    : "month";
  const selectedDate = filters.date ? parseISO(filters.date) : new Date();
  const { events } = await getCalendarData(filters);
  const selectedISO = format(selectedDate, "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-[#f05a28]">
            <CalendarDays className="size-4" />
            Etkinlik takvimi
          </div>
          <h1 className="mt-1 text-3xl font-black text-slate-950">
            {format(selectedDate, "MMMM yyyy", { locale: tr })}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Aylık, haftalık veya liste görünümüyle kampüs etkinliklerini filtrele.
          </p>
        </div>
        <div className="flex rounded-md border border-[var(--border-soft)] bg-white p-1">
          <ViewLink view="month" current={view} date={selectedISO} label="Ay" icon={<LayoutGrid className="size-4" />} />
          <ViewLink view="week" current={view} date={selectedISO} label="Hafta" icon={<CalendarDays className="size-4" />} />
          <ViewLink view="list" current={view} date={selectedISO} label="Liste" icon={<List className="size-4" />} />
        </div>
      </div>

      <Card>
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_1.3fr_auto]">
          <input type="hidden" name="view" value={view} />
          <Field label="Tarih" name="date" type="date" defaultValue={filters.date ?? selectedISO} />
          <Field label="Konum" name="location" defaultValue={filters.location ?? ""} placeholder="Konferans salonu" />
          <Field label="Arama" name="q" defaultValue={filters.q ?? ""} placeholder="robotik, tiyatro, turnuva" />
          <div className="flex items-end">
            <Button variant="secondary" className="w-full">
              <Search className="size-4" />
              Filtrele
            </Button>
          </div>
        </form>
      </Card>

      {view === "month" ? (
        <MonthCalendar selectedDate={selectedDate} events={events} />
      ) : null}

      {view === "week" ? (
        <WeekCalendar selectedDate={selectedDate} events={events} />
      ) : null}

      {view === "list" ? (
        events.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Etkinlik bulunamadı"
            body="Filtreleri değiştirerek tekrar deneyebilirsin."
            icon={<Search className="size-5" />}
            action={<LinkButton href="/calendar">Filtreleri temizle</LinkButton>}
          />
        )
      ) : null}
    </div>
  );
}

function ViewLink({
  view,
  current,
  date,
  label,
  icon,
}: {
  view: string;
  current: string;
  date: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={`/calendar?view=${view}&date=${date}`}
      className={`inline-flex h-9 items-center gap-1.5 rounded px-3 text-sm font-bold transition ${
        current === view
          ? "bg-[#f05a28] text-white"
          : "text-slate-600 hover:bg-orange-50"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function MonthCalendar({ selectedDate, events }: { selectedDate: Date; events: any[] }) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 1 }),
  });

  return (
    <Card className="p-0">
      <div className="grid grid-cols-7 border-b border-[var(--border-soft)] text-center text-xs font-black uppercase text-slate-500">
        {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
          <div key={day} className="p-3">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-7">
        {days.map((day) => {
          const dayEvents = events.filter((event) => isSameDay(parseISO(event.event_date), day));
          const isCurrentMonth = day.getMonth() === selectedDate.getMonth();

          return (
            <div
              key={day.toISOString()}
              className={`min-h-32 border-b border-r border-[var(--border-soft)] p-3 ${
                isCurrentMonth ? "bg-white" : "bg-slate-50/70 text-slate-400"
              }`}
            >
              <div className="text-sm font-black">{format(day, "d")}</div>
              <div className="mt-3 grid gap-1.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="truncate rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-800 hover:bg-orange-100"
                  >
                    {formatTime(event.start_time)} {event.title}
                  </Link>
                ))}
                {dayEvents.length > 3 ? (
                  <span className="text-xs font-bold text-slate-500">
                    +{dayEvents.length - 3} etkinlik
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function WeekCalendar({ selectedDate, events }: { selectedDate: Date; events: any[] }) {
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), index),
  );

  return (
    <div className="grid gap-3 md:grid-cols-7">
      {weekDays.map((day) => {
        const dayEvents = events.filter((event) => isSameDay(parseISO(event.event_date), day));

        return (
          <Card key={day.toISOString()} className="min-h-48 p-4">
            <div className="text-xs font-bold uppercase text-slate-500">
              {format(day, "EEEE", { locale: tr })}
            </div>
            <div className="mt-1 text-2xl font-black text-slate-950">
              {format(day, "d")}
            </div>
            <div className="mt-4 grid gap-2">
              {dayEvents.length ? (
                dayEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="rounded-md bg-blue-50 p-2 text-xs font-bold leading-5 text-blue-900 hover:bg-blue-100"
                  >
                    {formatTime(event.start_time)} · {event.title}
                  </Link>
                ))
              ) : (
                <span className="text-xs text-slate-500">Etkinlik yok</span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
