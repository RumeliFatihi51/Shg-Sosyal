import { normalizeRole } from "../shared";

export function requireMobileAdmin(profile: Record<string, unknown>) {
  if (normalizeRole(String(profile.role)) !== "admin") {
    throw new Error("Bu işlem için admin yetkisi gerekiyor.");
  }
}

export function approvalItem(row: Record<string, unknown>, subtitle: string) {
  return {
    id: row.id,
    title: row.title ?? row.name ?? "Kayıt",
    subtitle,
  };
}

export function adminListParams(searchParams: URLSearchParams) {
  const q = (searchParams.get("q") ?? "").replace(/[%,()]/g, "").trim();
  const role = (searchParams.get("role") ?? "").trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(10, Number(searchParams.get("limit") ?? 25)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { q, role, page, limit, from, to };
}
