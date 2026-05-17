import Link from "next/link";
import { Bell } from "lucide-react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/notifications";
import { getNotificationsData } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";
import { Badge, Button, Card, EmptyState, LinkButton } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="space-y-4 text-center">
          <Bell className="mx-auto size-10 text-[#f05a28]" />
          <h1 className="text-2xl font-black text-slate-950">Bildirimler için giriş yap</h1>
          <p className="text-sm leading-6 text-slate-600">
            Site içi bildirimler hesabına özel tutulur.
          </p>
          <LinkButton href="/login">Giriş yap</LinkButton>
        </Card>
      </div>
    );
  }

  const { notifications } = await getNotificationsData();
  const unread = notifications.filter((item) => !item.read_at).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Bildirimler</h1>
          <p className="mt-2 text-sm text-slate-600">
            Site içi bildirimler; push notification bu sürümde yok.
          </p>
        </div>
        {unread ? (
          <form action={markAllNotificationsReadAction}>
            <Button variant="secondary">Tümünü okundu yap</Button>
          </form>
        ) : null}
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Bell className="size-5 text-slate-600" />
          <span className="font-bold text-slate-950">{unread} okunmamış</span>
        </div>
        {notifications.length ? (
          <div className="grid gap-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex flex-col gap-3 rounded-md border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-slate-950">{notification.title}</h2>
                    {!notification.read_at ? <Badge tone="blue">yeni</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {notification.body}
                  </p>
                </div>
                <div className="flex gap-2">
                  {notification.href ? (
                    <Link
                      href={notification.href}
                      className="inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Aç
                    </Link>
                  ) : null}
                  {!notification.read_at ? (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="notification_id" value={notification.id} />
                      <input type="hidden" name="href" value="/notifications" />
                      <Button variant="secondary">Okundu</Button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Bildirim yok"
            body="Topluluk, etkinlik ve yorum bildirimleri burada toplanır."
          />
        )}
      </Card>
    </div>
  );
}
