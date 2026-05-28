import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminConfig } from "@/lib/env";
import { getFileExtension } from "@/lib/utils";
import { requireProfile } from "@/lib/session";
import type { NotificationType } from "@/lib/types";

export type ActionState = {
  ok: boolean;
  message: string;
};

export const initialActionState: ActionState = {
  ok: false,
  message: "",
};

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;

export function formString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export function redirectWithMessage(path: string, message: string): never {
  const separator = path.includes("?") ? "&" : "?";

  redirect(`${path}${separator}message=${encodeURIComponent(message)}`);
}

export function formFile(formData: FormData, key: string) {
  const value = formData.get(key);

  if (value instanceof File && value.size > 0) {
    return value;
  }

  return null;
}

export async function uploadImage(
  bucket: "avatars" | "community-images" | "event-images",
  folder: string,
  file: File | null,
) {
  if (!file) {
    return null;
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Sadece JPG, PNG veya WebP görsel yüklenebilir.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Görsel en fazla 3MB olabilir.");
  }

  const supabase = await createClient();
  const path = `${folder}/${crypto.randomUUID()}${getFileExtension(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (bucket === "event-images") {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return data.publicUrl;
  }

  return path;
}

export async function notifyUser(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  digestKey?: string | null;
  actorId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
}) {
  if (!hasSupabaseAdminConfig()) {
    return;
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const payload = {
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    digest_key: input.digestKey ?? null,
    read_at: null,
  };

  if (input.digestKey) {
    const { data: existing, error: lookupError } = await admin
      .from("notifications")
      .select("id,occurrence_count")
      .eq("user_id", input.userId)
      .eq("digest_key", input.digestKey)
      .maybeSingle();

    if (!lookupError && existing?.id) {
      const { error: updateError } = await admin
        .from("notifications")
        .update({
          title: input.title,
          body: input.body,
          href: input.href ?? null,
          actor_id: input.actorId ?? null,
          target_type: input.targetType ?? null,
          target_id: input.targetId ?? null,
          read_at: null,
          created_at: now,
          last_seen_at: now,
          occurrence_count: Math.max(Number(existing.occurrence_count ?? 1), 1) + 1,
        })
        .eq("id", existing.id);

      if (!updateError) {
        return;
      }

      const { error: legacyUpdateError } = await admin
        .from("notifications")
        .update({
          title: input.title,
          body: input.body,
          href: input.href ?? null,
          read_at: null,
          created_at: now,
        })
        .eq("id", existing.id);

      if (legacyUpdateError) {
        console.error("Notification digest could not be updated", {
          digestKey: input.digestKey,
          error: legacyUpdateError.message,
        });
      }
      return;
    }

    const { error: insertError } = await admin.from("notifications").insert({
      ...payload,
      actor_id: input.actorId ?? null,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      created_at: now,
      last_seen_at: now,
      occurrence_count: 1,
    });

    if (!insertError) {
      return;
    }

    const { error: legacyInsertError } = await admin.from("notifications").upsert(
      {
        ...payload,
        created_at: now,
      },
      {
        onConflict: "user_id,digest_key",
      },
    );

    if (legacyInsertError) {
      console.error("Notification digest could not be written", {
        digestKey: input.digestKey,
        lookupError: lookupError?.message,
        insertError: insertError.message,
        legacyInsertError: legacyInsertError.message,
      });
    }
    return;
  }

  const { error } = await admin.from("notifications").insert({
    ...payload,
    actor_id: input.actorId ?? null,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    created_at: now,
    last_seen_at: now,
    occurrence_count: 1,
  });

  if (!error) {
    return;
  }

  const { error: legacyError } = await admin.from("notifications").insert({
    ...payload,
    created_at: now,
  });

  if (legacyError) {
    console.error("Notification could not be written", {
      userId: input.userId,
      type: input.type,
      error: legacyError.message,
    });
  }
}

export async function auditLog(input: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!hasSupabaseAdminConfig()) {
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    actor_id: input.actorId,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Audit log could not be written", {
      action: input.action,
      targetType: input.targetType,
      error: error.message,
    });
  }
}

export async function refresh(paths: string[]) {
  paths.forEach((path) => revalidatePath(path));
}

export async function requireCommunityManager(communityId: string) {
  const profile = await requireProfile();

  if (["admin", "moderator", "teacher"].includes(profile.role)) {
    return profile;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", profile.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!data) {
    redirect("/");
  }

  return profile;
}

export async function ensureModeratorCanActOnUser(actorId: string, targetUserId: string) {
  const admin = createAdminClient();
  const [{ data: actor }, { data: target }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", actorId).maybeSingle(),
    admin.from("profiles").select("role").eq("id", targetUserId).maybeSingle(),
  ]);

  if (actor?.role === "moderator" && target?.role === "admin") {
    redirectWithMessage("/admin", "Moderator admin kullanıcı üzerinde işlem yapamaz.");
  }
}
