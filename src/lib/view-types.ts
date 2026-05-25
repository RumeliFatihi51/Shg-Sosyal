import type { Community, Event, Post, Profile } from "@/lib/types";

export type CountRelation = { count: number }[];

export type ProfileLite = Pick<
  Profile,
  "id" | "first_name" | "last_name" | "avatar_path" | "username" | "tag"
>;

export type CommunityLite = Pick<Community, "id" | "name" | "slug"> & {
  description?: string;
  community_members?: CountRelation;
  community_followers?: CountRelation;
  posts?: CountRelation;
  events?: CountRelation;
  member_count?: number;
  follower_count?: number;
  post_count?: number;
  event_count?: number;
  trend_score?: number;
};

export type EventListItem = Event & {
  communities?: CommunityLite | null;
  event_participants?: CountRelation;
  participant_count?: number;
  waitlist_count?: number;
  trend_score?: number;
};

export type PostListItem = Post & {
  profiles?: ProfileLite | null;
  communities?: CommunityLite | null;
  comments?: { id?: string; count?: number }[];
  post_votes?: { direction: number; user_id?: string }[];
  score?: number;
  comment_count?: number;
  popularity_score?: number;
};

export type MemberRow = {
  role: string;
  profiles?: ProfileLite | null;
};

export type ParticipantRow = {
  user_id: string;
  status?: string;
  profiles?: ProfileLite | null;
};

export type FriendshipRow = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  requester?: ProfileLite | null;
  receiver?: ProfileLite | null;
};

export type AdminReportRow = {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
};
