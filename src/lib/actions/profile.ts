"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { profileSchema } from "@/lib/validators/forms";
import { formFile, formString, notifyUser, redirectWithMessage, uploadImage } from "@/lib/actions/shared";
import { toInterests } from "@/lib/utils";

export async function updateProfileAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = profileSchema.safeParse({
    first_name: formString(formData, "first_name"),
    last_name: formString(formData, "last_name"),
    class_name: formString(formData, "class_name"),
    school_number: formString(formData, "school_number"),
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
  const update = avatarPath
    ? { ...parsed.data, avatar_path: avatarPath }
    : parsed.data;

  const { error } = await supabase.from("profiles").update(update).eq("id", profile.id);
  if (error) {
    redirectWithMessage(`/profile/${profile.id}`, `Profil güncellenemedi: ${error.message}`);
  }
  revalidatePath(`/profile/${profile.id}`);
  revalidatePath("/");
  redirect(`/profile/${profile.id}?message=Profil güncellendi.`);
}

export async function sendFriendRequestAction(formData: FormData) {
  const profile = await requireProfile();
  const receiverId = formString(formData, "receiver_id");

  if (!receiverId || receiverId === profile.id) {
    redirect(`/profile/${receiverId || profile.id}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("friendships").upsert(
    {
      requester_id: profile.id,
      receiver_id: receiverId,
      status: "pending",
    },
    { onConflict: "requester_id,receiver_id" },
  );

  if (error) {
    redirectWithMessage(`/profile/${receiverId}`, `Arkadaşlık isteği gönderilemedi: ${error.message}`);
  }

  await notifyUser({
    userId: receiverId,
    type: "friend_request",
    title: "Yeni arkadaşlık isteği",
    body: `${profile.first_name ?? "Bir öğrenci"} sana arkadaşlık isteği gönderdi.`,
    href: `/profile/${profile.id}`,
    digestKey: `friend-request:${profile.id}:${receiverId}`,
  });

  revalidatePath(`/profile/${receiverId}`);
  redirect(`/profile/${receiverId}`);
}

export async function cancelFriendRequestAction(formData: FormData) {
  const profile = await requireProfile();
  const friendshipId = formString(formData, "friendship_id");
  const targetId = formString(formData, "target_id");
  const supabase = await createClient();

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .eq("requester_id", profile.id)
    .eq("status", "pending");

  if (error) {
    redirectWithMessage(`/profile/${targetId}`, `İstek iptal edilemedi: ${error.message}`);
  }

  revalidatePath(`/profile/${targetId}`);
  redirect(`/profile/${targetId}`);
}

export async function respondFriendRequestAction(formData: FormData) {
  const profile = await requireProfile();
  const friendshipId = formString(formData, "friendship_id");
  const status = formString(formData, "status");

  if (!["accepted", "rejected", "blocked"].includes(status)) {
    redirect("/friends");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("friendships")
    .update({ status })
    .eq("id", friendshipId)
    .eq("receiver_id", profile.id);

  if (error) {
    redirectWithMessage("/friends", `İstek güncellenemedi: ${error.message}`);
  }

  revalidatePath("/friends");
  redirect("/friends");
}

export async function removeFriendAction(formData: FormData) {
  const profile = await requireProfile();
  const friendshipId = formString(formData, "friendship_id");
  const targetId = formString(formData, "target_id");
  const supabase = await createClient();

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`);

  if (error) {
    redirectWithMessage(targetId ? `/profile/${targetId}` : "/friends", `Arkadaşlık kaldırılamadı: ${error.message}`);
  }

  revalidatePath("/friends");
  revalidatePath(`/profile/${targetId}`);
  redirect(targetId ? `/profile/${targetId}` : "/friends");
}
