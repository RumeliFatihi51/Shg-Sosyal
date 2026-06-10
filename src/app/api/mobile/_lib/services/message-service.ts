import { sendMobilePushToUser } from "@/features/push/mobile-fcm";
import { fullName, type SupabaseClientLike } from "../shared";

export function validateMessageContent(value: unknown) {
  const content = String(value ?? "").trim();

  if (!content) throw new Error("Boş mesaj gönderilemez.");
  if (content.length > 2000) throw new Error("Mesaj 2000 karakterden uzun olamaz.");

  return content;
}

export async function notifyDirectMessage(
  admin: SupabaseClientLike,
  conversationId: string,
  senderId: string,
  senderProfile: Record<string, unknown>,
  content: string,
) {
  const { data: members } = await admin
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", senderId);

  const notificationRows = ((members ?? []) as { user_id: string }[]).map((member) => ({
    user_id: member.user_id,
    actor_id: senderId,
    type: "dm_message",
    title: fullName(senderProfile) || "Yeni mesaj",
    body: content.length > 90 ? `${content.slice(0, 87)}...` : content,
    target_type: "conversation",
    target_id: conversationId,
    href: `/messages/${conversationId}`,
  }));

  if (notificationRows.length) {
    await admin.from("notifications").insert(notificationRows);
    await Promise.all(
      notificationRows.map((notification) =>
        sendMobilePushToUser(notification.user_id, {
          title: notification.title,
          body: notification.body,
          url: notification.href,
          type: "dm_message",
          tag: `dm-${conversationId}`,
          conversationId,
        }),
      ),
    );
  }
}
