import { clsx, type ClassValue } from "clsx";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function initials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.trim().charAt(0) ?? "";
  const last = lastName?.trim().charAt(0) ?? "";
  const value = `${first}${last}`.toLocaleUpperCase("tr");

  return value || "Ş";
}

export function fullName(profile?: {
  first_name?: string | null;
  last_name?: string | null;
}) {
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  return name || "ŞHG Sosyal kullanıcısı";
}

export function formatDate(date: string) {
  const parsed = parseISO(date);

  if (isToday(parsed)) {
    return "Bugün";
  }

  if (isTomorrow(parsed)) {
    return "Yarın";
  }

  return format(parsed, "d MMMM EEEE", { locale: tr });
}

export function formatTime(time?: string | null) {
  if (!time) {
    return "";
  }

  return time.slice(0, 5);
}

export function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function toInterests(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function getFileExtension(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();

  return ext ? `.${ext}` : "";
}
