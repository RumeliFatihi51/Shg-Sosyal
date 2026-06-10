import { normalizeRole, type SupabaseClientLike } from "../shared";

export async function ensureCanPostInCommunity(
  admin: SupabaseClientLike,
  profile: Record<string, unknown>,
  communityId: string,
) {
  const role = normalizeRole(String(profile.role));
  if (role === "admin" || role === "teacher") return;

  const { data: membership } = await admin
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", String(profile.id))
    .maybeSingle();

  if (!membership) {
    throw new Error("Bu toplulukta paylaşım yapmak için önce topluluğa katılmalısın.");
  }
}

export function validatePostInput(body: Record<string, unknown>) {
  const communityId = String(body.community_id ?? "");
  const content = String(body.content ?? "").trim();

  if (!communityId) throw new Error("Paylaşım için topluluk seçmelisin.");
  if (content.length < 2) throw new Error("Paylaşım metni çok kısa.");

  return { communityId, content };
}

export function validatePollInput(body: Record<string, unknown>) {
  const communityId = String(body.community_id ?? "");
  const question = String(body.question ?? "").trim();
  const options = Array.isArray(body.options)
    ? body.options.map((item) => String(item).trim()).filter((item) => item.length >= 2)
    : [];

  if (!communityId) throw new Error("Anket için topluluk seçmelisin.");
  if (question.length < 3) throw new Error("Anket sorusu çok kısa.");
  if (options.length < 2) throw new Error("En az iki seçenek gerekli.");

  return { communityId, question, options };
}
