import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminConfig } from "@/lib/env";
import type { RewardActionType } from "@/features/rewards/types";

export async function awardPoints(input: {
  userId?: string | null;
  actionType: RewardActionType;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!input.userId || !hasSupabaseAdminConfig()) {
    return 0;
  }

  try {
    const admin = createAdminClient();
    const idempotencyKey = [
      input.actionType,
      input.targetType,
      input.targetId ?? "none",
      input.userId,
    ].join(":");

    const { data, error } = await admin.rpc("award_points_safely", {
      p_user_id: input.userId,
      p_action_type: input.actionType,
      p_target_type: input.targetType,
      p_target_id: input.targetId ?? null,
      p_idempotency_key: idempotencyKey,
      p_metadata: input.metadata ?? {},
    });

    if (error) {
      return 0;
    }

    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}
