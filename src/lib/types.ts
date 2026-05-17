export type UserRole =
  | "student"
  | "community_admin"
  | "teacher"
  | "moderator"
  | "admin";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type FriendshipStatus = "pending" | "accepted" | "rejected" | "blocked";

export type ReportStatus = "open" | "reviewed" | "dismissed";

export type EventLifecycle = "scheduled" | "postponed" | "canceled";

export type EventParticipationStatus = "going" | "waitlisted";

export type PollStatus = "draft" | "open" | "closed";

export type NotificationType =
  | "community_post"
  | "event_reminder"
  | "post_comment"
  | "daily_events"
  | "admin_decision"
  | "friend_request"
  | "announcement"
  | "poll"
  | "friend_event"
  | "friend_post"
  | "activity_digest";

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  class_name: string | null;
  school_number: string | null;
  interests: string[] | null;
  avatar_path: string | null;
  role: UserRole;
  is_suspended?: boolean;
  suspension_reason?: string | null;
  participation_points?: number;
  created_at: string;
  updated_at: string;
};

export type Community = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_path: string | null;
  status: ApprovalStatus;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason?: string | null;
  is_suspended?: boolean;
  suspension_reason?: string | null;
  member_count?: number;
  follower_count?: number;
  post_count?: number;
  event_count?: number;
  view_count?: number;
  activity_24h_count?: number;
  trend_score?: number;
  created_at: string;
  updated_at: string;
};

export type Event = {
  id: string;
  community_id: string | null;
  created_by: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  location: string;
  image_url: string | null;
  status: ApprovalStatus;
  lifecycle?: EventLifecycle;
  capacity?: number | null;
  participant_count?: number;
  waitlist_count?: number;
  view_count?: number;
  activity_24h_count?: number;
  trend_score?: number;
  rejection_reason?: string | null;
  cancellation_reason?: string | null;
  postponed_from_date?: string | null;
  postponed_from_time?: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  community_id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  upvote_count?: number;
  downvote_count?: number;
  score?: number;
  comment_count?: number;
  report_count?: number;
  view_count?: number;
  activity_24h_count?: number;
  popularity_score?: number;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  digest_key?: string | null;
  read_at: string | null;
  created_at: string;
};

export type FriendAttendance = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
};

export type Announcement = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  audience: string;
  created_at: string;
  updated_at: string;
};

export type Poll = {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  status: PollStatus;
  closes_at: string | null;
  created_at: string;
  updated_at: string;
};
