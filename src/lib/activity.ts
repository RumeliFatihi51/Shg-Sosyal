import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminConfig, hasSupabaseConfig } from "@/lib/env";
import { notifyUser } from "@/lib/actions/shared";
import type { NotificationType } from "@/lib/types";

export type ActivityAction =
  | "event_view"
  | "post_view"
  | "community_visit"
  | "search"
  | "event_create"
  | "event_join"
  | "event_leave"
  | "community_create"
  | "community_join"
  | "community_leave"
  | "community_follow"
  | "community_unfollow"
  | "post_create"
  | "post_vote"
  | "comment_create"
  | "report_create"
  | "poll_create"
  | "poll_vote"
  | "click"
  | "share";

export function isMissingRpc(error: unknown) {
  const typed = error as { code?: string; message?: string } | null;
  const message = typed?.message?.toLocaleLowerCase("tr") ?? "";

  return (
    typed?.code === "PGRST202" ||
    typed?.code === "42883" ||
    message.includes("could not find the function") ||
    (message.includes("function") && message.includes("does not exist"))
  );
}

export async function recordActivity(input: {
  action: ActivityAction;
  targetType: "event" | "post" | "community" | "poll" | "search" | "system";
  targetId?: string | null;
  searchQuery?: string | null;
  path?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!hasSupabaseConfig()) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase.rpc("record_activity", {
      p_action: input.action,
      p_target_type: input.targetType,
      p_target_id: input.targetId ?? null,
      p_search_query: input.searchQuery ?? null,
      p_path: input.path ?? null,
      p_metadata: input.metadata ?? {},
    });

  void error;
}

export async function notifyAcceptedFriends(input: {
  actorId: string;
  type: Extract<NotificationType, "friend_event" | "friend_post">;
  title: string;
  body: string;
  href: string;
  digestPrefix: string;
  limit?: number;
}) {
  if (!hasSupabaseAdminConfig()) {
    return;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("friendships")
    .select("requester_id,receiver_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${input.actorId},receiver_id.eq.${input.actorId}`)
    .limit(input.limit ?? 60);

  const friendIds = Array.from(
    new Set(
      (data ?? []).map((row: { requester_id: string; receiver_id: string }) =>
        row.requester_id === input.actorId ? row.receiver_id : row.requester_id,
      ),
    ),
  ).filter(Boolean);

  await Promise.all(
    friendIds.map((friendId) =>
      notifyUser({
        userId: friendId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href,
        digestKey: `${input.digestPrefix}:${friendId}`,
      }),
    ),
  );
}
