"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseAdminConfig } from "@/lib/env";
import { signInSchema, signUpSchema } from "@/lib/validators/forms";
import { formString } from "@/lib/actions/shared";

function authRedirect(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

export async function signInAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    authRedirect("/login", parsed.error.issues[0]?.message ?? "Giriş bilgileri eksik.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.message.toLocaleLowerCase("tr").includes("email not confirmed")) {
      authRedirect("/login", "Devam etmek için e-posta adresini doğrulamalısın.");
    }

    authRedirect("/login", "E-posta veya şifre hatalı.");
  }

  redirect("/");
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    first_name: formString(formData, "first_name"),
    last_name: formString(formData, "last_name"),
    class_name: formString(formData, "class_name"),
    school_number: formString(formData, "school_number"),
  });

  if (!parsed.success) {
    authRedirect(
      "/register",
      parsed.error.issues[0]?.message ?? "Kayıt bilgileri eksik.",
    );
  }

  const supabase = await createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: {
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        class_name: parsed.data.class_name,
        school_number: parsed.data.school_number,
      },
    },
  });

  if (error) {
    authRedirect("/register", error.message);
  }

  if (data.user && hasSupabaseAdminConfig()) {
    const admin = createAdminClient();
    const isBootstrapAdmin =
      process.env.ADMIN_EMAIL?.toLocaleLowerCase("tr") ===
      parsed.data.email.toLocaleLowerCase("tr");

    await admin.from("profiles").upsert(
      {
        id: data.user.id,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        class_name: parsed.data.class_name,
        school_number: parsed.data.school_number,
        interests: [],
        role: isBootstrapAdmin ? "admin" : "student",
      },
      { onConflict: "id" },
    );
  }

  if (data.session) {
    redirect("/");
  }

  authRedirect("/login", "Kayıt alındı. Devam etmek için e-posta doğrulama bağlantısını aç.");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
