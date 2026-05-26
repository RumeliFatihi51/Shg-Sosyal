import Link from "next/link";
import { ArrowLeft, SendHorizonal, Trash2 } from "lucide-react";
import { MessagesRealtime } from "@/components/messages-realtime";
import { Avatar, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { deleteMessageAction, sendMessageAction } from "@/features/messages/actions";
import { getConversation } from "@/features/messages/queries";
import {
  InlineEmpty,
  RailItem,
  RailSection,
  SocialPage,
  StickyPageHeader,
} from "@/components/social-ui";
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
    <SocialPage
      rail={
        <>
          <RailSection title="Konuşma">
            <RailItem
              title={fullName(conversation.otherUser ?? undefined)}
              meta={conversation.otherUser?.tag ?? conversation.otherUser?.username ?? "ŞHG Sosyal"}
              href={conversation.otherUser ? `/profile/${conversation.otherUser.id}` : undefined}
              icon={SendHorizonal}
            />
            <RailItem title={`${conversation.messages.length} mesaj`} meta="Son yüklenenler" icon={SendHorizonal} />
          </RailSection>
          <RailSection title="Kısa yollar">
            <RailItem title="Mesajlara dön" href="/messages" icon={ArrowLeft} />
            {conversation.otherUser ? (
              <RailItem title="Profili aç" href={`/profile/${conversation.otherUser.id}`} icon={SendHorizonal} />
            ) : null}
          </RailSection>
        </>
      }
    >
      <MessagesRealtime conversationId={conversation.id} />
      <StickyPageHeader
        title={fullName(conversation.otherUser ?? undefined)}
        subtitle={conversation.otherUser?.tag ?? conversation.otherUser?.username ?? "ŞHG Sosyal"}
        action={
          <Link
            href="/messages"
            className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100"
            aria-label="Mesajlara dön"
          >
            <ArrowLeft className="size-5" />
          </Link>
        }
      />

      <section className="flex min-h-[68vh] flex-col bg-white">
        <div className="flex-1 space-y-3 px-4 py-5">
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
                        own ? "bg-cyan-400 text-slate-950" : "bg-slate-100 text-slate-900",
                      )}
                    >
                      {message.deleted_at ? "Bu mesaj silindi." : message.content}
                    </div>
                    <div className={cn("flex items-center gap-2 text-[11px] text-slate-400", own && "justify-end")}>
                      <span>{new Date(message.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                      {message.edited_at && !message.deleted_at ? <span>düzenlendi</span> : null}
                      {own && !message.deleted_at ? (
                        <form action={deleteMessageAction}>
                          <input type="hidden" name="message_id" value={message.id} />
                          <input type="hidden" name="conversation_id" value={conversation.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-red-500"
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
            <InlineEmpty title="Henüz mesaj yok" body="İlk mesajı yazabilirsin." />
          )}
        </div>

        <form action={sendMessageAction} className="sticky bottom-0 border-t border-slate-200 bg-slate-50/90 p-3 backdrop-blur">
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
            <SubmitButton className="mb-0 h-11 px-4" pendingLabel="Gönderiliyor...">
              <SendHorizonal className="size-4" />
              Gönder
            </SubmitButton>
          </div>
        </form>
      </section>
    </SocialPage>
  );
}
