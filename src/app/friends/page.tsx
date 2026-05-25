import Link from "next/link";
import { Inbox, MessageCircle, Search, Send, UserCheck, UserPlus, UsersRound } from "lucide-react";
import {
  cancelFriendRequestAction,
  removeFriendAction,
  respondFriendRequestAction,
  sendFriendRequestAction,
} from "@/features/friends/actions";
import { startDirectConversationAction } from "@/features/messages/actions";
import { searchUsersByTag } from "@/features/users/queries";
import { getFriendsData } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";
import { Avatar, Button, LinkButton } from "@/components/ui";
import {
  InlineEmpty,
  PageTabs,
  RailItem,
  RailSection,
  SearchBox,
  SocialBadge,
  SocialPage,
  StickyPageHeader,
  TimelineRow,
  TimelineSurface,
} from "@/components/social-ui";
import { fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

const tabs = [
  { key: "friends", label: "Arkadaşlarım" },
  { key: "requests", label: "İstekler" },
  { key: "sent", label: "Gönderilenler" },
  { key: "suggested", label: "Önerilenler" },
] as const;

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const query = await searchParams;
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <SocialPage rail={<RailSection title="Arkadaşlar"><RailItem title="Giriş yap" meta="Arkadaşlarını ve isteklerini gör." icon={UsersRound} /></RailSection>}>
        <StickyPageHeader title="Arkadaşlar" />
        <TimelineSurface>
          <InlineEmpty
            title="Giriş yap"
            body="Giriş yapınca arkadaşlarının hareketlerini görebilirsin."
            action={<LinkButton href="/login">Giriş yap</LinkButton>}
          />
        </TimelineSurface>
      </SocialPage>
    );
  }

  const data = await getFriendsData();
  const searchResults = query.q ? await searchUsersByTag(query.q) : [];
  const activeTab = tabs.some((tab) => tab.key === query.tab) ? query.tab! : "friends";

  return (
    <SocialPage
      rail={<FriendsRail accepted={data.accepted} received={data.received} sent={data.sent} profileId={data.profile.id} />}
    >
      <StickyPageHeader title="Arkadaşlar">
        <PageTabs
          tabs={tabs.map((tab) => ({
            label: tab.label,
            href: `/friends?tab=${tab.key}${query.q ? `&q=${encodeURIComponent(query.q)}` : ""}`,
            active: activeTab === tab.key,
          }))}
        />
        <form className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="tab" value={activeTab} />
          <SearchBox defaultValue={query.q} placeholder="@etiket veya isim ile kişi ara" />
          <Button variant="secondary">Ara</Button>
        </form>
      </StickyPageHeader>

      {query.q ? (
        <TimelineSurface>
          {searchResults.length ? searchResults.map((user) => (
            <TimelineRow
              key={user.id}
              avatar={<Avatar firstName={user.first_name} lastName={user.last_name} size="sm" />}
              title={fullName(user)}
              meta={`· ${user.tag ?? user.username ?? "etiket yok"}${user.class_name ? ` · ${user.class_name}` : ""}`}
              body={user.bio ?? "Topluluğa katılmak ve arkadaş olmak için istek gönderebilirsin."}
              actions={
                <form action={sendFriendRequestAction}>
                  <input type="hidden" name="receiver_id" value={user.id} />
                  <input type="hidden" name="return_to" value={`/friends?q=${encodeURIComponent(query.q ?? "")}`} />
                  <button type="submit" className="font-black text-slate-950 hover:text-orange-700">
                    Arkadaş ekle
                  </button>
                </form>
              }
            />
          )) : <InlineEmpty title="Kullanıcı bulunamadı" body="Etiketi kontrol edip tekrar ara." />}
        </TimelineSurface>
      ) : null}

      {!query.q && activeTab === "requests" ? (
        <TimelineSurface>
          {data.received.length ? data.received.map((item) => (
            <TimelineRow
              key={item.id}
              avatar={<Avatar firstName={item.requester?.first_name} lastName={item.requester?.last_name} size="sm" />}
              title={fullName(item.requester ?? undefined)}
              meta={`· ${item.requester?.tag ?? item.requester?.username ?? "etiket yok"}`}
              badge={<SocialBadge tone="blue">İstek</SocialBadge>}
              body="Sana arkadaşlık isteği gönderdi."
              actions={
                <>
                  <form action={respondFriendRequestAction}>
                    <input type="hidden" name="friendship_id" value={item.id} />
                    <input type="hidden" name="requester_id" value={item.requester?.id} />
                    <input type="hidden" name="status" value="accepted" />
                    <button type="submit" className="font-black text-slate-950 hover:text-orange-700">Kabul et</button>
                  </form>
                  <form action={respondFriendRequestAction}>
                    <input type="hidden" name="friendship_id" value={item.id} />
                    <input type="hidden" name="requester_id" value={item.requester?.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button type="submit" className="hover:text-slate-950">Reddet</button>
                  </form>
                </>
              }
            />
          )) : <InlineEmpty title="Gelen istek yok" />}
        </TimelineSurface>
      ) : null}

      {!query.q && activeTab === "sent" ? (
        <TimelineSurface>
          {data.sent.length ? data.sent.map((item) => (
            <TimelineRow
              key={item.id}
              avatar={<Avatar firstName={item.receiver?.first_name} lastName={item.receiver?.last_name} size="sm" />}
              title={fullName(item.receiver ?? undefined)}
              meta={`· ${item.receiver?.tag ?? item.receiver?.username ?? "etiket yok"}`}
              badge={<SocialBadge tone="amber">Bekliyor</SocialBadge>}
              body="Arkadaşlık isteğin beklemede."
              actions={
                <form action={cancelFriendRequestAction}>
                  <input type="hidden" name="friendship_id" value={item.id} />
                  <input type="hidden" name="target_id" value={item.receiver?.id} />
                  <button type="submit" className="font-black text-slate-950 hover:text-orange-700">İptal et</button>
                </form>
              }
            />
          )) : <InlineEmpty title="Gönderilen istek yok" />}
        </TimelineSurface>
      ) : null}

      {!query.q && activeTab === "suggested" ? (
        <TimelineSurface>
          <InlineEmpty
            title="Kişi ara"
            body="@etiket veya isim yazarak arkadaşlarını bul."
            action={<Link href="/friends?tab=suggested&q=@" className="inline-flex items-center gap-2 font-black text-sky-600"><Search className="size-4" /> Aramaya başla</Link>}
          />
        </TimelineSurface>
      ) : null}

      {!query.q && activeTab === "friends" ? (
        <TimelineSurface>
          {data.accepted.length ? data.accepted.map((item) => {
            const friend = item.requester_id === data.profile.id ? item.receiver : item.requester;

            if (!friend) return null;

            return (
              <TimelineRow
                key={item.id}
                avatar={<Avatar firstName={friend.first_name} lastName={friend.last_name} size="sm" />}
                title={fullName(friend)}
                meta={`· ${friend.tag ?? friend.username ?? "etiket yok"}${friend.class_name ? ` · ${friend.class_name}` : ""}`}
                badge={<SocialBadge tone="green">Arkadaş</SocialBadge>}
                body={friend.bio ?? "Arkadaşın."}
                actions={
                  <>
                    <form action={startDirectConversationAction}>
                      <input type="hidden" name="user_id" value={friend.id} />
                      <input type="hidden" name="return_to" value="/friends" />
                      <button type="submit" className="font-black text-slate-950 hover:text-orange-700">Mesaj</button>
                    </form>
                    <Link href={`/profile/${friend.id}`} className="hover:text-slate-950">Profil</Link>
                    <form action={removeFriendAction}>
                      <input type="hidden" name="friendship_id" value={item.id} />
                      <input type="hidden" name="target_id" value={friend.id} />
                      <button type="submit" className="hover:text-red-600">Çıkar</button>
                    </form>
                  </>
                }
              />
            );
          }) : (
            <InlineEmpty title="Henüz arkadaş yok" body="@etiket ile kişi ara ve arkadaşlık isteği gönder." />
          )}
        </TimelineSurface>
      ) : null}
    </SocialPage>
  );
}

function FriendsRail({
  accepted,
  received,
  sent,
  profileId,
}: {
  accepted: any[];
  received: any[];
  sent: any[];
  profileId: string;
}) {
  return (
    <>
      <RailSection title="Kısa durum">
        <RailItem title={`${accepted.length} arkadaş`} meta="Arkadaş listesi" icon={UserCheck} />
        <RailItem title={`${received.length} gelen istek`} meta="Yanıt bekliyor" href="/friends?tab=requests" icon={Inbox} />
        <RailItem title={`${sent.length} gönderilen`} meta="Bekleyen istek" href="/friends?tab=sent" icon={Send} />
      </RailSection>
      <RailSection title="Mesajlaş">
        {accepted.slice(0, 5).map((item) => {
          const friend = item.requester_id === profileId ? item.receiver : item.requester;
          return friend ? (
            <RailItem
              key={item.id}
              title={fullName(friend)}
              meta={friend.tag ?? friend.username ?? "etiket yok"}
              href={`/profile/${friend.id}`}
              icon={MessageCircle}
            />
          ) : null;
        })}
        {!accepted.length ? <RailItem title="Arkadaş ekle" meta="Mesajlaşmak için arkadaş ol." icon={UserPlus} /> : null}
      </RailSection>
    </>
  );
}
