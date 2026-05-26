export type RewardActionType =
  | "profile_complete"
  | "event_join"
  | "event_suggest"
  | "event_approved"
  | "post_create"
  | "poll_create"
  | "poll_vote"
  | "comment_create"
  | "friend_accept"
  | "community_join"
  | "community_approved";

export type BadgeCategory =
  | "Katılım"
  | "Üretim"
  | "Topluluk"
  | "Sosyal"
  | "Haftalık başarı";

export type BadgeCatalogItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  criteria_type: string;
  criteria_key: string | null;
  criteria_value: number;
  sort_order: number;
  is_active: boolean;
  earned_at?: string | null;
};

export type UserPoints = {
  user_id: string;
  total_points: number;
  weekly_points: number;
  daily_points: number;
  updated_at: string;
};

export type LeaderboardUserRow = {
  rank: number;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  tag: string | null;
  class_name: string | null;
  avatar_path: string | null;
  points: number;
};

export type LeaderboardClassRow = {
  rank: number;
  class_name: string | null;
  points: number;
  user_count: number;
};

export type LeaderboardCommunityRow = {
  rank: number;
  community_id: string;
  name: string;
  slug: string;
  member_count: number | null;
  post_count: number | null;
  event_count: number | null;
  points: number;
};
