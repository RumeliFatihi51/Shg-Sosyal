"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseAdminConfig } from "@/lib/env";
import { requireProfile } from "@/lib/session";
import { formString, redirectWithMessage } from "@/lib/actions/shared";
import { normalizeUsernameInput } from "@/features/users/queries";

export async function updateUsernameAction(formData: FormData) {
  const profile = await requireProfile();
  const returnTo = formString(formData, "return_to") || `/profile/${profile.id}`;
  const username = normalizeUsernameInput(formString(formData, "username"));

  if (username.length < 3 || username.length > 24) {
    redirectWithMessage(returnTo, "Kullanıcı etiketi 3-24 karakter olmalı.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ username, tag: `@${username}` })
    .eq("id", profile.id);

  if (error) {
    redirectWithMessage(returnTo, `Etiket güncellenemedi: ${error.message}`);
  }

  revalidatePath(`/profile/${profile.id}`);
  revalidatePath("/friends");
  redirectWithMessage(returnTo, "Etiket güncellendi.");
}

export async function updateLastSeen() {
  const profile = await requireProfile();

  if (!hasSupabaseAdminConfig()) {
    return;
  }

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", profile.id);
}
