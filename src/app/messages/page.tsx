import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";
import { getConversations } from "@/features/messages/queries";
import { startDirectConversationAction } from "@/features/messages/actions";
import { getFriendsData } from "@/features/friends/queries";
import { Avatar, Button, Card, EmptyState, LinkButton } from "@/components/ui";
import { fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const [{ conversations }, friendsData] = await Promise.all([
    getConversations(),
    getFriendsData(),
  ]);

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="sticky top-16 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:top-0">
          <h1 className="text-xl font-black text-slate-950">Mesajlar</h1>
          <p className="mt-1 text-sm text-slate-500">Arkadaşlarınla birebir konuşmalar.</p>
        </div>

        {conversations.length ? (
          <div className="divide-y divide-slate-100">
            {conversations.map((conversation) => (
              <Link
                key={conversation.conversation_id}
                href={`/messages/${conversation.conversation_id}`}
                className="flex gap-3 px-5 py-4 transition hover:bg-slate-50"
              >
                <Avatar
                  firstName={conversation.other_first_name}
                  lastName={conversation.other_last_name}
                  size="md"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate font-bold text-slate-950">
                      {fullName({
                        first_name: conversation.other_first_name,
                        last_name: conversation.other_last_name,
                      })}
                    </span>
                    {conversation.unread_count ? (
                      <span className="rounded-full bg-slate-950 px-2 py-0.5 text-xs font-black text-white">
                        {conversation.unread_count}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block truncate text-sm text-slate-500">
                    {conversation.last_message_content ?? "Henüz mesaj yok."}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              title="Henüz konuşma yok"
              body="Arkadaşlarından biriyle sohbet başlatabilirsin."
              icon={<MessageCircle className="size-5" />}
            />
          </div>
        )}
      </section>

      <Card className="h-fit space-y-4">
        <div className="flex items-center gap-2">
          <Search className="size-5 text-slate-500" />
          <h2 className="text-lg font-black text-slate-950">Arkadaşlardan başlat</h2>
        </div>
        {friendsData.accepted.length ? (
          <div className="grid gap-2">
            {friendsData.accepted.slice(0, 10).map((friendship) => {
              const friend =
                friendship.requester_id === friendsData.profile.id
                  ? friendship.receiver
                  : friendship.requester;

              if (!friend) {
                return null;
              }

              return (
                <form
                  key={friendship.id}
                  action={startDirectConversationAction}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3"
                >
                  <input type="hidden" name="user_id" value={friend.id} />
                  <input type="hidden" name="return_to" value="/messages" />
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar firstName={friend.first_name} lastName={friend.last_name} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{fullName(friend)}</span>
                      <span className="block truncate text-xs text-slate-500">{friend.tag ?? friend.username}</span>
                    </span>
                  </span>
                  <Button variant="secondary" className="h-9 px-3">
                    Yaz
                  </Button>
                </form>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p>Mesaj başlatmak için önce arkadaş ekle.</p>
            <LinkButton href="/friends" variant="secondary" className="h-9">
              Arkadaşlar
            </LinkButton>
          </div>
        )}
      </Card>
    </div>
  );
}
