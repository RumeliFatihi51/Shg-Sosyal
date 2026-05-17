"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  auditLog,
  formFile,
  formString,
  redirectWithMessage,
  requireCommunityManager,
  uploadImage,
} from "@/lib/actions/shared";
import { isMissingRpc, notifyAcceptedFriends, recordActivity } from "@/lib/activity";
import { canPublishWithoutApproval, requireProfile } from "@/lib/session";
import { eventSchema } from "@/lib/validators/forms";

function displayName(profile: { first_name?: string | null; last_name?: string | null }) {
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Bir arkadaşın";
}

export async function createEventAction(formData: FormData) {
  const profile = await requireProfile();
  const returnTo = formString(formData, "return_to") || "/events";
  const parsed = eventSchema.safeParse({
    title: formString(formData, "title"),
    description: formString(formData, "description"),
    event_date: formString(formData, "event_date"),
    start_time: formString(formData, "start_time"),
    location: formString(formData, "location"),
    capacity: formString(formData, "capacity"),
    community_id: formString(formData, "community_id"),
  });

  if (!parsed.success) {
    const reason = parsed.error.issues[0]?.message ?? "Etkinlik bilgileri eksik.";
    redirectWithMessage(returnTo, `Etkinlik bilgileri eksik: ${reason}`);
  }

  const communityId = parsed.data.community_id || null;

  if (communityId) {
    await requireCommunityManager(communityId);
  }

  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadImage(
      "event-images",
      `events/${profile.id}`,
      formFile(formData, "image"),
    );
  } catch (error) {
    redirectWithMessage(
      returnTo,
      `Görsel yüklenemedi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
    );
  }

  const admin = createAdminClient();
  const autoApprove = canPublishWithoutApproval(profile);
  const { data, error } = await admin
    .from("events")
    .insert({
      community_id: communityId,
      created_by: profile.id,
      title: parsed.data.title,
      description: parsed.data.description,
      event_date: parsed.data.event_date,
      start_time: parsed.data.start_time,
      location: parsed.data.location,
      capacity:
        typeof parsed.data.capacity === "number" ? parsed.data.capacity : null,
      image_url: imageUrl,
      status: autoApprove ? "approved" : "pending",
      approved_by: autoApprove ? profile.id : null,
      approved_at: autoApprove ? new Date().toISOString() : null,
      lifecycle: "scheduled",
    })
    .select("id")
    .single();

  if (error) {
    redirectWithMessage(returnTo, `Etkinlik kaydedilemedi: ${error.message}`);
  }

  if (data) {
    await Promise.all([
      auditLog({
        actorId: profile.id,
        action: autoApprove ? "event.auto_approved_create" : "event.create_pending",
        targetType: "event",
        targetId: data.id,
      }),
      recordActivity({
        action: "event_create",
        targetType: "event",
        targetId: data.id,
        path: `/events/${data.id}`,
      }),
      autoApprove
        ? notifyAcceptedFriends({
            actorId: profile.id,
            type: "friend_event",
            title: `${displayName(profile)} yeni bir etkinlik başlattı`,
            body: parsed.data.title,
            href: `/events/${data.id}`,
            digestPrefix: `friend-event:${data.id}`,
          })
        : Promise.resolve(),
    ]);
  }

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath(returnTo);
  redirectWithMessage(
    data ? `/events/${data.id}` : returnTo,
    autoApprove ? "Etkinlik yayınlandı." : "Etkinlik onay için gönderildi.",
  );
}

export async function toggleEventParticipationAction(formData: FormData) {
  const profile = await requireProfile();
  const eventId = formString(formData, "event_id");
  const isJoined = formString(formData, "is_joined") === "true";

  if (!eventId) {
    redirectWithMessage("/events", "Etkinlik bulunamadı.");
  }

  if (isJoined) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", profile.id);

    if (error) {
      redirectWithMessage(`/events/${eventId}`, `Katılım kaldırılamadı: ${error.message}`);
    }

    await recordActivity({
      action: "event_leave",
      targetType: "event",
      targetId: eventId,
      path: `/events/${eventId}`,
    });
  } else {
    await joinEvent(eventId);
    await recordActivity({
      action: "event_join",
      targetType: "event",
      targetId: eventId,
      path: `/events/${eventId}`,
    });
  }

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  redirectWithMessage(
    `/events/${eventId}`,
    isJoined ? "Katılım kaldırıldı." : "Katılım kaydedildi.",
  );
}

async function joinEvent(eventId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("join_event_safely", { p_event_id: eventId });

  if (!error) {
    return;
  }

  if (!isMissingRpc(error)) {
    redirectWithMessage(`/events/${eventId}`, `Katılım kaydedilemedi: ${error.message}`);
  }

  await fallbackJoinEvent(eventId);
}

async function fallbackJoinEvent(eventId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: event } = await supabase
    .from("events")
    .select("capacity,lifecycle,status")
    .eq("id", eventId)
    .single();

  if (!event || event.status !== "approved") {
    redirectWithMessage(`/events/${eventId}`, "Etkinlik yayında değil.");
  }

  if (event.lifecycle === "canceled") {
    redirectWithMessage(`/events/${eventId}`, "İptal edilmiş etkinliğe katılım alınamaz.");
  }

  const { count } = await supabase
    .from("event_participants")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "going");
  const isFull = Boolean(event.capacity && (count ?? 0) >= event.capacity);

  const { error } = await admin.from("event_participants").upsert(
    {
      event_id: eventId,
      user_id: profile.id,
      status: isFull ? "waitlisted" : "going",
    },
    { onConflict: "event_id,user_id" },
  );

  if (error) {
    redirectWithMessage(`/events/${eventId}`, `Katılım kaydedilemedi: ${error.message}`);
  }
}
