"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  auditLog,
  formFile,
  formString,
  notifyUser,
  redirectWithMessage,
  requireCommunityManager,
  uploadImage,
} from "@/lib/actions/shared";
import { isMissingRpc, notifyAcceptedFriends, recordActivity } from "@/lib/activity";
import { requireProfile } from "@/lib/session";
import { communitySchema, postSchema } from "@/lib/validators/forms";
import { slugify } from "@/lib/utils";
import { awardPoints } from "@/features/rewards/actions";

function displayName(profile: { first_name?: string | null; last_name?: string | null }) {
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Bir arkadaşın";
}

export async function createCommunityAction(formData: FormData) {
  const profile = await requireProfile();
  const returnTo = formString(formData, "return_to") || "/communities";
  const parsed = communitySchema.safeParse({
    name: formString(formData, "name"),
    description: formString(formData, "description"),
  });

  if (!parsed.success) {
    const reason = parsed.error.issues[0]?.message ?? "Topluluk bilgileri eksik.";
    redirectWithMessage(returnTo, `Topluluk bilgileri eksik: ${reason}`);
  }

  let imagePath: string | null = null;
  try {
    imagePath = await uploadImage(
      "community-images",
      `communities/${profile.id}`,
      formFile(formData, "image"),
    );
  } catch (error) {
    redirectWithMessage(
      returnTo,
      `Görsel yüklenemedi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
    );
  }

  const slugBase = slugify(parsed.data.name) || "topluluk";
  const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
  const communityId = await createCommunityWithOwner({
    name: parsed.data.name,
    description: parsed.data.description,
    slug,
    imagePath,
    returnTo,
  });

  if (communityId) {
    await Promise.all([
      auditLog({
        actorId: profile.id,
        action: "community.create_pending",
        targetType: "community",
        targetId: communityId,
      }),
      recordActivity({
        action: "community_create",
        targetType: "community",
        targetId: communityId,
        path: "/communities",
      }),
    ]);
  }

  revalidatePath("/communities");
  revalidatePath(returnTo);
  redirectWithMessage(returnTo, "Topluluk başvurun admin onayına gönderildi.");
}

export async function joinCommunityAction(formData: FormData) {
  const profile = await requireProfile();
  const communityId = formString(formData, "community_id");
  const slug = formString(formData, "slug");
  const supabase = await createClient();

  const { error } = await supabase.from("community_members").upsert(
    {
      community_id: communityId,
      user_id: profile.id,
      role: "member",
    },
    { onConflict: "community_id,user_id" },
  );

  if (error) {
    redirectWithMessage(`/communities/${slug}`, `Topluluğa katılamadı: ${error.message}`);
  }

  await recordActivity({
    action: "community_join",
    targetType: "community",
    targetId: communityId,
    path: `/communities/${slug}`,
  });
  await awardPoints({
    userId: profile.id,
    actionType: "community_join",
    targetType: "community",
    targetId: communityId,
  });

  revalidatePath(`/communities/${slug}`);
  redirectWithMessage(`/communities/${slug}`, "Topluluğa katıldın.");
}

export async function leaveCommunityAction(formData: FormData) {
  const profile = await requireProfile();
  const communityId = formString(formData, "community_id");
  const slug = formString(formData, "slug");
  const supabase = await createClient();

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", profile.id)
    .neq("role", "admin");

  if (error) {
    redirectWithMessage(`/communities/${slug}`, `Üyelikten çıkılamadı: ${error.message}`);
  }

  await recordActivity({
    action: "community_leave",
    targetType: "community",
    targetId: communityId,
    path: `/communities/${slug}`,
  });

  revalidatePath(`/communities/${slug}`);
  redirectWithMessage(`/communities/${slug}`, "Üyelikten ayrıldın.");
}

export async function followCommunityAction(formData: FormData) {
  const profile = await requireProfile();
  const communityId = formString(formData, "community_id");
  const slug = formString(formData, "slug");
  const supabase = await createClient();

  const { error } = await supabase.from("community_followers").upsert(
    {
      community_id: communityId,
      user_id: profile.id,
    },
    { onConflict: "community_id,user_id" },
  );

  if (error) {
    redirectWithMessage(`/communities/${slug}`, `Takip edilemedi: ${error.message}`);
  }

  await recordActivity({
    action: "community_follow",
    targetType: "community",
    targetId: communityId,
    path: `/communities/${slug}`,
  });

  revalidatePath(`/communities/${slug}`);
  redirectWithMessage(`/communities/${slug}`, "Topluluk takip edildi.");
}

export async function unfollowCommunityAction(formData: FormData) {
  const profile = await requireProfile();
  const communityId = formString(formData, "community_id");
  const slug = formString(formData, "slug");
  const supabase = await createClient();

  const { error } = await supabase
    .from("community_followers")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", profile.id);

  if (error) {
    redirectWithMessage(`/communities/${slug}`, `Takip kaldırılamadı: ${error.message}`);
  }

  await recordActivity({
    action: "community_unfollow",
    targetType: "community",
    targetId: communityId,
    path: `/communities/${slug}`,
  });

  revalidatePath(`/communities/${slug}`);
  redirectWithMessage(`/communities/${slug}`, "Takip kaldırıldı.");
}

export async function createPostAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = postSchema.safeParse({
    community_id: formString(formData, "community_id"),
    title: formString(formData, "title"),
    body: formString(formData, "body"),
  });
  const slug = formString(formData, "slug");
  const returnTo =
    formString(formData, "return_to") || (slug ? `/communities/${slug}` : "/posts");

  if (!parsed.success) {
    const reason = parsed.error.issues[0]?.message ?? "Gönderi bilgileri eksik.";
    redirectWithMessage(returnTo, `Gönderi paylaşılamadı: ${reason}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      ...parsed.data,
      author_id: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    redirectWithMessage(returnTo, `Gönderi paylaşılamadı: ${error.message}`);
  }

  const { data: members } = await supabase
    .from("community_members")
    .select("user_id")
    .eq("community_id", parsed.data.community_id)
    .neq("user_id", profile.id)
    .limit(40);

  await Promise.all([
    ...(members ?? []).map((member: { user_id: string }) =>
      notifyUser({
        userId: member.user_id,
        type: "community_post",
        title: "Takip ettiğin topluluk yeni gönderi paylaştı",
        body: parsed.data.title,
        href: data ? `/posts/${data.id}` : returnTo,
        digestKey: data
          ? `community-post:${parsed.data.community_id}:${data.id}:${member.user_id}`
          : null,
      }),
    ),
    data
      ? notifyAcceptedFriends({
          actorId: profile.id,
          type: "friend_post",
          title: `${displayName(profile)} yeni bir gönderi paylaştı`,
          body: parsed.data.title,
          href: `/posts/${data.id}`,
          digestPrefix: `friend-post:${data.id}`,
        })
      : Promise.resolve(),
    data
      ? recordActivity({
          action: "post_create",
          targetType: "post",
          targetId: data.id,
          path: `/posts/${data.id}`,
          metadata: { community_id: parsed.data.community_id },
        })
      : Promise.resolve(),
    data
      ? awardPoints({
          userId: profile.id,
          actionType: "post_create",
          targetType: "post",
          targetId: data.id,
          metadata: { community_id: parsed.data.community_id },
        })
      : Promise.resolve(0),
    data
      ? auditLog({
          actorId: profile.id,
          action: "post.create",
          targetType: "post",
          targetId: data.id,
          metadata: { community_id: parsed.data.community_id },
        })
      : Promise.resolve(),
  ]);

  revalidatePath("/");
  revalidatePath(returnTo);
  revalidatePath("/posts");
  redirect(data ? `/posts/${data.id}` : returnTo);
}

export async function ensureCanCreateForCommunity(communityId: string) {
  return requireCommunityManager(communityId);
}

async function createCommunityWithOwner(input: {
  name: string;
  description: string;
  slug: string;
  imagePath: string | null;
  returnTo: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_community_with_owner", {
    p_name: input.name,
    p_slug: input.slug,
    p_description: input.description,
    p_image_path: input.imagePath,
  });

  if (!error) {
    return data as string;
  }

  if (!isMissingRpc(error)) {
    redirectWithMessage(input.returnTo, `Topluluk oluşturulamadı: ${error.message}`);
  }

  return fallbackCreateCommunityWithOwner(input);
}

async function fallbackCreateCommunityWithOwner(input: {
  name: string;
  description: string;
  slug: string;
  imagePath: string | null;
  returnTo: string;
}) {
  const profile = await requireProfile();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("communities")
    .insert({
      name: input.name,
      description: input.description,
      slug: input.slug,
      image_path: input.imagePath,
      created_by: profile.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    redirectWithMessage(input.returnTo, `Topluluk oluşturulamadı: ${error.message}`);
  }

  const { error: memberError } = await admin.from("community_members").insert({
    community_id: data.id,
    user_id: profile.id,
    role: "admin",
  });

  if (memberError) {
    redirectWithMessage(
      input.returnTo,
      `Topluluk oluşturuldu ama kurucu üyeliği eklenemedi: ${memberError.message}`,
    );
  }

  return data.id as string;
}
