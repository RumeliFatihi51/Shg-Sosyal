import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import type { FriendsData, FriendshipRow } from "@/features/friends/types";
import type { PublicUser } from "@/features/users/types";

const friendProfileSelect =
  "id,first_name,last_name,class_name,avatar_path,username,tag,bio";

export async function getFriendsData(): Promise<FriendsData> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [received, sent, accepted, blocked] = await Promise.all([
    supabase
      .from("friendships")
      .select(
        `id,requester_id,receiver_id,status,created_at,updated_at,requester:profiles!friendships_requester_id_fkey(${friendProfileSelect})`,
      )
      .eq("receiver_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("friendships")
      .select(
        `id,requester_id,receiver_id,status,created_at,updated_at,receiver:profiles!friendships_receiver_id_fkey(${friendProfileSelect})`,
      )
      .eq("requester_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("friendships")
      .select(
        `id,requester_id,receiver_id,status,created_at,updated_at,requester:profiles!friendships_requester_id_fkey(${friendProfileSelect}),receiver:profiles!friendships_receiver_id_fkey(${friendProfileSelect})`,
      )
      .eq("status", "accepted")
      .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .order("updated_at", { ascending: false }),
    supabase
      .from("friendships")
      .select(
        `id,requester_id,receiver_id,status,created_at,updated_at,requester:profiles!friendships_requester_id_fkey(${friendProfileSelect}),receiver:profiles!friendships_receiver_id_fkey(${friendProfileSelect})`,
      )
      .eq("status", "blocked")
      .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .order("updated_at", { ascending: false }),
  ]);

  return {
    profile: profile as PublicUser,
    received: (received.data ?? []) as unknown as FriendshipRow[],
    sent: (sent.data ?? []) as unknown as FriendshipRow[],
    accepted: (accepted.data ?? []) as unknown as FriendshipRow[],
    blocked: (blocked.data ?? []) as unknown as FriendshipRow[],
  };
}

export async function getAcceptedFriendIds(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("friendships")
    .select("requester_id,receiver_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

  return (data ?? []).map((friendship: { requester_id: string; receiver_id: string }) =>
    friendship.requester_id === userId ? friendship.receiver_id : friendship.requester_id,
  );
}
