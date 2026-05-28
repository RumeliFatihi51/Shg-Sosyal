import "server-only";

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVapidSubject, hasSupabaseAdminConfig, hasWebPushConfig } from "@/lib/env";
import type { PushPayload, SerializedPushSubscription } from "@/features/push/types";

let configured = false;

function configureWebPush() {
  if (configured || !hasWebPushConfig()) {
    return hasWebPushConfig();
  }

  webpush.setVapidDetails(
    getVapidSubject(),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
  return true;
}

function toWebPushSubscription(row: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): SerializedPushSubscription {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
}

export async function sendWebPushToUser(userId: string, payload: PushPayload) {
  if (!hasSupabaseAdminConfig() || !configureWebPush()) {
    return;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("last_seen_at", { ascending: false })
    .limit(8);

  if (error || !data?.length) {
    return;
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/icons/icon-192.png",
    badge: payload.badge ?? "/icons/badge-96.png",
    url: payload.url ?? "/notifications",
    tag: payload.tag ?? undefined,
  });

  await Promise.all(
    data.map(async (subscription) => {
      try {
        await webpush.sendNotification(toWebPushSubscription(subscription), notificationPayload, {
          TTL: 60 * 60 * 6,
        });
      } catch (pushError) {
        const statusCode =
          typeof pushError === "object" && pushError && "statusCode" in pushError
            ? Number((pushError as { statusCode?: number }).statusCode)
            : 0;

        if (statusCode === 404 || statusCode === 410) {
          await admin
            .from("push_subscriptions")
            .update({ is_active: false, last_seen_at: new Date().toISOString() })
            .eq("id", subscription.id);
          return;
        }

        console.error("Web push notification failed", {
          userId,
          statusCode,
          error: pushError instanceof Error ? pushError.message : String(pushError),
        });
      }
    }),
  );
}
