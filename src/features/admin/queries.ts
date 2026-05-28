import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUsers } from "@/features/users/queries";

export { getAdminUsers };

export type ProductionReadinessCheck = {
  key: string;
  label: string;
  ok: boolean;
  severity: "critical" | "warning";
  fix_hint: string | null;
};

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

export async function getProductionReadinessChecks(): Promise<ProductionReadinessCheck[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("production_readiness_checks")
    .select("key,label,ok,severity,fix_hint")
    .order("severity", { ascending: true })
    .order("key", { ascending: true });

  if (error) {
    return [
      {
        key: "readiness_view_missing",
        label: "Production kontrol view okunamıyor",
        ok: false,
        severity: "warning",
        fix_hint: "20260528153000_production_readiness_checks.sql migration dosyasını Supabase SQL Editor'da çalıştır.",
      },
    ];
  }

  return (data ?? []) as ProductionReadinessCheck[];
}
