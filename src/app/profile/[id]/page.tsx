import Link from "next/link";
import { CalendarDays, MessageCircle, PenLine, Sparkles, UserPlus, UsersRound } from "lucide-react";
import {
  cancelFriendRequestAction,
  removeFriendAction,
  respondFriendRequestAction,
  sendFriendRequestAction,
} from "@/features/friends/actions";
import { startDirectConversationAction } from "@/features/messages/actions";
import { EventCard } from "@/features/events/event-card";
import { FileUploadPreview } from "@/components/file-upload-preview";
import { SubmitButton } from "@/components/submit-button";
import { Avatar, Badge, Button, Field, LinkButton, TextArea } from "@/components/ui";
import {
  InlineEmpty,
  PageTabs,
  RailItem,
  RailSection,
  SocialPage,
  StickyPageHeader,
  TimelineRow,
  TimelineSurface,
} from "@/components/social-ui";
import { updateProfileAction } from "@/lib/actions/profile";
import { getProfileDetail } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";
import { fullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; tab?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const current = await getCurrentProfile();

  if (!current) {
    return (
      <SocialPage rail={<RailSection title="Profil"><RailItem title="Giriş yap" meta="Profilleri görmek için hesabına gir." icon={UsersRound} /></RailSection>}>
        <StickyPageHeader title="Profil" />
        <TimelineSurface>
          <InlineEmpty title="Giriş yap" body="Profil ve arkadaşlık bilgileri okul hesabına bağlıdır." action={<LinkButton href="/login">Giriş yap</LinkButton>} />
        </TimelineSurface>
      </SocialPage>
    );
  }

  const data = await getProfileDetail(id);
  const isOwnProfile = data.current.id === data.target.id;
  const tab = query.tab ?? "feed";

  return (
    <SocialPage
      rail={<ProfileRail data={data} />}
    >
      <StickyPageHeader title={fullName(data.target)} />

      {query.message ? (
        <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {query.message}
        </div>
      ) : null}

      <section className="border-b border-slate-200 bg-white">
        <div className="h-28 bg-gradient-to-r from-slate-950 via-slate-800 to-orange-500" />
        <div className="px-4 pb-4">
          <div className="-mt-10 flex items-end justify-between gap-3">
            <Avatar
              firstName={data.target.first_name}
              lastName={data.target.last_name}
              src={data.avatarUrl}
              size="lg"
            />
            <div className="flex flex-wrap justify-end gap-2">
              {isOwnProfile ? (
                <LinkButton href={`/profile/${data.target.id}?tab=edit`} variant="secondary" className="h-10 px-4">
                  <PenLine className="size-4" />
                  Düzenle
                </LinkButton>
              ) : (
                <FriendActions data={data} />
              )}
            </div>
          </div>

          <div className="mt-3">
            <h1 className="text-2xl font-black text-slate-950">{fullName(data.target)}</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {data.target.tag ?? data.target.username ?? "Etiket yok"}
              {data.target.class_name ? ` · ${data.target.class_name}` : ""}
            </p>
            {data.target.bio ? (
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-700">{data.target.bio}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
              <span><b className="text-slate-950">{data.friends.length}</b> arkadaş</span>
              <span><b className="text-slate-950">{data.attendedEvents.length}</b> etkinlik</span>
              <span><b className="text-slate-950">{data.badges.length}</b> rozet</span>
            </div>
          </div>
        </div>
        <div className="px-4">
          <PageTabs
            tabs={[
              { label: "Akış", href: `/profile/${data.target.id}?tab=feed`, active: tab === "feed" },
              { label: "Etkinlikler", href: `/profile/${data.target.id}?tab=events`, active: tab === "events" },
              { label: "Arkadaşlar", href: `/profile/${data.target.id}?tab=friends`, active: tab === "friends" },
              ...(isOwnProfile ? [{ label: "Düzenle", href: `/profile/${data.target.id}?tab=edit`, active: tab === "edit" }] : []),
            ]}
          />
        </div>
      </section>

      {tab === "edit" && isOwnProfile ? <ProfileEdit data={data} /> : null}
      {tab === "events" ? <ProfileEvents data={data} /> : null}
      {tab === "friends" ? <ProfileFriends data={data} /> : null}
      {tab === "feed" || (!isOwnProfile && tab === "edit") ? <ProfileFeed data={data} /> : null}
    </SocialPage>
  );
}

function FriendActions({ data }: { data: Awaited<ReturnType<typeof getProfileDetail>> }) {
  const { current, target, friendship } = data;

  if (current.id === target.id) return null;

  if (!friendship) {
    return (
      <form action={sendFriendRequestAction}>
        <input type="hidden" name="receiver_id" value={target.id} />
        <input type="hidden" name="return_to" value={`/profile/${target.id}`} />
        <Button className="h-10 px-4">
          <UserPlus className="size-4" />
          Arkadaş ekle
        </Button>
      </form>
    );
  }

  if (friendship.status === "accepted") {
    return (
      <>
        <form action={startDirectConversationAction}>
          <input type="hidden" name="user_id" value={target.id} />
          <input type="hidden" name="return_to" value={`/profile/${target.id}`} />
          <Button className="h-10 px-4">Mesaj</Button>
        </form>
        <form action={removeFriendAction}>
          <input type="hidden" name="friendship_id" value={friendship.id} />
          <input type="hidden" name="target_id" value={target.id} />
          <input type="hidden" name="return_to" value={`/profile/${target.id}`} />
          <Button variant="secondary" className="h-10 px-4">Çıkar</Button>
        </form>
      </>
    );
  }

  if (friendship.status === "pending" && friendship.requester_id === current.id) {
    return (
      <form action={cancelFriendRequestAction}>
        <input type="hidden" name="friendship_id" value={friendship.id} />
        <input type="hidden" name="target_id" value={target.id} />
        <input type="hidden" name="return_to" value={`/profile/${target.id}`} />
        <Button variant="secondary" className="h-10 px-4">İsteği iptal et</Button>
      </form>
    );
  }

  if (friendship.status === "pending") {
    return (
      <form action={respondFriendRequestAction} className="flex gap-2">
        <input type="hidden" name="friendship_id" value={friendship.id} />
        <input type="hidden" name="requester_id" value={target.id} />
        <input type="hidden" name="return_to" value={`/profile/${target.id}`} />
        <button name="status" value="accepted" className="h-10 rounded-full bg-slate-950 px-4 text-sm font-black text-white">Kabul et</button>
        <button name="status" value="rejected" className="h-10 rounded-full border border-slate-200 px-4 text-sm font-black text-slate-700">Reddet</button>
      </form>
    );
  }

  return <Badge tone="slate">{friendship.status}</Badge>;
}

function ProfileFeed({ data }: { data: Awaited<ReturnType<typeof getProfileDetail>> }) {
  return (
    <TimelineSurface>
      {data.authoredPosts.length ? data.authoredPosts.map((post: any) => (
        <TimelineRow
          key={post.id}
          avatar={<Avatar firstName={data.target.first_name} lastName={data.target.last_name} size="sm" />}
          title={post.communities?.name ?? fullName(data.target)}
          meta="· gönderi"
          body={
            <Link href={`/posts/${post.id}`} className="block">
              <span className="block font-semibold text-slate-950">{post.title}</span>
              <span className="mt-1 line-clamp-3 block text-sm text-slate-600">{post.body}</span>
            </Link>
          }
          actions={<Link href={`/posts/${post.id}`} className="font-black text-slate-950 hover:text-orange-700">Aç</Link>}
        />
      )) : (
        <InlineEmpty title="Henüz paylaşım yok" body="Profil akışı sakin." />
      )}
    </TimelineSurface>
  );
}

function ProfileEvents({ data }: { data: Awaited<ReturnType<typeof getProfileDetail>> }) {
  return (
    <div className="bg-white px-4 py-4">
      {data.attendedEvents.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.attendedEvents.map((event: any) => <EventCard key={event.id} event={event} />)}
        </div>
      ) : (
        <InlineEmpty title="Etkinlik yok" body="Katıldığı etkinlik görünmüyor." />
      )}
    </div>
  );
}

function ProfileFriends({ data }: { data: Awaited<ReturnType<typeof getProfileDetail>> }) {
  return (
    <TimelineSurface>
      {data.friends.length ? data.friends.map((friendship: any) => {
        const friend = friendship.requester_id === data.target.id ? friendship.receiver : friendship.requester;
        if (!friend) return null;

        return (
          <TimelineRow
            key={friendship.id}
            avatar={<Avatar firstName={friend.first_name} lastName={friend.last_name} size="sm" />}
            title={fullName(friend)}
            meta={`· ${friend.tag ?? friend.username ?? "etiket yok"}`}
            actions={<Link href={`/profile/${friend.id}`} className="font-black text-slate-950 hover:text-orange-700">Profil</Link>}
          />
        );
      }) : <InlineEmpty title="Arkadaş listesi boş" />}
    </TimelineSurface>
  );
}

function ProfileEdit({ data }: { data: Awaited<ReturnType<typeof getProfileDetail>> }) {
  return (
    <div className="bg-white px-4 py-4">
      <form action={updateProfileAction} className="grid gap-4 sm:grid-cols-2">
        <Field label="Ad" name="first_name" defaultValue={data.target.first_name ?? ""} required />
        <Field label="Soyad" name="last_name" defaultValue={data.target.last_name ?? ""} required />
        <Field label="Kullanıcı etiketi" name="username" defaultValue={data.target.username ?? ""} placeholder="eymen2011" />
        <Field label="Sınıf" name="class_name" defaultValue={data.target.class_name ?? ""} required />
        <Field label="Okul numarası" name="school_number" defaultValue={data.target.school_number ?? ""} required />
        <div className="sm:col-span-2">
          <TextArea label="Kısa bio" name="bio" defaultValue={data.target.bio ?? ""} rows={3} />
        </div>
        <div className="sm:col-span-2">
          <Field
            label="İlgi alanları"
            name="interests"
            defaultValue={(data.target.interests ?? []).join(", ")}
            placeholder="robotik, tiyatro, yapay zeka"
          />
        </div>
        <div className="sm:col-span-2">
          <FileUploadPreview name="avatar" label="Profil fotoğrafı" />
        </div>
        <SubmitButton className="sm:col-span-2" pendingLabel="Profil güncelleniyor...">
          Güncelle
        </SubmitButton>
      </form>
    </div>
  );
}

function ProfileRail({ data }: { data: Awaited<ReturnType<typeof getProfileDetail>> }) {
  return (
    <>
      <RailSection title="Profil bilgileri">
        <RailItem title={`${data.target.participation_points ?? 0} katılım puanı`} meta="Katılım" icon={Sparkles} />
        <RailItem title={`${data.friends.length} arkadaş`} meta="Sosyal bağ" icon={UsersRound} />
        <RailItem title={`${data.attendedEvents.length} etkinlik`} meta="Katıldığı etkinlik" icon={CalendarDays} />
      </RailSection>
      <RailSection title="Rozetler">
        {data.badges.length ? data.badges.slice(0, 6).map((item: any) => (
          <RailItem key={item.badges?.code ?? item.badges?.name} title={item.badges?.name} meta={item.badges?.description} icon={Sparkles} />
        )) : <RailItem title="Henüz rozet yok" icon={Sparkles} />}
      </RailSection>
      <RailSection title="Son aktiviteler">
        {data.authoredPosts.slice(0, 4).map((post: any) => (
          <RailItem key={post.id} title={post.title} meta="Gönderi" href={`/posts/${post.id}`} icon={MessageCircle} />
        ))}
        {!data.authoredPosts.length ? <RailItem title="Henüz paylaşım yok" icon={MessageCircle} /> : null}
      </RailSection>
    </>
  );
}
