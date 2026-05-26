import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireProfile } from "@/lib/session";
import type {
  BadgeCatalogItem,
  LeaderboardClassRow,
  LeaderboardCommunityRow,
  LeaderboardUserRow,
  UserPoints,
} from "@/features/rewards/types";

const badgeSelect =
  "id,code,name,description,icon,category,criteria_type,criteria_key,criteria_value,sort_order,is_active";

export async function getBadgeCatalog() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [{ data: badges }, { data: earned }, { data: points }] = await Promise.all([
    supabase
      .from("badges")
      .select(badgeSelect)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("user_badges")
      .select("badge_id,awarded_at")
      .eq("user_id", profile.id),
    supabase
      .from("user_points")
      .select("user_id,total_points,weekly_points,daily_points,updated_at")
      .eq("user_id", profile.id)
      .maybeSingle(),
  ]);

  const earnedMap = new Map(
    (earned ?? []).map((item: { badge_id: string; awarded_at: string }) => [
      item.badge_id,
      item.awarded_at,
    ]),
  );

  return {
    profile,
    points: (points as UserPoints | null) ?? null,
    badges: ((badges ?? []) as BadgeCatalogItem[]).map((badge) => ({
      ...badge,
      earned_at: earnedMap.get(badge.id) ?? null,
    })),
  };
}

export async function getUserRewards(userId: string) {
  const supabase = await createClient();
  const [{ data: points }, { data: badges }] = await Promise.all([
    supabase
      .from("user_points")
      .select("user_id,total_points,weekly_points,daily_points,updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_badges")
      .select(`awarded_at,badges(${badgeSelect})`)
      .eq("user_id", userId)
      .order("awarded_at", { ascending: false })
      .limit(8),
  ]);

  return {
    points: (points as UserPoints | null) ?? null,
    badges: badges ?? [],
  };
}

export async function getLeaderboardData(scope = "weekly") {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const normalizedScope = ["daily", "weekly", "all", "communities", "classes"].includes(scope)
    ? scope
    : "weekly";

  if (normalizedScope === "communities") {
    const { data } = await supabase
      .from("community_leaderboard")
      .select("*")
      .limit(50);

    return {
      profile,
      scope: normalizedScope,
      users: [] as LeaderboardUserRow[],
      communities: (data ?? []) as LeaderboardCommunityRow[],
      classes: [] as LeaderboardClassRow[],
      myRank: null as LeaderboardUserRow | null,
    };
  }

  if (normalizedScope === "classes") {
    const { data } = await supabase
      .from("class_leaderboard")
      .select("*")
      .limit(50);

    return {
      profile,
      scope: normalizedScope,
      users: [] as LeaderboardUserRow[],
      communities: [] as LeaderboardCommunityRow[],
      classes: (data ?? []) as LeaderboardClassRow[],
      myRank: null as LeaderboardUserRow | null,
    };
  }

  const view =
    normalizedScope === "daily"
      ? "daily_leaderboard"
      : normalizedScope === "all"
        ? "all_time_leaderboard"
        : "weekly_leaderboard";

  const { data } = await supabase
    .from(view)
    .select("*")
    .limit(50);
  const users = (data ?? []) as LeaderboardUserRow[];

  return {
    profile,
    scope: normalizedScope,
    users,
    communities: [] as LeaderboardCommunityRow[],
    classes: [] as LeaderboardClassRow[],
    myRank: profile ? users.find((row) => row.user_id === profile.id) ?? null : null,
  };
}
