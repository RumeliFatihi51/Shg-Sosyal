import { ArrowLeft, Sparkles, UsersRound } from "lucide-react";
import { createCommunityAction } from "@/lib/actions/communities";
import { getCurrentProfile } from "@/lib/session";
import { Card, Field, LinkButton, TextArea } from "@/components/ui";
import { FileUploadPreview } from "@/components/file-upload-preview";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function NewCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const [profile, query] = await Promise.all([getCurrentProfile(), searchParams]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="space-y-4 text-center">
          <UsersRound className="mx-auto size-10 text-[#f05a28]" />
          <h1 className="text-2xl font-black text-slate-950">Topluluk kurmak için giriş yap</h1>
          <p className="text-sm leading-6 text-slate-600">
            Başvurular kullanıcı hesabına bağlı tutulur ve admin onayından sonra yayına alınır.
          </p>
          <LinkButton href="/login">Giriş yap</LinkButton>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LinkButton href="/communities" variant="ghost">
          <ArrowLeft className="size-4" />
          Topluluklara dön
        </LinkButton>
        <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
          <Sparkles className="size-3.5" />
          Admin onayı gerekir
        </span>
      </div>

      {query.message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {query.message}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg bg-slate-950 p-6 text-white">
          <UsersRound className="size-10 text-orange-300" />
          <h1 className="mt-4 text-3xl font-black">Yeni topluluk başvurusu</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Kulüp, sınıf ekibi ya da ilgi grubu için net bir açıklama yaz. Onaylanınca kurucu
            üye olarak topluluk yöneticisi yetkin aktif olur.
          </p>
          <div className="mt-5 grid gap-3 text-sm">
            <div className="rounded-md bg-white/10 p-3">1. Başvuruyu gönder</div>
            <div className="rounded-md bg-white/10 p-3">2. Admin/moderatör incelesin</div>
            <div className="rounded-md bg-white/10 p-3">3. Topluluk sayfası yayına çıksın</div>
          </div>
        </div>

        <Card className="space-y-5">
          <div>
            <h2 className="text-xl font-black text-slate-950">Başvuru formu</h2>
            <p className="mt-1 text-sm text-slate-600">
              Kısa, anlaşılır ve okul içi kullanıma uygun bilgiler yaz.
            </p>
          </div>
          <form action={createCommunityAction} className="grid gap-4">
            <input type="hidden" name="return_to" value="/communities/new" />
            <Field label="Topluluk adı" name="name" required />
            <TextArea label="Açıklama" name="description" required rows={7} />
            <FileUploadPreview name="image" label="Topluluk görseli" />
            <SubmitButton pendingLabel="Başvuru gönderiliyor...">
              Başvuruyu gönder
            </SubmitButton>
          </form>
        </Card>
      </section>
    </div>
  );
}
