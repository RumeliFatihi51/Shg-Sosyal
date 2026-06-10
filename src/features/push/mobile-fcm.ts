import "server-only";

import { JWT } from "google-auth-library";
import { hasFirebaseMessagingConfig, hasSupabaseAdminConfig, getFirebasePrivateKey } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

type MobilePushPayload = {
  title: string;
  body: string;
  url?: string;
  type?: string;
  tag?: string;
  conversationId?: string;
};

type MobilePushTokenRow = {
  id: string;
  token: string;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

function firebaseProjectId() {
  return process.env.FIREBASE_PROJECT_ID ?? "";
}

async function getFirebaseAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const client = new JWT({
    email: process.env.FIREBASE_CLIENT_EMAIL,
    key: getFirebasePrivateKey(),
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });

  const credentials = await client.authorize();
  const accessToken = credentials.access_token;

  if (!accessToken) {
    throw new Error("Firebase access token alınamadı.");
  }

  cachedToken = {
    value: accessToken,
    expiresAt: credentials.expiry_date ?? Date.now() + 45 * 60_000,
  };

  return accessToken;
}

function fcmMessage(token: string, payload: MobilePushPayload) {
  const url = payload.url ?? "/notifications";

  return {
    message: {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        url,
        type: payload.type ?? "notification",
        tag: payload.tag ?? "",
        conversation_id: payload.conversationId ?? "",
      },
      android: {
        priority: "high",
        notification: {
          channel_id: "shg_social_default",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
    },
  };
}

async function markTokenInactive(id: string) {
  const admin = createAdminClient();
  await admin
    .from("mobile_push_tokens")
    .update({
      is_active: false,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function sendMobilePushToUser(userId: string, payload: MobilePushPayload) {
  if (!hasSupabaseAdminConfig() || !hasFirebaseMessagingConfig()) {
    return { attempted: 0, sent: 0 };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mobile_push_tokens")
    .select("id,token")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("last_seen_at", { ascending: false })
    .limit(10);

  if (error || !data?.length) {
    return { attempted: 0, sent: 0 };
  }

  const accessToken = await getFirebaseAccessToken();
  const endpoint = `https://fcm.googleapis.com/v1/projects/${firebaseProjectId()}/messages:send`;
  let sent = 0;

  await Promise.all(
    (data as MobilePushTokenRow[]).map(async (row) => {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fcmMessage(row.token, payload)),
        });

        if (response.ok) {
          sent += 1;
          return;
        }

        const text = await response.text().catch(() => "");
        if (response.status === 400 || response.status === 404) {
          await markTokenInactive(row.id);
        }

        console.error("Mobile push notification failed", {
          userId,
          status: response.status,
          body: text.slice(0, 500),
        });
      } catch (error) {
        console.error("Mobile push notification failed", {
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }),
  );

  return { attempted: data.length, sent };
}
