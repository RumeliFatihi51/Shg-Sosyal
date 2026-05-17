import { cache } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";
import { hasSupabaseAdminConfig, hasSupabaseConfig } from "@/lib/env";

const roleRank: Record<UserRole, number> = {
  student: 0,
  community_admin: 1,
  teacher: 2,
  moderator: 3,
  admin: 4,
};

export const getCurrentUser = cache(async () => {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const shouldBeAdmin =
    Boolean(process.env.ADMIN_EMAIL) &&
    user.email?.toLocaleLowerCase("tr") ===
      process.env.ADMIN_EMAIL?.toLocaleLowerCase("tr");

  if (existing) {
    if (
      shouldBeAdmin &&
      existing.role !== "admin" &&
      hasSupabaseAdminConfig()
    ) {
      const admin = createAdminClient();
      const { data } = await admin
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", user.id)
        .select("*")
        .single<Profile>();

      return data ?? { ...existing, role: "admin" as const };
    }

    return existing;
  }

  const profileDraft = {
    id: user.id,
    first_name: String(user.user_metadata?.first_name ?? ""),
    last_name: String(user.user_metadata?.last_name ?? ""),
    class_name: String(user.user_metadata?.class_name ?? ""),
    school_number: String(user.user_metadata?.school_number ?? ""),
    interests: [],
    role: shouldBeAdmin ? "admin" : "student",
  };

  if (shouldBeAdmin && hasSupabaseAdminConfig()) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .upsert(profileDraft, { onConflict: "id" })
      .select("*")
      .single<Profile>();

    return data;
  }

  const { data } = await supabase
    .from("profiles")
    .upsert({ ...profileDraft, role: "student" }, { onConflict: "id" })
    .select("*")
    .single<Profile>();

  return data;
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.email_confirmed_at) {
    redirect("/login?message=Devam etmek için e-posta adresini doğrulamalısın.");
  }

  return user;
}

export async function requireProfile() {
  await requireUser();
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.is_suspended) {
    redirect(`/login?message=Hesabın askıya alınmış: ${encodeURIComponent(profile.suspension_reason ?? "Yönetimle iletişime geç.")}`);
  }

  return profile;
}

export async function requireRole(roles: UserRole[]) {
  const profile = await requireProfile();

  if (!roles.includes(profile.role)) {
    redirect("/");
  }

  return profile;
}

export function hasMinimumRole(profile: Profile | null, role: UserRole) {
  if (!profile) {
    return false;
  }

  return roleRank[profile.role] >= roleRank[role];
}

export function isAdminOrModerator(profile: Profile | null) {
  return Boolean(profile && ["admin", "moderator"].includes(profile.role));
}

export function canPublishWithoutApproval(profile: Profile | null) {
  return Boolean(profile && ["admin", "moderator", "teacher"].includes(profile.role));
}
