import type { PublicUser } from "@/features/users/types";

export type FriendshipStatus = "pending" | "accepted" | "rejected" | "blocked";

export type FriendshipRow = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  requester?: PublicUser | null;
  receiver?: PublicUser | null;
};

export type FriendsData = {
  profile: PublicUser;
  received: FriendshipRow[];
  sent: FriendshipRow[];
  accepted: FriendshipRow[];
  blocked: FriendshipRow[];
};
