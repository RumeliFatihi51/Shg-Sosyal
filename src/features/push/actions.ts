"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/session";
import { sendWebPushToUser } from "@/features/push/server";

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(10).max(512),
    auth: z.string().min(10).max(512),
  }),
});

export async function savePushSubscriptionAction(input: unknown) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return { ok: false, message: "Bildirimleri açmak için giriş yap." };
  }

  const parsed = pushSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Bildirim aboneliği doğrulanamadı." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: profile.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      user_agent: null,
      is_active: true,
      last_seen_at: new Date().toISOString(),
    },
    {
      onConflict: "endpoint",
    },
  );

  if (error) {
    return {
      ok: false,
      message: `Bildirim aboneliği kaydedilemedi: ${error.message}`,
    };
  }

  return { ok: true, message: "Bildirimler açıldı." };
}

export async function removePushSubscriptionAction(endpoint?: string) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return { ok: false, message: "Oturum bulunamadı." };
  }

  const supabase = await createClient();
  let request = supabase
    .from("push_subscriptions")
    .update({ is_active: false, last_seen_at: new Date().toISOString() })
    .eq("user_id", profile.id);

  if (endpoint) {
    request = request.eq("endpoint", endpoint);
  }

  const { error } = await request;
  if (error) {
    return { ok: false, message: `Bildirim aboneliği kapatılamadı: ${error.message}` };
  }

  return { ok: true, message: "Bildirimler kapatıldı." };
}

export async function sendTestPushAction() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return { ok: false, message: "Test bildirimi için giriş yap." };
  }

  await sendWebPushToUser(profile.id, {
    title: "ŞHG Sosyal",
    body: "Bildirimler çalışıyor.",
    url: "/notifications",
    tag: "push-test",
  });

  return { ok: true, message: "Test bildirimi gönderildi." };
}
