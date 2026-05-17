import Link from "next/link";
import type { ReactNode } from "react";
import { Inbox, Send, UserCheck } from "lucide-react";
import {
  cancelFriendRequestAction,
  removeFriendAction,
  respondFriendRequestAction,
} from "@/lib/actions/profile";
import { getFriendsData } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";
import { Avatar, Button, Card, EmptyState, LinkButton } from "@/components/ui";
import { fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

const tabs = [
  { key: "friends", label: "Arkadaşlar", icon: UserCheck },
  { key: "requests", label: "Gelen istekler", icon: Inbox },
  { key: "sent", label: "Gönderilen", icon: Send },
] as const;

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const query = await searchParams;
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="space-y-4 text-center">
          <UserCheck className="mx-auto size-10 text-[#f05a28]" />
          <h1 className="text-2xl font-black text-slate-950">Arkadaşlarını görmek için giriş yap</h1>
          <p className="text-sm leading-6 text-slate-600">
            Arkadaşlık istekleri ve arkadaş katılım vurgusu okul hesabına bağlı çalışır.
          </p>
          <LinkButton href="/login">Giriş yap</LinkButton>
        </Card>
      </div>
    );
  }

  const data = await getFriendsData();
  const activeTab = tabs.some((tab) => tab.key === query.tab) ? query.tab : "friends";

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[var(--border-soft)] bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-slate-950">Arkadaşlar</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Kabul edilmiş arkadaşların etkinliklerde özel olarak vurgulanır.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <Link
                key={tab.key}
                href={`/friends?tab=${tab.key}`}
                className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-bold transition ${
                  isActive
                    ? "bg-[#f05a28] text-white"
                    : "border border-[var(--border-soft)] bg-white text-slate-700 hover:bg-orange-50"
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </section>

      {activeTab === "requests" ? (
        <FriendPanel title="Gelen istekler" count={data.received.length}>
          {data.received.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {data.received.map((item: any) => (
                <div key={item.id} className="rounded-md border border-[var(--border-soft)] bg-white p-4">
                  <Link
                    href={`/profile/${item.requester?.id}`}
                    className="flex items-center gap-2 font-semibold"
                  >
                    <Avatar
                      firstName={item.requester?.first_name}
                      lastName={item.requester?.last_name}
                      size="sm"
                    />
                    {fullName(item.requester)}
                  </Link>
                  <div className="mt-3 flex gap-2">
                    <form action={respondFriendRequestAction}>
                      <input type="hidden" name="friendship_id" value={item.id} />
                      <input type="hidden" name="status" value="accepted" />
                      <Button>Onayla</Button>
                    </form>
                    <form action={respondFriendRequestAction}>
                      <input type="hidden" name="friendship_id" value={item.id} />
                      <input type="hidden" name="status" value="rejected" />
                      <Button variant="secondary">Reddet</Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="İstek yok" body="Yeni arkadaşlık istekleri burada görünür." />
          )}
        </FriendPanel>
      ) : null}

      {activeTab === "sent" ? (
        <FriendPanel title="Gönderilen istekler" count={data.sent.length}>
          {data.sent.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {data.sent.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-[var(--border-soft)] bg-white p-4"
                >
                  <Link
                    href={`/profile/${item.receiver?.id}`}
                    className="flex items-center gap-2 font-semibold"
                  >
                    <Avatar
                      firstName={item.receiver?.first_name}
                      lastName={item.receiver?.last_name}
                      size="sm"
                    />
                    {fullName(item.receiver)}
                  </Link>
                  <form action={cancelFriendRequestAction}>
                    <input type="hidden" name="friendship_id" value={item.id} />
                    <input type="hidden" name="target_id" value={item.receiver?.id} />
                    <Button variant="secondary">İptal</Button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Bekleyen istek yok" body="Gönderdiğin istekler listelenir." />
          )}
        </FriendPanel>
      ) : null}

      {activeTab === "friends" ? (
        <FriendPanel title="Arkadaş listem" count={data.accepted.length}>
          {data.accepted.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.accepted.map((item: any) => {
                const friend =
                  item.requester_id === data.profile.id ? item.receiver : item.requester;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-[var(--border-soft)] bg-white p-4"
                  >
                    <Link
                      href={`/profile/${friend?.id}`}
                      className="flex min-w-0 items-center gap-2 font-semibold"
                    >
                      <Avatar
                        firstName={friend?.first_name}
                        lastName={friend?.last_name}
                        size="sm"
                      />
                      <span className="truncate">{fullName(friend)}</span>
                    </Link>
                    <form action={removeFriendAction}>
                      <input type="hidden" name="friendship_id" value={item.id} />
                      <input type="hidden" name="target_id" value={friend?.id} />
                      <Button variant="ghost">Çıkar</Button>
                    </form>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Liste boş" body="Arkadaşlarını profillerden ekleyebilirsin." />
          )}
        </FriendPanel>
      ) : null}
    </div>
  );
}

function FriendPanel({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-[#f05a28]">
          {count}
        </span>
      </div>
      {children}
    </Card>
  );
}
