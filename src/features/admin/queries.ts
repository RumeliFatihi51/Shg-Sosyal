import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUsers } from "@/features/users/queries";

export { getAdminUsers };

export async function getAdminStats(today: string) {
  const admin = createAdminClient();
  const [userStats, communityStats, eventStats, postStats] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("communities").select("id", { count: "exact", head: true }),
    admin
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("event_date", today),
    admin.from("posts").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);

  return {
    users: userStats.count ?? 0,
    communities: communityStats.count ?? 0,
    activeEvents: eventStats.count ?? 0,
    posts: postStats.count ?? 0,
  };
}
