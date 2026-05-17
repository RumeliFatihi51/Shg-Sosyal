import Link from "next/link";
import { signInAction } from "@/lib/actions/auth";
import { Card, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="text-2xl font-black text-slate-950">Giriş yap</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Etkinliklere katılmak, gönderi paylaşmak ve arkadaşlarını görmek için hesabına gir.
        </p>
        {message ? (
          <div className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
            {message}
          </div>
        ) : null}
        <form action={signInAction} className="mt-6 grid gap-4">
          <Field label="E-posta" name="email" type="email" required />
          <Field label="Şifre" name="password" type="password" required />
          <SubmitButton className="w-full" pendingLabel="Giriş yapılıyor...">
            Giriş yap
          </SubmitButton>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Hesabın yok mu?{" "}
          <Link href="/register" className="font-bold text-slate-950 hover:underline">
            Kayıt ol
          </Link>
        </p>
      </Card>
    </div>
  );
}
