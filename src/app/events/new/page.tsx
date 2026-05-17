import Link from "next/link";
import { ArrowLeft, CalendarPlus, ShieldCheck } from "lucide-react";
import { createEventAction } from "@/lib/actions/events";
import { getEventFormData } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";
import { Card, Field, LinkButton, TextArea } from "@/components/ui";
import { FileUploadPreview } from "@/components/file-upload-preview";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ community_id?: string; message?: string }>;
}) {
  const query = await searchParams;
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="space-y-4 text-center">
          <CalendarPlus className="mx-auto size-10 text-[#f05a28]" />
          <h1 className="text-2xl font-black text-slate-950">Etkinlik oluşturmak için giriş yap</h1>
          <p className="text-sm leading-6 text-slate-600">
            Etkinlik talepleri kullanıcı hesabına bağlı tutulur.
          </p>
          <LinkButton href="/login">Giriş yap</LinkButton>
        </Card>
      </div>
    );
  }

  const data = await getEventFormData();
  const autoPublish = ["admin", "moderator", "teacher"].includes(data.profile.role);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="size-4" />
        Etkinliklere dön
      </Link>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg bg-slate-950 p-6 text-white">
          <CalendarPlus className="size-10 text-orange-300" />
          <h1 className="mt-4 text-3xl font-black">Yeni etkinlik talebi</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Tarih, saat, konum ve kontenjanı net gir. Öğretmen, moderator ve admin
            etkinlikleri doğrudan yayına alınır; diğer talepler onay kuyruğuna düşer.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-bold">
            <ShieldCheck className="size-4" />
            {autoPublish ? "Bu hesap doğrudan yayınlayabilir" : "Bu talep onay bekleyecek"}
          </div>
        </div>

        <Card className="space-y-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#f05a28]">
              <CalendarPlus className="size-4" />
              Etkinlik oluştur
            </div>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Etkinlik bilgileri</h2>
          </div>

          {query.message ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              {query.message}
            </div>
          ) : null}

          <form action={createEventAction} className="grid gap-4">
            <input type="hidden" name="return_to" value="/events/new" />
            <Field label="Başlık" name="title" required />
            <TextArea label="Açıklama" name="description" required rows={5} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tarih" name="event_date" type="date" required />
              <Field label="Saat" name="start_time" type="time" required />
            </div>
            <Field label="Konum" name="location" required placeholder="Salon, bahçe, laboratuvar..." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kontenjan" name="capacity" type="number" placeholder="Boş bırakılabilir" />
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Topluluk
                <select
                  name="community_id"
                  defaultValue={query.community_id ?? ""}
                  className="h-11 rounded-md border border-[var(--border-soft)] bg-white px-3 outline-none transition focus:border-[#f05a28]"
                >
                  <option value="">Genel okul etkinliği</option>
                  {data.communities.map((community: any) => (
                    <option key={community.id} value={community.id}>
                      {community.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <FileUploadPreview name="image" label="Afiş" />
            <SubmitButton pendingLabel="Etkinlik gönderiliyor...">
              Etkinlik talebi gönder
            </SubmitButton>
          </form>
        </Card>
      </section>
    </div>
  );
}
