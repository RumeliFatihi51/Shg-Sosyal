"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import {
  auditLog,
  ensureModeratorCanActOnUser,
  formString,
  notifyUser,
  redirectWithMessage,
} from "@/lib/actions/shared";
import { isMissingRpc, notifyAcceptedFriends, recordActivity } from "@/lib/activity";
import { announcementSchema, pollSchema } from "@/lib/validators/forms";
import type { UserRole } from "@/lib/types";

function displayName(profile?: { first_name?: string | null; last_name?: string | null } | null) {
  return [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Bir arkadaşın";
}

export async function reviewCommunityAction(formData: FormData) {
  const reviewer = await requireRole(["admin", "moderator"]);
  const communityId = formString(formData, "community_id");
  const status = formString(formData, "status") === "approved" ? "approved" : "rejected";
  const reason = formString(formData, "reason");
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("communities")
    .select("created_by")
    .eq("id", communityId)
    .maybeSingle();

  if (existing?.created_by) {
    await ensureModeratorCanActOnUser(reviewer.id, existing.created_by);
  }

  const { data, error } = await admin
    .from("communities")
    .update({
      status,
      approved_by: status === "approved" ? reviewer.id : null,
      approved_at: status === "approved" ? new Date().toISOString() : null,
      rejection_reason: status === "rejected" ? reason : null,
    })
    .eq("id", communityId)
    .select("created_by,name")
    .single();

  if (error) {
    redirectWithMessage(
      "/admin",
      `Topluluk kararı kaydedilemedi: ${error.message}. Son backend migration çalışmış olmalı.`,
    );
  }

  if (status === "approved" && data?.created_by) {
    await admin
      .from("profiles")
      .update({ role: "community_admin" })
      .eq("id", data.created_by)
      .eq("role", "student");
  }

  if (data?.created_by) {
    await notifyUser({
      userId: data.created_by,
      type: "admin_decision",
      title: status === "approved" ? "Topluluğun onaylandı" : "Topluluk başvurun reddedildi",
      body: status === "rejected" && reason ? `${data.name}: ${reason}` : data.name,
      href: "/communities",
      digestKey: `community-decision:${communityId}:${status}`,
    });
  }

  await auditLog({
    actorId: reviewer.id,
    action: `community.${status}`,
    targetType: "community",
    targetId: communityId,
    metadata: { reason },
  });

  revalidatePath("/admin");
  revalidatePath("/communities");
  redirect("/admin");
}

export async function reviewEventAction(formData: FormData) {
  const reviewer = await requireRole(["admin", "moderator"]);
  const eventId = formString(formData, "event_id");
  const status = formString(formData, "status") === "approved" ? "approved" : "rejected";
  const reason = formString(formData, "reason");
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("events")
    .select("created_by")
    .eq("id", eventId)
    .maybeSingle();

  if (existing?.created_by) {
    await ensureModeratorCanActOnUser(reviewer.id, existing.created_by);
  }

  const { data, error } = await admin
    .from("events")
    .update({
      status,
      approved_by: status === "approved" ? reviewer.id : null,
      approved_at: status === "approved" ? new Date().toISOString() : null,
      rejection_reason: status === "rejected" ? reason : null,
    })
    .eq("id", eventId)
    .select("created_by,title")
    .single();

  if (error) {
    redirectWithMessage(
      "/admin",
      `Etkinlik kararı kaydedilemedi: ${error.message}. Son backend migration çalışmış olmalı.`,
    );
  }

  if (data?.created_by) {
    await notifyUser({
      userId: data.created_by,
      type: "admin_decision",
      title: status === "approved" ? "Etkinliğin yayınlandı" : "Etkinlik başvurun reddedildi",
      body: status === "rejected" && reason ? `${data.title}: ${reason}` : data.title,
      href: status === "approved" ? `/events/${eventId}` : "/",
      digestKey: `event-decision:${eventId}:${status}`,
    });

    if (status === "approved") {
      const { data: creator } = await admin
        .from("profiles")
        .select("first_name,last_name")
        .eq("id", data.created_by)
        .maybeSingle();

      await notifyAcceptedFriends({
        actorId: data.created_by,
        type: "friend_event",
        title: `${displayName(creator)} yeni bir etkinlik başlattı`,
        body: data.title,
        href: `/events/${eventId}`,
        digestPrefix: `friend-event:${eventId}`,
      });
    }
  }

  await auditLog({
    actorId: reviewer.id,
    action: `event.${status}`,
    targetType: "event",
    targetId: eventId,
    metadata: { reason },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/events/${eventId}`);
  redirect("/admin");
}

export async function updateUserRoleAction(formData: FormData) {
  const current = await requireRole(["admin"]);
  const userId = formString(formData, "user_id");
  const role = formString(formData, "role") as UserRole;

  if (!["student", "community_admin", "teacher", "moderator", "admin"].includes(role)) {
    redirectWithMessage("/admin", "Rol geçersiz.");
  }

  if (userId === current.id && role !== "admin") {
    redirectWithMessage("/admin", "Kendi admin rolünü düşüremezsin.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);

  if (error) {
    redirectWithMessage(
      "/admin",
      `Rol güncellenemedi: ${error.message}. Son backend migration çalışmış olmalı.`,
    );
  }

  await auditLog({
    actorId: current.id,
    action: "user.role_update",
    targetType: "profile",
    targetId: userId,
    metadata: { role },
  });

  if (userId !== current.id) {
    await notifyUser({
      userId,
      type: "admin_decision",
      title: "Rolün güncellendi",
      body: `Yeni rolün: ${role}`,
      href: "/profile/" + userId,
      digestKey: `role-update:${userId}`,
    });
  }

  revalidatePath("/admin");
  redirectWithMessage("/admin", "Rol güncellendi.");
}

export async function softDeletePostAction(formData: FormData) {
  const actor = await requireRole(["admin", "moderator"]);
  const postId = formString(formData, "post_id");
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();

  if (post?.author_id) {
    await ensureModeratorCanActOnUser(actor.id, post.author_id);
  }

  const { error } = await admin
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) {
    redirectWithMessage("/admin", `Gönderi silinemedi: ${error.message}`);
  }

  await auditLog({
    actorId: actor.id,
    action: "post.soft_delete",
    targetType: "post",
    targetId: postId,
  });

  revalidatePath("/admin");
  revalidatePath(`/posts/${postId}`);
  redirect("/admin");
}

export async function deleteCommentAction(formData: FormData) {
  const actor = await requireRole(["admin", "moderator"]);
  const commentId = formString(formData, "comment_id");
  const postId = formString(formData, "post_id");
  const admin = createAdminClient();

  const { data: comment } = await admin
    .from("comments")
    .select("author_id")
    .eq("id", commentId)
    .maybeSingle();

  if (comment?.author_id) {
    await ensureModeratorCanActOnUser(actor.id, comment.author_id);
  }

  const { error } = await admin
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId);

  if (error) {
    redirectWithMessage("/admin", `Yorum silinemedi: ${error.message}`);
  }

  await auditLog({
    actorId: actor.id,
    action: "comment.soft_delete",
    targetType: "comment",
    targetId: commentId,
  });

  revalidatePath("/admin");
  if (postId) {
    revalidatePath(`/posts/${postId}`);
  }
  redirect("/admin");
}

export async function markReportReviewedAction(formData: FormData) {
  const actor = await requireRole(["admin", "moderator"]);
  const reportId = formString(formData, "report_id");
  const note = formString(formData, "resolution_note");
  const admin = createAdminClient();

  const { error } = await admin
    .from("reports")
    .update({
      status: "reviewed",
      resolution_note: note,
      resolved_by: actor.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    redirectWithMessage("/admin", `Rapor güncellenemedi: ${error.message}`);
  }

  const { error: actionError } = await admin.from("moderation_actions").insert({
    report_id: reportId,
    actor_id: actor.id,
    action: "reviewed",
    note,
  });

  if (actionError) {
    redirectWithMessage("/admin", `Moderasyon geçmişi kaydedilemedi: ${actionError.message}`);
  }

  await auditLog({
    actorId: actor.id,
    action: "report.reviewed",
    targetType: "report",
    targetId: reportId,
    metadata: { note },
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateEventLifecycleAction(formData: FormData) {
  const actor = await requireRole(["admin", "moderator"]);
  const eventId = formString(formData, "event_id");
  const lifecycle = formString(formData, "lifecycle");
  const reason = formString(formData, "reason");

  if (!["scheduled", "postponed", "canceled"].includes(lifecycle)) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const update: Record<string, string | null> = {
    lifecycle,
    cancellation_reason: lifecycle === "canceled" ? reason : null,
  };

  const { error } = await admin.from("events").update(update).eq("id", eventId);
  if (error) {
    redirectWithMessage("/admin", `Etkinlik durumu güncellenemedi: ${error.message}`);
  }
  await auditLog({
    actorId: actor.id,
    action: `event.lifecycle.${lifecycle}`,
    targetType: "event",
    targetId: eventId,
    metadata: { reason },
  });

  revalidatePath("/admin");
  revalidatePath(`/events/${eventId}`);
  redirect("/admin");
}

export async function suspendCommunityAction(formData: FormData) {
  const actor = await requireRole(["admin", "moderator"]);
  const communityId = formString(formData, "community_id");
  const reason = formString(formData, "reason");
  const isSuspended = formString(formData, "is_suspended") === "true";
  const admin = createAdminClient();

  const { data: community } = await admin
    .from("communities")
    .select("created_by")
    .eq("id", communityId)
    .maybeSingle();

  if (community?.created_by) {
    await ensureModeratorCanActOnUser(actor.id, community.created_by);
  }

  const { error } = await admin
    .from("communities")
    .update({
      is_suspended: isSuspended,
      suspended_by: isSuspended ? actor.id : null,
      suspended_at: isSuspended ? new Date().toISOString() : null,
      suspension_reason: isSuspended ? reason : null,
    })
    .eq("id", communityId);

  if (error) {
    redirectWithMessage("/admin", `Topluluk durumu güncellenemedi: ${error.message}`);
  }

  await auditLog({
    actorId: actor.id,
    action: isSuspended ? "community.suspend" : "community.unsuspend",
    targetType: "community",
    targetId: communityId,
    metadata: { reason },
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function suspendUserAction(formData: FormData) {
  const actor = await requireRole(["admin"]);
  const userId = formString(formData, "user_id");
  const reason = formString(formData, "reason");
  const isSuspended = formString(formData, "is_suspended") === "true";

  if (userId === actor.id) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      is_suspended: isSuspended,
      suspension_reason: isSuspended ? reason : null,
    })
    .eq("id", userId);

  if (error) {
    redirectWithMessage("/admin", `Kullanıcı durumu güncellenemedi: ${error.message}`);
  }

  await auditLog({
    actorId: actor.id,
    action: isSuspended ? "user.suspend" : "user.unsuspend",
    targetType: "profile",
    targetId: userId,
    metadata: { reason },
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function createAnnouncementAction(formData: FormData) {
  const actor = await requireRole(["admin", "moderator", "teacher"]);
  const parsed = announcementSchema.safeParse({
    title: formString(formData, "title"),
    body: formString(formData, "body"),
    audience: formString(formData, "audience") || "school",
  });

  if (!parsed.success) {
    redirectWithMessage("/admin", "Duyuru bilgileri eksik.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("announcements")
    .insert({ ...parsed.data, author_id: actor.id })
    .select("id")
    .single();

  if (error) {
    redirectWithMessage("/admin", `Duyuru yayınlanamadı: ${error.message}`);
  }

  await auditLog({
    actorId: actor.id,
    action: "announcement.create",
    targetType: "announcement",
    targetId: data?.id,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirectWithMessage("/admin", "Duyuru yayınlandı.");
}

export async function createPollAction(formData: FormData) {
  const actor = await requireRole(["admin", "moderator", "teacher"]);
  const options = ["option_1", "option_2", "option_3", "option_4", "option_5", "option_6"]
    .map((key) => formString(formData, key))
    .filter(Boolean);
  const parsed = pollSchema.safeParse({
    title: formString(formData, "title"),
    description: formString(formData, "description"),
    closes_at: formString(formData, "closes_at"),
    options,
  });

  if (!parsed.success) {
    const reason = parsed.error.issues[0]?.message ?? "Anket için en az iki seçenek gerekli.";
    redirectWithMessage("/admin", `Anket kaydedilemedi: ${reason}`);
  }

  const supabase = await createClient();
  const { data: pollId, error: rpcError } = await supabase.rpc("create_poll_with_options", {
    p_title: parsed.data.title,
    p_description: parsed.data.description || null,
    p_closes_at: parsed.data.closes_at || null,
    p_options: parsed.data.options,
  });

  if (!rpcError) {
    await Promise.all([
      auditLog({
        actorId: actor.id,
        action: "poll.create",
        targetType: "poll",
        targetId: typeof pollId === "string" ? pollId : null,
      }),
      recordActivity({
        action: "poll_create",
        targetType: "poll",
        targetId: typeof pollId === "string" ? pollId : null,
        path: "/polls",
        metadata: { source: "poll_create" },
      }),
    ]);

    revalidatePath("/polls");
    revalidatePath("/admin");
    redirectWithMessage("/admin", "Anket yayınlandı.");
  }

  if (!isMissingRpc(rpcError)) {
    redirectWithMessage("/admin", `Anket oluşturulamadı: ${rpcError.message}`);
  }

  const admin = createAdminClient();
  const { data: poll, error } = await admin
    .from("polls")
    .insert({
      created_by: actor.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      closes_at: parsed.data.closes_at || null,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    redirectWithMessage("/admin", `Anket oluşturulamadı: ${error.message}`);
  }

  if (poll) {
    const { error: optionsError } = await admin.from("poll_options").insert(
      parsed.data.options.map((label, index) => ({
        poll_id: poll.id,
        label,
        position: index,
      })),
    );

    if (optionsError) {
      redirectWithMessage("/admin", `Anket seçenekleri kaydedilemedi: ${optionsError.message}`);
    }
    await auditLog({
      actorId: actor.id,
      action: "poll.create",
      targetType: "poll",
      targetId: poll.id,
    });
  }

  revalidatePath("/polls");
  revalidatePath("/admin");
  redirectWithMessage("/admin", "Anket yayınlandı.");
}
