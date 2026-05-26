/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, Clock, MapPin, Share2, UsersRound } from "lucide-react";
import { toggleEventParticipationAction } from "@/lib/actions/events";
import { reportContentAction } from "@/lib/actions/posts";
import { getEventDetail } from "@/lib/data";
import { Avatar, LinkButton, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import {
  DateBlock,
  InlineEmpty,
  RailItem,
  RailSection,
  SocialBadge,
  SocialPage,
  StickyPageHeader,
  TimelineRow,
  TimelineSurface,
} from "@/components/social-ui";
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
  const goingCount = data.participants.filter((row: any) => row.status === "going").length;
  const interestedCount = data.participants.filter((row: any) => row.status === "interested").length;
  const myStatus = data.profile
    ? data.participants.find((row: any) => row.user_id === data.profile?.id)?.status
    : null;

  return (
    <SocialPage
      rail={
        <EventRail
          event={data.event}
          participantCount={participantCount}
          goingCount={goingCount}
          interestedCount={interestedCount}
          similarEvents={data.similarEvents}
        />
      }
    >
      <StickyPageHeader
        title={data.event.title}
        subtitle={`${formatDate(data.event.event_date)} · ${formatTime(data.event.start_time)} · ${data.event.location}`}
      />

      {query.message ? (
        <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {query.message}
        </div>
      ) : null}

      <TimelineSurface>
        <section className="px-4 py-5">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
            {data.event.image_url ? (
              <img src={data.event.image_url} alt="" className="h-56 w-full object-cover" />
            ) : (
              <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-slate-950 via-cyan-950 to-cyan-500 text-white">
                <CalendarDays className="size-16" />
              </div>
            )}
            <div className="space-y-4 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <DateBlock date={data.event.event_date} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <SocialBadge tone={data.event.status === "approved" ? "green" : "amber"}>
                      {data.event.status === "approved" ? "Yayında" : "Onay bekliyor"}
                    </SocialBadge>
                    {data.event.lifecycle && data.event.lifecycle !== "scheduled" ? (
                      <SocialBadge tone={data.event.lifecycle === "canceled" ? "red" : "amber"}>
                        {data.event.lifecycle === "canceled" ? "İptal" : "Ertelendi"}
                      </SocialBadge>
                    ) : null}
                  </div>
                  {data.event.communities?.slug ? (
                    <Link href={`/communities/${data.event.communities.slug}`} className="mt-2 block text-sm font-black text-cyan-600">
                      {data.event.communities.name}
                    </Link>
                  ) : null}
                </div>
              </div>

              <p className="whitespace-pre-line text-base leading-8 text-slate-700">
                {data.event.description}
              </p>

              <div className="grid gap-2 sm:grid-cols-3">
                <InfoPill icon={<CalendarDays className="size-4" />} label="Tarih" value={formatDate(data.event.event_date)} />
                <InfoPill icon={<Clock className="size-4" />} label="Saat" value={formatTime(data.event.start_time)} />
                <InfoPill icon={<MapPin className="size-4" />} label="Konum" value={data.event.location} />
              </div>

              {data.event.cancellation_reason ? (
                <div className="rounded-2xl bg-red-500/10 p-3 text-sm font-semibold text-red-600">
                  İptal sebebi: {data.event.cancellation_reason}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="px-4 py-4">
          <h2 className="text-lg font-black text-slate-950">Katılım</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <StatPill label="Katılan" value={data.event.capacity ? `${goingCount}/${data.event.capacity}` : String(goingCount)} />
            <StatPill label="İlgilenen" value={String(interestedCount)} />
            <StatPill label="Toplam" value={String(participantCount)} />
          </div>

          {data.profile ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusForm eventId={data.event.id} status="going" label={myStatus === "going" ? "Katılıyorsun" : "Katıl"} active={myStatus === "going"} />
              <StatusForm eventId={data.event.id} status="interested" label={myStatus === "interested" ? "İlgileniyorsun" : "İlgileniyorum"} active={myStatus === "interested"} />
              <StatusForm eventId={data.event.id} status="not_going" label="Katılmayacağım" active={myStatus === "not_going"} />
            </div>
          ) : (
            <LinkButton href="/login" className="mt-4">Giriş yap ve katıl</LinkButton>
          )}
        </section>

        {data.profile ? (
          <section className="px-4 py-4">
            <h2 className="text-lg font-black text-slate-950">
              {data.friendParticipants.length ? `${data.friendParticipants.length} arkadaşın katılıyor` : "Arkadaşların"}
            </h2>
            {data.friendParticipants.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {data.friendParticipants.map((friend) => (
                  <Link key={friend.id} href={`/profile/${friend.id}`} className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-3 py-2 text-sm font-black text-cyan-600">
                    <Avatar firstName={friend.first_name} lastName={friend.last_name} size="sm" />
                    {fullName(friend)}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Arkadaşlarından katılan olursa burada görürsün.</p>
            )}
          </section>
        ) : null}

        <section className="px-4 py-4">
          <h2 className="text-lg font-black text-slate-950">Katılımcılar</h2>
          {data.profile ? (
            data.participants.length ? (
              <div className="mt-3 grid gap-2">
                {data.participants.slice(0, 24).map((row: any) => (
                  <TimelineRow
                    key={row.user_id}
                    compact
                    avatar={<Avatar firstName={row.profiles?.first_name} lastName={row.profiles?.last_name} size="sm" />}
                    title={fullName(row.profiles)}
                    meta={row.status === "waitlisted" ? "Yedek" : row.status === "interested" ? "İlgileniyor" : row.status === "not_going" ? "Katılmayacak" : "Katılıyor"}
                    href={`/profile/${row.user_id}`}
                  />
                ))}
              </div>
            ) : (
              <InlineEmpty title="Henüz katılımcı yok" body="İlk katılan sen olabilirsin." />
            )
          ) : (
            <p className="mt-2 text-sm text-slate-500">Katılımcı listesini görmek için giriş yap.</p>
          )}
        </section>

        {data.profile ? (
          <section className="px-4 py-4">
            <h2 className="text-lg font-black text-slate-950">Raporla</h2>
            <form action={reportContentAction} className="mt-3 grid gap-3">
              <input type="hidden" name="target_type" value="event" />
              <input type="hidden" name="target_id" value={data.event.id} />
              <input type="hidden" name="return_to" value={`/events/${data.event.id}`} />
              <TextArea label="Sebep" name="reason" required rows={3} />
              <SubmitButton variant="secondary" pendingLabel="Gönderiliyor...">
                Rapor gönder
              </SubmitButton>
            </form>
          </section>
        ) : null}
      </TimelineSurface>
    </SocialPage>
  );
}

function StatusForm({
  eventId,
  status,
  label,
  active,
}: {
  eventId: string;
  status: "going" | "interested" | "not_going";
  label: string;
  active?: boolean;
}) {
  return (
    <form action={toggleEventParticipationAction}>
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="is_joined" value="false" />
      <input type="hidden" name="participation_status" value={status} />
      <SubmitButton variant={active ? "primary" : "secondary"} pendingLabel="Kaydediliyor...">
        {label}
      </SubmitButton>
    </form>
  );
}

function EventRail({
  event,
  participantCount,
  goingCount,
  interestedCount,
  similarEvents,
}: {
  event: any;
  participantCount: number;
  goingCount: number;
  interestedCount: number;
  similarEvents: any[];
}) {
  return (
    <>
      <RailSection title="Etkinlik">
        <RailItem title={formatDate(event.event_date)} meta={formatTime(event.start_time)} icon={CalendarDays} />
        <RailItem title={event.location} meta="Konum" icon={MapPin} />
        <RailItem title={`${goingCount} katılan`} meta={`${interestedCount} ilgileniyor · ${participantCount} toplam`} icon={UsersRound} />
        <RailItem title="Paylaş" meta="Bağlantıyı kopyala" icon={Share2} />
      </RailSection>
      <RailSection title="Benzer etkinlikler" actionHref="/events">
        {similarEvents.length ? similarEvents.map((item) => (
          <RailItem
            key={item.id}
            title={item.title}
            meta={`${formatDate(item.event_date)} · ${formatTime(item.start_time)}`}
            href={`/events/${item.id}`}
            icon={Clock}
          />
        )) : <RailItem title="Yakında etkinlik yok." meta="Etkinlik öner." href="/events/new" icon={CalendarDays} />}
      </RailSection>
    </>
  );
}

function InfoPill({ icon, label, value }: { icon: ReactNode; label: string; value: string | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm font-black text-slate-950">{value}</div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <div className="text-xs font-black uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-950">{value}</div>
    </div>
  );
}
