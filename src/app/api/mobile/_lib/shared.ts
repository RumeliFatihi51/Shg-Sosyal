import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export type SupabaseClientLike = ReturnType<typeof createAdminClient>;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

export function response(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status, headers: corsHeaders });
}

export function errorResponse(error: unknown, status = 400) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "İşlem tamamlanamadı.";

  return NextResponse.json({ error: message }, { status, headers: corsHeaders });
}

export async function bodyJson(request: NextRequest) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function bearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
}

export function anonClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function userClient(accessToken: string) {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function normalizeRole(role: string | null | undefined) {
  if (role === "moderator") return "admin";
  if (role === "community_admin" || role === "teacher" || role === "admin") return role;
  return "student";
}

export function fullName(profile: Record<string, unknown>) {
  const firstName = String(profile.first_name ?? "").trim();
  const lastName = String(profile.last_name ?? "").trim();
  const explicit = String(profile.full_name ?? "").trim();
  return explicit || [firstName, lastName].filter(Boolean).join(" ").trim();
}

export function toTag(profile: Record<string, unknown>) {
  const tag = String(profile.tag ?? "").trim();
  const username = String(profile.username ?? "").trim();
  const fallback = String(profile.email ?? "ogrenci").split("@")[0] || "ogrenci";
  const value = tag || username || fallback;
  return value.startsWith("@") ? value : `@${value}`;
}

export function mobileUser(profile: Record<string, unknown> | null | undefined) {
  const safe = profile ?? {};
  return {
    id: String(safe.id ?? ""),
    first_name: safe.first_name ?? null,
    last_name: safe.last_name ?? null,
    full_name: fullName(safe) || toTag(safe).replace("@", ""),
    username: safe.username ?? toTag(safe).replace("@", ""),
    tag: toTag(safe),
    email: safe.email ?? "",
    class_name: safe.class_name ?? "",
    avatar_url: safe.avatar_url ?? safe.avatar_path ?? null,
    bio: safe.bio ?? null,
    points: Number(safe.participation_points ?? safe.total_points ?? 0),
    role: normalizeRole(String(safe.role ?? "student")),
    is_suspended: Boolean(safe.is_suspended ?? false),
    created_at: safe.created_at ?? null,
    last_seen_at: safe.last_seen_at ?? null,
  };
}

export function cleanUsername(value: unknown) {
  const input = String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replaceAll("ı", "i")
    .replace(/[^a-z0-9._]/g, "")
    .replace(/^[._]+|[._]+$/g, "");

  return input.length >= 3 ? input.slice(0, 24) : `ogrenci${Date.now().toString().slice(-4)}`;
}

export function splitName(value: unknown) {
  const parts = String(value ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] ?? "",
    last_name: parts.slice(1).join(" "),
  };
}

export async function getAuthenticatedProfile(request: NextRequest) {
  const accessToken = bearerToken(request);

  if (!accessToken) {
    throw new Error("Giriş yapman gerekiyor.");
  }

  const admin = createAdminClient();
  const { data: authData, error: authError } = await admin.auth.getUser(accessToken);

  if (authError || !authData.user) {
    throw new Error("Oturum geçersiz veya süresi dolmuş.");
  }

  const profileResult = await admin
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .maybeSingle();
  let profile = profileResult.data;

  if (profileResult.error) throw new Error(profileResult.error.message);

  if (!profile) {
    const username = cleanUsername(authData.user.email?.split("@")[0]);
    const names = splitName(authData.user.user_metadata?.full_name ?? authData.user.email?.split("@")[0]);
    const { data: inserted, error: insertError } = await admin
      .from("profiles")
      .upsert({
        id: authData.user.id,
        ...names,
        username,
        tag: `@${username}`,
        email: authData.user.email,
        role: "student",
      })
      .select("*")
      .single();

    if (insertError) throw new Error(insertError.message);
    profile = inserted;
  }

  return {
    accessToken,
    client: userClient(accessToken),
    admin,
    user: authData.user,
    profile: profile as Record<string, unknown>,
  };
}

export async function getOptionalProfile(request: NextRequest) {
  try {
    return await getAuthenticatedProfile(request);
  } catch {
    return null;
  }
}
