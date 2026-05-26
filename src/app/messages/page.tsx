import Link from "next/link";
import { MessageCircle, Search, UsersRound } from "lucide-react";
import { getConversations } from "@/features/messages/queries";
import { startDirectConversationAction } from "@/features/messages/actions";
import { getFriendsData } from "@/features/friends/queries";
import { Avatar, LinkButton } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import {
  InlineEmpty,
  RailItem,
  RailSection,
  SocialBadge,
  SocialPage,
  StickyPageHeader,
  TimelineRow,
  TimelineSurface,
} from "@/components/social-ui";
import { fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const [{ conversations }, friendsData] = await Promise.all([
    getConversations(),
    getFriendsData(),
  ]);

  return (
    <SocialPage
      rail={
        <>
          <RailSection title="Mesajlaşma">
            <RailItem title={`${conversations.length} konuşma`} meta="Birebir sohbetler" icon={MessageCircle} />
            <RailItem title={`${friendsData.accepted.length} arkadaş`} meta="Mesaj başlatılabilir" icon={UsersRound} />
          </RailSection>
          <RailSection title="Arkadaşlardan başlat">
            {friendsData.accepted.slice(0, 5).map((friendship) => {
              const friend =
                friendship.requester_id === friendsData.profile.id
                  ? friendship.receiver
                  : friendship.requester;

              if (!friend) return null;

              return (
                <form key={friendship.id} action={startDirectConversationAction} className="flex items-center gap-3 px-4 py-3">
                  <input type="hidden" name="user_id" value={friend.id} />
                  <input type="hidden" name="return_to" value="/messages" />
                  <Avatar firstName={friend.first_name} lastName={friend.last_name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-[var(--foreground)]">{fullName(friend)}</span>
                    <span className="block truncate text-xs text-[var(--muted)]">{friend.tag ?? friend.username}</span>
                  </span>
                  <SubmitButton variant="secondary" pendingLabel="Açılıyor..." className="h-8 px-3">
                    Yaz
                  </SubmitButton>
                </form>
              );
            })}
            {!friendsData.accepted.length ? (
              <RailItem title="Önce arkadaş ekle." meta="DM yalnız arkadaşlar arasında." href="/friends" icon={Search} />
            ) : null}
          </RailSection>
        </>
      }
    >
      <StickyPageHeader title="Mesajlar" subtitle="Arkadaşlarınla birebir sohbetler." />

      <TimelineSurface>
        {conversations.length ? (
          conversations.map((conversation) => (
            <TimelineRow
              key={conversation.conversation_id}
              avatar={<Avatar firstName={conversation.other_first_name} lastName={conversation.other_last_name} size="md" />}
              title={fullName({
                first_name: conversation.other_first_name,
                last_name: conversation.other_last_name,
              })}
              meta={conversation.other_tag ?? conversation.other_username ?? ""}
              badge={conversation.unread_count ? <SocialBadge tone="blue">{conversation.unread_count} yeni</SocialBadge> : null}
              body={conversation.last_message_content ?? "Henüz mesaj yok."}
              href={`/messages/${conversation.conversation_id}`}
            />
          ))
        ) : (
          <InlineEmpty
            title="Henüz konuşma yok"
            body="Arkadaşlarından biriyle sohbet başlatabilirsin."
            action={<LinkButton href="/friends">Arkadaşlara bak</LinkButton>}
          />
        )}
      </TimelineSurface>

      <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-4 lg:hidden">
        <Link href="/friends" className="text-sm font-black text-[var(--accent)]">
          Arkadaşlardan konuşma başlat
        </Link>
      </div>
    </SocialPage>
  );
}
