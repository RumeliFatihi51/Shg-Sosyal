/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, Clock, MapPin, UsersRound } from "lucide-react";
import { toggleEventParticipationAction } from "@/lib/actions/events";
import { reportContentAction } from "@/lib/actions/posts";
import { getEventDetail } from "@/lib/data";
import { Avatar, Badge, Card, EmptyState, LinkButton, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { formatDate, formatTime, fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const data = await getEventDetail(id);
  const participantCount =
    data.event.participant_count ?? data.event.event_participants?.[0]?.count ?? data.participants.length;
  const goingCount = data.participants.filter((row: any) => row.status !== "waitlisted").length;

  return (
    <div className="grid gap-7 xl:grid-cols-[1fr_340px]">
      <section className="space-y-6">
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[20/9] min-h-56 bg-slate-200">
            {data.event.image_url ? (
              <img
                src={data.event.image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-[#f05a28] to-amber-300 text-white">
                <CalendarDays className="size-16" />
              </div>
            )}
            <div className="absolute left-5 top-5 rounded-lg bg-white/95 px-4 py-3 text-center shadow-sm">
              <div className="text-2xl font-black text-slate-950">
                {new Date(`${data.event.event_date}T00:00:00`).getDate()}
              </div>
              <div className="text-xs font-black uppercase text-[#f05a28]">
                {new Date(`${data.event.event_date}T00:00:00`).toLocaleDateString("tr-TR", { month: "short" })}
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={data.event.status === "approved" ? "green" : "amber"}>
                {data.event.status === "approved" ? "yayında" : "onay bekliyor"}
              </Badge>
              {data.event.lifecycle && data.event.lifecycle !== "scheduled" ? (
                <Badge tone={data.event.lifecycle === "canceled" ? "red" : "amber"}>
                  {data.event.lifecycle === "canceled" ? "iptal edildi" : "ertelendi"}
                </Badge>
              ) : null}
              {data.event.communities?.slug ? (
                <Link
                  href={`/communities/${data.event.communities.slug}`}
                  className="text-sm font-bold text-[#f05a28] hover:underline"
                >
                  {data.event.communities.name}
                </Link>
              ) : null}
            </div>

            <div>
              <h1 className="text-3xl font-black text-slate-950">{data.event.title}</h1>
              <p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-700">
                {data.event.description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoBlock
                icon={<CalendarDays className="size-4" />}
                label="Tarih"
                value={formatDate(data.event.event_date)}
              />
              <InfoBlock
                icon={<Clock className="size-4" />}
                label="Saat"
                value={formatTime(data.event.start_time)}
              />
              <InfoBlock
                icon={<MapPin className="size-4" />}
                label="Konum"
                value={data.event.location}
              />
            </div>

            {data.event.cancellation_reason ? (
              <div className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">
                İptal sebebi: {data.event.cancellation_reason}
              </div>
            ) : null}
          </div>
        </Card>

        {query.message ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
            {query.message}
          </div>
        ) : null}

        {data.profile ? (
          <Card className="space-y-4 border-blue-100 bg-blue-50/50">
            <h2 className="text-xl font-black text-slate-950">
              {data.friendParticipants.length} arkadaşın bu etkinliğe katılıyor
            </h2>
            {data.friendParticipants.length ? (
              <div className="flex flex-wrap gap-3">
                {data.friendParticipants.map((friend) => (
                  <Link
                    key={friend.id}
                    href={`/profile/${friend.id}`}
                    className="flex items-center gap-2 rounded-md bg-white px-3 py-2 font-semibold text-blue-900"
                  >
                    <Avatar
                      firstName={friend.first_name}
                      lastName={friend.last_name}
                      size="sm"
                    />
                    {fullName(friend)}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                Kabul edilmiş arkadaşlarından katılım yapan olursa burada öne çıkar.
              </p>
            )}
          </Card>
        ) : null}

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">Katılımcılar</h2>
              <p className="text-sm text-slate-600">
                {data.event.capacity ? `${goingCount}/${data.event.capacity}` : participantCount} kişi listede.
              </p>
            </div>
            <div className="flex -space-x-2">
              {data.participants.slice(0, 6).map((row: any) => (
                <Avatar
                  key={row.user_id}
                  firstName={row.profiles?.first_name}
                  lastName={row.profiles?.last_name}
                  size="sm"
                />
              ))}
            </div>
          </div>
          {data.profile ? (
            data.participants.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {data.participants.map((row: any) => (
                  <Link
                    key={row.user_id}
                    href={`/profile/${row.user_id}`}
                    className="flex items-center gap-2 rounded-md border border-[var(--border-soft)] bg-white p-2 hover:bg-orange-50"
                  >
                    <Avatar
                      firstName={row.profiles?.first_name}
                      lastName={row.profiles?.last_name}
                      size="sm"
                    />
                    <span className="text-sm font-semibold">{fullName(row.profiles)}</span>
                    {row.status === "waitlisted" ? <Badge tone="amber">yedek</Badge> : null}
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="Henüz katılımcı yok" body="İlk katılan sen olabilirsin." />
            )
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Katılımcı listesini görmek için giriş yap.
            </p>
          )}
        </Card>
      </section>

      <aside className="space-y-4">
        <Card className="space-y-4">
          <h2 className="text-xl font-black text-slate-950">Katılım</h2>
          <div className="flex items-center gap-2 rounded-md bg-orange-50 p-3 text-sm font-bold text-orange-800">
            <UsersRound className="size-4" />
            {data.event.capacity ? `${goingCount}/${data.event.capacity}` : participantCount} katılımcı
          </div>
          {data.profile ? (
            <form action={toggleEventParticipationAction}>
              <input type="hidden" name="event_id" value={data.event.id} />
              <input type="hidden" name="is_joined" value={String(data.isJoined)} />
              <SubmitButton
                className="w-full"
                variant={data.isJoined ? "secondary" : "primary"}
                pendingLabel="Katılım güncelleniyor..."
              >
                {data.isJoined ? "Katılımı kaldır" : "Katılıyorum"}
              </SubmitButton>
            </form>
          ) : (
            <LinkButton href="/login" className="w-full">
              Giriş yap ve katıl
            </LinkButton>
          )}
        </Card>

        {data.profile ? (
          <Card className="space-y-4">
            <h2 className="text-xl font-black text-slate-950">Raporla</h2>
            <form action={reportContentAction} className="grid gap-3">
              <input type="hidden" name="target_type" value="event" />
              <input type="hidden" name="target_id" value={data.event.id} />
              <input type="hidden" name="return_to" value={`/events/${data.event.id}`} />
              <TextArea label="Sebep" name="reason" required rows={3} />
              <SubmitButton variant="secondary" pendingLabel="Rapor gönderiliyor...">
                Rapor gönder
              </SubmitButton>
            </form>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm font-black text-slate-950">{value}</div>
    </div>
  );
}
