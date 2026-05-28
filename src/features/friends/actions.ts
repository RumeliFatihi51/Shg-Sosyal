"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseAdminConfig } from "@/lib/env";
import { requireProfile } from "@/lib/session";
import { formString, notifyUser, redirectWithMessage } from "@/lib/actions/shared";
import { fullName } from "@/lib/utils";
import { awardPoints } from "@/features/rewards/actions";

function friendReturnPath(formData: FormData, fallback = "/friends") {
  const value = formString(formData, "return_to");
  return value.startsWith("/") ? value : fallback;
}

async function findExistingFriendship(leftId: string, rightId: string) {
  if (!hasSupabaseAdminConfig()) {
    return null;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("friendships")
    .select("id,status,requester_id,receiver_id")
    .or(
      `and(requester_id.eq.${leftId},receiver_id.eq.${rightId}),and(requester_id.eq.${rightId},receiver_id.eq.${leftId})`,
    )
    .maybeSingle();

  return data;
}

export async function sendFriendRequestAction(formData: FormData) {
  const profile = await requireProfile();
  const receiverId = formString(formData, "receiver_id");
  const returnTo = friendReturnPath(formData, receiverId ? `/profile/${receiverId}` : "/friends");

  if (!receiverId || receiverId === profile.id) {
    redirectWithMessage(returnTo, "Kendine arkadaşlık isteği gönderemezsin.");
  }

  const existing = await findExistingFriendship(profile.id, receiverId);
  if (existing?.status === "accepted") {
    redirectWithMessage(returnTo, "Zaten arkadaşsınız.");
  }
  if (existing?.status === "pending") {
    redirectWithMessage(returnTo, "Bu kullanıcıyla bekleyen bir istek var.");
  }
  if (existing?.status === "blocked") {
    redirectWithMessage(returnTo, "Bu kullanıcıya istek gönderilemez.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("friendships").insert({
    requester_id: profile.id,
    receiver_id: receiverId,
    status: "pending",
  });

  if (error) {
    redirectWithMessage(returnTo, `Arkadaşlık isteği gönderilemedi: ${error.message}`);
  }

  await notifyUser({
    userId: receiverId,
    type: "friend_request",
    title: "Yeni arkadaşlık isteği",
    body: `${fullName(profile)} sana arkadaşlık isteği gönderdi.`,
    href: `/profile/${profile.id}`,
    digestKey: `friend-request:${profile.id}:${receiverId}`,
    actorId: profile.id,
    targetType: "profile",
    targetId: profile.id,
  });

  revalidatePath("/friends");
  revalidatePath(`/profile/${receiverId}`);
  redirectWithMessage(returnTo, "Arkadaşlık isteği gönderildi.");
}

export async function acceptFriendRequestAction(formData: FormData) {
  await respondFriendRequest(formData, "accepted");
}

export async function rejectFriendRequestAction(formData: FormData) {
  await respondFriendRequest(formData, "rejected");
}

export async function respondFriendRequestAction(formData: FormData) {
  const status = formString(formData, "status");
  if (status === "accepted" || status === "rejected" || status === "blocked") {
    await respondFriendRequest(formData, status);
  }

  redirectWithMessage(friendReturnPath(formData), "Geçersiz arkadaşlık işlemi.");
}

async function respondFriendRequest(
  formData: FormData,
  status: "accepted" | "rejected" | "blocked",
) {
  const profile = await requireProfile();
  const friendshipId = formString(formData, "friendship_id");
  const requesterId = formString(formData, "requester_id");
  const returnTo = friendReturnPath(formData);
  const supabase = await createClient();

  const { error } = await supabase
    .from("friendships")
    .update({ status })
    .eq("id", friendshipId)
    .eq("receiver_id", profile.id)
    .eq("status", "pending");

  if (error) {
    redirectWithMessage(returnTo, `İstek güncellenemedi: ${error.message}`);
  }

  if (status === "accepted" && requesterId) {
    await Promise.all([
      notifyUser({
        userId: requesterId,
        type: "friend_accept",
        title: "Arkadaşlık isteğin kabul edildi",
        body: `${fullName(profile)} arkadaşlık isteğini kabul etti.`,
        href: `/profile/${profile.id}`,
        digestKey: `friend-accept:${friendshipId}`,
        actorId: profile.id,
        targetType: "profile",
        targetId: profile.id,
      }),
      awardPoints({
        userId: profile.id,
        actionType: "friend_accept",
        targetType: "profile",
        targetId: requesterId,
      }),
      awardPoints({
        userId: requesterId,
        actionType: "friend_accept",
        targetType: "profile",
        targetId: profile.id,
      }),
    ]);
  }

  revalidatePath("/friends");
  if (requesterId) {
    revalidatePath(`/profile/${requesterId}`);
  }
  redirectWithMessage(returnTo, status === "accepted" ? "Arkadaşlık isteği kabul edildi." : "İstek güncellendi.");
}

export async function cancelFriendRequestAction(formData: FormData) {
  const profile = await requireProfile();
  const friendshipId = formString(formData, "friendship_id");
  const targetId = formString(formData, "target_id");
  const returnTo = friendReturnPath(formData, targetId ? `/profile/${targetId}` : "/friends");
  const supabase = await createClient();

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .eq("requester_id", profile.id)
    .eq("status", "pending");

  if (error) {
    redirectWithMessage(returnTo, `İstek iptal edilemedi: ${error.message}`);
  }

  revalidatePath("/friends");
  if (targetId) {
    revalidatePath(`/profile/${targetId}`);
  }
  redirectWithMessage(returnTo, "İstek iptal edildi.");
}

export async function removeFriendAction(formData: FormData) {
  const profile = await requireProfile();
  const friendshipId = formString(formData, "friendship_id");
  const targetId = formString(formData, "target_id");
  const returnTo = friendReturnPath(formData, targetId ? `/profile/${targetId}` : "/friends");
  const supabase = await createClient();

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .eq("status", "accepted")
    .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`);

  if (error) {
    redirectWithMessage(returnTo, `Arkadaşlıktan çıkarılamadı: ${error.message}`);
  }

  revalidatePath("/friends");
  if (targetId) {
    revalidatePath(`/profile/${targetId}`);
  }
  redirectWithMessage(returnTo, "Arkadaşlıktan çıkarıldı.");
}

export async function blockUserAction(formData: FormData) {
  const profile = await requireProfile();
  const targetId = formString(formData, "target_id");
  const returnTo = friendReturnPath(formData, "/friends");

  if (!targetId || targetId === profile.id) {
    redirectWithMessage(returnTo, "Bu kullanıcı engellenemez.");
  }

  if (!hasSupabaseAdminConfig()) {
    redirectWithMessage(returnTo, "Engelleme için server anahtarı eksik.");
  }

  const admin = createAdminClient();
  const existing = await findExistingFriendship(profile.id, targetId);
  const payload = {
    requester_id: profile.id,
    receiver_id: targetId,
    status: "blocked",
  };

  const { error } = existing
    ? await admin.from("friendships").update({ status: "blocked" }).eq("id", existing.id)
    : await admin.from("friendships").insert(payload);

  if (error) {
    redirectWithMessage(returnTo, `Kullanıcı engellenemedi: ${error.message}`);
  }

  revalidatePath("/friends");
  revalidatePath(`/profile/${targetId}`);
  redirectWithMessage(returnTo, "Kullanıcı engellendi.");
}
