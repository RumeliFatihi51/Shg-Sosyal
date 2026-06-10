import {
  mobileUser,
  type SupabaseClientLike,
} from "../shared";

type MobileSession = {
  admin: SupabaseClientLike;
  user: { id: string };
};

export async function searchCommunityUsers(session: MobileSession, query: string) {
  const q = query.trim().replace(/^@/, "").replace(/[%,()]/g, "");

  if (q.length < 2) return [];

  const { data, error } = await session.admin
    .from("profiles")
    .select(
      "id,first_name,last_name,full_name,username,tag,email,class_name,avatar_url,avatar_path,bio,role,participation_points",
    )
    .neq("id", session.user.id)
    .or(
      `username.ilike.%${q}%,tag.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,full_name.ilike.%${q}%`,
    )
    .limit(12);

  if (error) throw new Error(error.message);

  return ((data ?? []) as Record<string, unknown>[]).map(mobileUser);
}

export async function joinCommunity(session: MobileSession, communityId: string) {
  const { data: community, error: communityError } = await session.admin
    .from("communities")
    .select("id,status")
    .eq("id", communityId)
    .maybeSingle();

  if (communityError) throw new Error(communityError.message);
  if (!community) throw new Error("Topluluk bulunamadı.");
  if (String(community.status) !== "approved") {
    throw new Error("Sadece onaylı topluluklara katılabilirsin.");
  }

  const { error } = await session.admin
    .from("community_members")
    .upsert(
      {
        community_id: communityId,
        user_id: session.user.id,
        role: "member",
      },
      { onConflict: "community_id,user_id" },
    );

  if (error) throw new Error(error.message);
}

export async function leaveCommunity(session: MobileSession, communityId: string) {
  const { data: membership, error: membershipError } = await session.admin
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (membershipError) throw new Error(membershipError.message);
  if (String(membership?.role ?? "") === "admin") {
    throw new Error("Topluluk yöneticisi topluluktan ayrılamaz.");
  }

  const { error } = await session.admin
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", session.user.id);

  if (error) throw new Error(error.message);
}
