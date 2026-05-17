"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formString, notifyUser, redirectWithMessage } from "@/lib/actions/shared";
import { isMissingRpc, recordActivity } from "@/lib/activity";
import { requireProfile } from "@/lib/session";
import { commentSchema, reportSchema } from "@/lib/validators/forms";

export async function addCommentAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = commentSchema.safeParse({
    post_id: formString(formData, "post_id"),
    body: formString(formData, "body"),
  });

  if (!parsed.success) {
    redirectWithMessage("/", "Yorum bilgileri eksik.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    post_id: parsed.data.post_id,
    author_id: profile.id,
    body: parsed.data.body,
  });

  if (error) {
    redirectWithMessage(`/posts/${parsed.data.post_id}`, `Yorum eklenemedi: ${error.message}`);
  }

  const { data: post } = await supabase
    .from("posts")
    .select("author_id,title")
    .eq("id", parsed.data.post_id)
    .single();

  await recordActivity({
    action: "comment_create",
    targetType: "post",
    targetId: parsed.data.post_id,
    path: `/posts/${parsed.data.post_id}`,
  });

  if (post?.author_id && post.author_id !== profile.id) {
    await notifyUser({
      userId: post.author_id,
      type: "post_comment",
      title: "Gönderine yeni yorum geldi",
      body: post.title ?? parsed.data.body,
      href: `/posts/${parsed.data.post_id}`,
      digestKey: `post-comment:${parsed.data.post_id}:${profile.id}`,
    });
  }

  revalidatePath(`/posts/${parsed.data.post_id}`);
  redirect(`/posts/${parsed.data.post_id}`);
}

export async function votePostAction(formData: FormData) {
  const profile = await requireProfile();
  const postId = formString(formData, "post_id");
  const returnTo = formString(formData, "return_to") || `/posts/${postId}`;
  const direction = Number(formString(formData, "direction")) === -1 ? -1 : 1;
  const supabase = await createClient();

  const { error } = await supabase.rpc("vote_post_safely", {
    p_post_id: postId,
    p_direction: direction,
  });

  if (error) {
    if (!isMissingRpc(error)) {
      redirectWithMessage(returnTo, `Oy kaydedilemedi: ${error.message}`);
    }

    await fallbackVotePost(postId, profile.id, direction, returnTo);
  }

  await recordActivity({
    action: "post_vote",
    targetType: "post",
    targetId: postId,
    path: returnTo,
    metadata: { direction },
  });

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/posts");
  redirect(returnTo);
}

export async function reportContentAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = reportSchema.safeParse({
    target_type: formString(formData, "target_type"),
    target_id: formString(formData, "target_id"),
    reason: formString(formData, "reason"),
  });
  const returnTo = formString(formData, "return_to") || "/";

  if (!parsed.success) {
    redirectWithMessage(returnTo, "Rapor nedeni en az 3 karakter olmalı.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    ...parsed.data,
    reporter_id: profile.id,
    status: "open",
  });

  if (error) {
    redirectWithMessage(returnTo, `Rapor gönderilemedi: ${error.message}`);
  }

  const activityTargetType = ["post", "event", "community"].includes(parsed.data.target_type)
    ? (parsed.data.target_type as "post" | "event" | "community")
    : "system";

  await recordActivity({
    action: "report_create",
    targetType: activityTargetType,
    targetId: activityTargetType === "system" ? null : parsed.data.target_id,
    path: returnTo,
    metadata: { reason: parsed.data.reason, target_type: parsed.data.target_type },
  });

  revalidatePath(returnTo);
  redirectWithMessage(returnTo, "Rapor admin ekibine iletildi.");
}

async function fallbackVotePost(
  postId: string,
  userId: string,
  direction: 1 | -1,
  returnTo: string,
) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("post_votes")
    .select("id,direction")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.direction === direction) {
    const { error } = await supabase.from("post_votes").delete().eq("id", existing.id);
    if (error) {
      redirectWithMessage(returnTo, `Oy kaldırılamadı: ${error.message}`);
    }
    return;
  }

  const { error } = await supabase.from("post_votes").upsert(
    {
      post_id: postId,
      user_id: userId,
      direction,
    },
    { onConflict: "post_id,user_id" },
  );

  if (error) {
    redirectWithMessage(returnTo, `Oy kaydedilemedi: ${error.message}`);
  }
}
