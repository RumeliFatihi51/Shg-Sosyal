"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { formString, notifyUser, redirectWithMessage } from "@/lib/actions/shared";
import { fullName } from "@/lib/utils";

export async function startDirectConversationAction(formData: FormData) {
  const profile = await requireProfile();
  const otherUserId = formString(formData, "user_id");
  const returnTo = formString(formData, "return_to") || "/messages";

  if (!otherUserId || otherUserId === profile.id) {
    redirectWithMessage(returnTo, "Bu kullanıcıyla mesajlaşma başlatılamaz.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_direct_conversation", {
    p_other_user: otherUserId,
  });

  if (error || !data) {
    redirectWithMessage(returnTo, `Mesajlaşma başlatılamadı: ${error?.message ?? "Bilinmeyen hata"}`);
  }

  redirect(`/messages/${data}`);
}

export async function sendMessageAction(formData: FormData) {
  const profile = await requireProfile();
  const conversationId = formString(formData, "conversation_id");
  const content = formString(formData, "content");

  if (!conversationId || !content || content.length > 2000) {
    redirectWithMessage(`/messages/${conversationId || ""}`, "Mesaj 1-2000 karakter olmalı.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: profile.id,
    content,
  });

  if (error) {
    redirectWithMessage(`/messages/${conversationId}`, `Mesaj gönderilemedi: ${error.message}`);
  }

  const { data: recipients } = await supabase
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", profile.id);

  await Promise.all(
    (recipients ?? []).map((recipient: { user_id: string }) =>
      notifyUser({
        userId: recipient.user_id,
        type: "dm_message",
        title: "Yeni mesaj",
        body: `${fullName(profile)} sana mesaj gönderdi.`,
        href: `/messages/${conversationId}`,
        digestKey: `dm:${conversationId}:${recipient.user_id}`,
      }),
    ),
  );

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  redirect(`/messages/${conversationId}`);
}

export async function markConversationReadAction(formData: FormData) {
  const profile = await requireProfile();
  const conversationId = formString(formData, "conversation_id");
  const supabase = await createClient();

  if (!conversationId) {
    return;
  }

  await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", profile.id);

  revalidatePath("/messages");
}

export async function editMessageAction(formData: FormData) {
  const profile = await requireProfile();
  const messageId = formString(formData, "message_id");
  const conversationId = formString(formData, "conversation_id");
  const content = formString(formData, "content");

  if (!messageId || !conversationId || !content || content.length > 2000) {
    redirectWithMessage(`/messages/${conversationId || ""}`, "Mesaj 1-2000 karakter olmalı.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("messages")
    .update({
      content,
      edited_at: new Date().toISOString(),
      status: "edited",
    })
    .eq("id", messageId)
    .eq("sender_id", profile.id)
    .is("deleted_at", null);

  if (error) {
    redirectWithMessage(`/messages/${conversationId}`, `Mesaj düzenlenemedi: ${error.message}`);
  }

  revalidatePath(`/messages/${conversationId}`);
  redirect(`/messages/${conversationId}`);
}

export async function deleteMessageAction(formData: FormData) {
  const profile = await requireProfile();
  const messageId = formString(formData, "message_id");
  const conversationId = formString(formData, "conversation_id");
  const supabase = await createClient();

  const { error } = await supabase
    .from("messages")
    .update({
      content: null,
      deleted_at: new Date().toISOString(),
      status: "deleted",
    })
    .eq("id", messageId)
    .eq("sender_id", profile.id);

  if (error) {
    redirectWithMessage(`/messages/${conversationId}`, `Mesaj silinemedi: ${error.message}`);
  }

  revalidatePath(`/messages/${conversationId}`);
  redirect(`/messages/${conversationId}`);
}
