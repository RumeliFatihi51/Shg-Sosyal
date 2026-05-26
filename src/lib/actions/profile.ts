"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { profileSchema } from "@/lib/validators/forms";
import { formFile, formString, redirectWithMessage, uploadImage } from "@/lib/actions/shared";
import { toInterests } from "@/lib/utils";
import { normalizeUsernameInput } from "@/features/users/queries";
import { awardPoints } from "@/features/rewards/actions";

export async function updateProfileAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = profileSchema.safeParse({
    first_name: formString(formData, "first_name"),
    last_name: formString(formData, "last_name"),
    class_name: formString(formData, "class_name"),
    school_number: formString(formData, "school_number"),
    username: formString(formData, "username"),
    bio: formString(formData, "bio"),
    interests: toInterests(formData.get("interests")),
  });

  if (!parsed.success) {
    redirect(`/profile/${profile.id}?message=Profil bilgileri eksik.`);
  }

  let avatarPath: string | null = null;
  try {
    avatarPath = await uploadImage(
      "avatars",
      `avatars/${profile.id}`,
      formFile(formData, "avatar"),
    );
  } catch (error) {
    redirectWithMessage(
      `/profile/${profile.id}`,
      `Avatar yüklenemedi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
    );
  }
  const supabase = await createClient();
  const normalizedUsername = normalizeUsernameInput(parsed.data.username ?? "");
  if (parsed.data.username && (normalizedUsername.length < 3 || normalizedUsername.length > 24)) {
    redirectWithMessage(`/profile/${profile.id}`, "Kullanıcı etiketi 3-24 karakter olmalı.");
  }
  const profileData: Omit<typeof parsed.data, "username"> = {
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    class_name: parsed.data.class_name,
    school_number: parsed.data.school_number,
    interests: parsed.data.interests,
    bio: parsed.data.bio,
  };

  const update = {
    ...profileData,
    ...(parsed.data.username ? { username: normalizedUsername, tag: `@${normalizedUsername}` } : {}),
    ...(avatarPath ? { avatar_path: avatarPath } : {}),
  };

  const { error } = await supabase.from("profiles").update(update).eq("id", profile.id);
  if (error) {
    redirectWithMessage(`/profile/${profile.id}`, `Profil güncellenemedi: ${error.message}`);
  }
  await awardPoints({
    userId: profile.id,
    actionType: "profile_complete",
    targetType: "profile",
    targetId: profile.id,
    metadata: { source: "profile_complete" },
  });
  revalidatePath(`/profile/${profile.id}`);
  revalidatePath("/");
  redirect(`/profile/${profile.id}?message=Profil güncellendi.`);
}
