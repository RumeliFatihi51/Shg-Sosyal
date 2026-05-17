import Link from "next/link";
import { signUpAction } from "@/lib/actions/auth";
import { Card, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <h1 className="text-2xl font-black text-slate-950">ŞHG Sosyal hesabı oluştur</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Açık kayıt aktiftir. Profil bilgileri okul içi görünürlük ve arkadaş sistemi için kullanılır.
        </p>
        {message ? (
          <div className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
            {message}
          </div>
        ) : null}
        <form action={signUpAction} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Ad" name="first_name" required />
          <Field label="Soyad" name="last_name" required />
          <Field label="Sınıf" name="class_name" placeholder="11-A" required />
          <Field label="Okul numarası" name="school_number" required />
          <div className="sm:col-span-2">
            <Field label="E-posta" name="email" type="email" required />
          </div>
          <div className="sm:col-span-2">
            <Field label="Şifre" name="password" type="password" required />
          </div>
          <SubmitButton className="sm:col-span-2" pendingLabel="Kayıt oluşturuluyor...">
            Kayıt ol
          </SubmitButton>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="font-bold text-slate-950 hover:underline">
            Giriş yap
          </Link>
        </p>
      </Card>
    </div>
  );
}
