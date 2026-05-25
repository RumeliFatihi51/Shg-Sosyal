import type { Profile, UserRole } from "@/lib/types";

export type PublicUser = Pick<
  Profile,
  "id" | "first_name" | "last_name" | "class_name" | "avatar_path" | "username" | "tag" | "bio"
>;

export type AdminUserRow = PublicUser & {
  email: string | null;
  school_number: string | null;
  role: UserRole;
  is_suspended?: boolean;
  suspension_reason?: string | null;
  participation_points?: number;
  last_seen_at?: string | null;
  created_at: string;
};
