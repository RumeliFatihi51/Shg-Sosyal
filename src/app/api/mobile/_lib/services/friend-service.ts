import { sendMobilePushToUser } from "@/features/push/mobile-fcm";
import { fullName, type SupabaseClientLike } from "../shared";

export function sanitizeFriendSearchQuery(value: string | null) {
  return (value ?? "").replace("@", "").replace(/[%,()]/g, "").trim();
}

export function otherFriendUserId(friendship: Record<string, unknown>, currentUserId: string) {
  return String(friendship.requester_id) === currentUserId
    ? String(friendship.receiver_id)
    : String(friendship.requester_id);
}

export async function notifyFriendRequest(
  admin: SupabaseClientLike,
  actorProfile: Record<string, unknown>,
  actorId: string,
  receiverId: string,
) {
  const title = "Yeni arkadaşlık isteği";
  const body = `${fullName(actorProfile)} sana arkadaşlık isteği gönderdi.`;

  await admin.from("notifications").insert({
    user_id: receiverId,
    actor_id: actorId,
    type: "friend_request",
    title,
    body,
    href: "/friends",
  });

  await sendMobilePushToUser(receiverId, {
    title,
    body,
    url: "/friends",
    type: "friend_request",
    tag: `friend-request-${actorId}`,
  });
}

export async function notifyFriendAccepted(
  admin: SupabaseClientLike,
  actorProfile: Record<string, unknown>,
  actorId: string,
  receiverId: string,
) {
  const title = "Arkadaşlık isteğin kabul edildi";
  const body = `${fullName(actorProfile)} artık arkadaşın.`;

  await admin.from("notifications").insert({
    user_id: receiverId,
    actor_id: actorId,
    type: "friend_accept",
    title,
    body,
    href: "/friends",
  });

  await sendMobilePushToUser(receiverId, {
    title,
    body,
    url: "/friends",
    type: "friend_accept",
    tag: `friend-accept-${actorId}`,
  });
}
