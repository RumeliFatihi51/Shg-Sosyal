import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import type { AdminUserRow, PublicUser } from "@/features/users/types";

export function normalizeUsernameInput(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/^@+/, "")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replaceAll("ı", "i")
    .replace(/[^a-z0-9._]+/g, "")
    .replace(/[._]{2,}/g, ".")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 24);
}

function searchToken(value: string) {
  return value.trim().replace(/[,%]/g, " ").replace(/\s+/g, " ").slice(0, 80);
}

export async function searchUsersByTag(query: string) {
  const profile = await requireProfile();
  const normalized = normalizeUsernameInput(query);
  const raw = searchToken(query);

  if (normalized.length < 2) {
    return [] as PublicUser[];
  }

  const supabase = await createClient();
  const [{ data: users }, { data: blocked }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,first_name,last_name,class_name,avatar_path,username,tag,bio")
      .or(`username.ilike.%${normalized}%,tag.ilike.%${normalized}%,first_name.ilike.%${raw}%,last_name.ilike.%${raw}%`)
      .neq("id", profile.id)
      .or("is_suspended.eq.false,is_suspended.is.null")
      .limit(12),
    supabase
      .from("friendships")
      .select("requester_id,receiver_id,status")
      .eq("status", "blocked")
      .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`),
  ]);

  const blockedIds = new Set(
    (blocked ?? []).map((row: any) =>
      row.requester_id === profile.id ? row.receiver_id : row.requester_id,
    ),
  );

  return ((users ?? []) as PublicUser[]).filter((user) => !blockedIds.has(user.id));
}

export async function getAdminUsers({
  q = "",
  role = "",
  page = 1,
  pageSize = 25,
}: {
  q?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}) {
  const admin = createAdminClient();
  const from = Math.max(0, page - 1) * pageSize;
  const to = from + pageSize - 1;
  const raw = searchToken(q);
  let request = admin
    .from("profiles")
    .select("id,first_name,last_name,class_name,school_number,username,tag,email,bio,avatar_path,role,is_suspended,suspension_reason,participation_points,last_seen_at,created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (role) {
    request = request.eq("role", role);
  }

  const normalized = normalizeUsernameInput(q);
  if (normalized || raw) {
    request = request.or(
      `username.ilike.%${normalized}%,tag.ilike.%${normalized}%,first_name.ilike.%${raw}%,last_name.ilike.%${raw}%,email.ilike.%${raw}%,class_name.ilike.%${raw}%`,
    );
  }

  const { data, count } = await request;

  return {
    users: (data ?? []) as AdminUserRow[],
    count: count ?? 0,
    page,
    pageSize,
  };
}
