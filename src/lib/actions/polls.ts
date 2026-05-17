"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formString, redirectWithMessage } from "@/lib/actions/shared";
import { requireProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export async function votePollAction(formData: FormData) {
  const profile = await requireProfile();
  const pollId = formString(formData, "poll_id");
  const optionId = formString(formData, "option_id");
  const supabase = await createClient();

  const { error } = await supabase.from("poll_votes").upsert(
    {
      poll_id: pollId,
      option_id: optionId,
      user_id: profile.id,
    },
    { onConflict: "poll_id,user_id" },
  );

  if (error) {
    redirectWithMessage("/polls", `Oy kaydedilemedi: ${error.message}`);
  }

  revalidatePath("/polls");
  revalidatePath("/");
  redirect("/polls?message=Oyun kaydedildi.");
}
