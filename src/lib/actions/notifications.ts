"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formString, redirectWithMessage } from "@/lib/actions/shared";
import { requireProfile } from "@/lib/session";

export async function markNotificationReadAction(formData: FormData) {
  const profile = await requireProfile();
  const id = formString(formData, "notification_id");
  const href = formString(formData, "href") || "/notifications";
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", profile.id);

  if (error) {
    redirectWithMessage("/notifications", `Bildirim güncellenemedi: ${error.message}`);
  }

  revalidatePath("/notifications");
  redirect(href);
}

export async function markAllNotificationsReadAction() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("read_at", null);

  if (error) {
    redirectWithMessage("/notifications", `Bildirimler güncellenemedi: ${error.message}`);
  }

  revalidatePath("/notifications");
  redirect("/notifications");
}
