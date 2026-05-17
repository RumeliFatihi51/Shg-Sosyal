import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminConfig } from "@/lib/env";

function isoDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "") ??
    request.nextUrl.searchParams.get("secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseAdminConfig()) {
    return NextResponse.json({ error: "Supabase admin env missing" }, { status: 500 });
  }

  const admin = createAdminClient();
  const today = isoDate(0);
  const tomorrow = isoDate(1);
  const [{ data: users }, { count: todayCount }, { data: tomorrowEvents }] =
    await Promise.all([
      admin.from("profiles").select("id"),
      admin
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
        .eq("event_date", today),
      admin
        .from("events")
        .select("id,title,event_participants(user_id)")
        .eq("status", "approved")
        .eq("event_date", tomorrow),
    ]);

  const notifications = (users ?? []).flatMap((user: { id: string }) => {
    const items = [];

    if (todayCount && todayCount > 0) {
      items.push({
        user_id: user.id,
        type: "daily_events",
        title: `Okulda bugün ${todayCount} etkinlik var`,
        body: "Ana sayfadan bugünün kampüs akışını inceleyebilirsin.",
        href: "/",
        digest_key: `daily-events:${today}`,
      });
    }

    (tomorrowEvents ?? []).forEach(
      (event: {
        id: string;
        title: string;
        event_participants?: { user_id: string }[];
      }) => {
        const isParticipant = event.event_participants?.some(
          (participant) => participant.user_id === user.id,
        );

        if (isParticipant) {
          items.push({
            user_id: user.id,
            type: "event_reminder",
            title: "Katılacağın etkinlik yarın başlıyor",
            body: event.title,
            href: `/events/${event.id}`,
            digest_key: `event-reminder:${event.id}:${tomorrow}`,
          });
        }
      },
    );

    return items;
  });

  if (notifications.length) {
    await admin.from("notifications").upsert(notifications, {
      onConflict: "user_id,digest_key",
      ignoreDuplicates: true,
    });
  }

  return NextResponse.json({
    ok: true,
    inserted: notifications.length,
  });
}
