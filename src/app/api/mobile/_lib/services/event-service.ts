export function startsAtIso(event: Record<string, unknown>) {
  const date = String(event.event_date ?? "").slice(0, 10);
  const time = String(event.start_time ?? "00:00:00");
  const iso = date ? `${date}T${time}` : String(event.created_at ?? new Date().toISOString());
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function eventCategory(event: Record<string, unknown>) {
  const text = `${event.title ?? ""} ${event.description ?? ""}`.toLocaleLowerCase("tr-TR");
  if (/basket|futbol|spor|turnuva|koşu/.test(text)) return "sport";
  if (/atölye|workshop|laboratuvar|kod|robot/.test(text)) return "workshop";
  if (/yarışma|final|müsabaka/.test(text)) return "competition";
  if (/bilim|yapay zeka|fizik|kimya/.test(text)) return "science";
  if (/müzik|tiyatro|sahne|sanat/.test(text)) return "art";
  return "club";
}

export function validateParticipationStatus(value: unknown) {
  const status = String(value ?? "going");
  if (!["going", "interested", "not_going"].includes(status)) {
    throw new Error("Geçersiz katılım durumu.");
  }
  return status;
}
