import Link from "next/link";
import { ArrowLeft, SendHorizonal, Trash2 } from "lucide-react";
import { MessagesRealtime } from "@/components/messages-realtime";
import { Avatar, Button, Card, TextArea } from "@/components/ui";
import { deleteMessageAction, sendMessageAction } from "@/features/messages/actions";
import { getConversation } from "@/features/messages/queries";
import { cn, fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, conversation } = await getConversation(id);

  return (
    <div className="mx-auto max-w-3xl">
      <MessagesRealtime conversationId={conversation.id} />
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="sticky top-16 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:top-0">
          <Link
            href="/messages"
            className="inline-flex size-10 items-center justify-center rounded-full hover:bg-slate-100"
            aria-label="Mesajlara dön"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <Avatar
            firstName={conversation.otherUser?.first_name}
            lastName={conversation.otherUser?.last_name}
            size="sm"
          />
          <div className="min-w-0">
            <h1 className="truncate text-base font-black text-slate-950">
              {fullName(conversation.otherUser ?? undefined)}
            </h1>
            <p className="truncate text-xs text-slate-500">
              {conversation.otherUser?.tag ?? conversation.otherUser?.username ?? "ŞHG Sosyal"}
            </p>
          </div>
        </div>

        <div className="min-h-[52vh] space-y-3 px-4 py-5">
          {conversation.messages.length ? (
            conversation.messages.map((message) => {
              const own = message.sender_id === profile.id;

              return (
                <div
                  key={message.id}
                  className={cn("flex gap-2", own ? "justify-end" : "justify-start")}
                >
                  {!own ? (
                    <Avatar
                      firstName={message.sender?.first_name}
                      lastName={message.sender?.last_name}
                      size="sm"
                    />
                  ) : null}
                  <div className={cn("max-w-[78%] space-y-1", own && "items-end text-right")}>
                    <div
                      className={cn(
                        "rounded-3xl px-4 py-2 text-sm leading-6",
                        own ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900",
                      )}
                    >
                      {message.deleted_at ? "Bu mesaj silindi." : message.content}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{new Date(message.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                      {message.edited_at && !message.deleted_at ? <span>düzenlendi</span> : null}
                      {own && !message.deleted_at ? (
                        <form action={deleteMessageAction}>
                          <input type="hidden" name="message_id" value={message.id} />
                          <input type="hidden" name="conversation_id" value={conversation.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="size-3" />
                            Sil
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <Card className="mx-auto max-w-md text-center">
              <p className="text-sm text-slate-600">Henüz mesaj yok. İlk mesajı yazabilirsin.</p>
            </Card>
          )}
        </div>

        <form action={sendMessageAction} className="border-t border-slate-200 bg-slate-50/70 p-3">
          <input type="hidden" name="conversation_id" value={conversation.id} />
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <TextArea
                label="Mesaj"
                name="content"
                rows={2}
                placeholder="Mesaj yaz..."
                required
              />
            </div>
            <Button className="mb-0 h-11 px-4">
              <SendHorizonal className="size-4" />
              Gönder
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
