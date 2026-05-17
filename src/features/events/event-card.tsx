/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Clock, MapPin, UsersRound } from "lucide-react";
import { AnimatedCard } from "@/components/motion";
import { Avatar, Badge, Card } from "@/components/ui";
import { formatDate, formatTime } from "@/lib/utils";
import type { FriendAttendance } from "@/lib/types";

export function EventCard({
  event,
  friends = [],
}: {
  event: any;
  friends?: FriendAttendance[];
}) {
  const participantCount = event.participant_count ?? event.event_participants?.[0]?.count ?? 0;
  const capacityText = event.capacity
    ? `${participantCount}/${event.capacity}`
    : `${participantCount}`;
  const eventDate = new Date(`${event.event_date}T00:00:00`);
  const month = eventDate.toLocaleDateString("tr-TR", { month: "short" });
  const day = eventDate.getDate();
  const friendText = friends.length
    ? `${friends[0].first_name ?? "Bir arkadaşın"}${friends.length > 1 ? ` ve ${friends.length - 1} arkadaşın` : ""} katılıyor`
    : null;

  return (
    <AnimatedCard>
      <Card className="group h-full overflow-hidden p-0 hover:border-orange-200 hover:shadow-[0_24px_70px_rgba(240,90,40,0.13)]">
        {event.image_url ? (
          <img src={event.image_url} alt="" className="h-36 w-full object-cover" />
        ) : (
          <div className="h-3 bg-gradient-to-r from-orange-500 via-amber-300 to-emerald-300" />
        )}

        <div className="p-5">
          <div className="flex gap-4">
            <Link
              href={`/events/${event.id}`}
              className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15"
            >
              <span className="text-2xl font-black leading-none">{day}</span>
              <span className="mt-1 text-[11px] font-black uppercase">{month}</span>
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/events/${event.id}`}
                    className="block text-lg font-black leading-snug text-slate-950 transition group-hover:text-[var(--primary)]"
                  >
                    {event.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                    {event.description}
                  </p>
                </div>
                {event.lifecycle && event.lifecycle !== "scheduled" ? (
                  <Badge tone={event.lifecycle === "canceled" ? "red" : "amber"}>
                    {event.lifecycle === "canceled" ? "iptal" : "ertelendi"}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-2">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
              <Clock className="size-3.5 text-[var(--primary)]" />
              {formatDate(event.event_date)} {formatTime(event.start_time)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
              <MapPin className="size-3.5 text-blue-600" />
              {event.location}
            </span>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
              <UsersRound className="size-3.5 text-emerald-600" />
              {capacityText} katılımcı
            </span>
            {event.communities?.name ? (
              <span className="inline-flex items-center rounded-2xl bg-orange-50 px-3 py-2 text-[var(--primary)]">
                {event.communities.name}
              </span>
            ) : null}
          </div>

          {friendText ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-3 py-2 text-xs font-black text-blue-800">
              <div className="flex -space-x-2">
                {friends.slice(0, 3).map((friend) => (
                  <Avatar
                    key={friend.id}
                    firstName={friend.first_name}
                    lastName={friend.last_name}
                    size="sm"
                  />
                ))}
              </div>
              <span>{friendText}</span>
            </div>
          ) : null}
        </div>
      </Card>
    </AnimatedCard>
  );
}
