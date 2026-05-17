/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  MessageSquarePlus,
  Plus,
  UsersRound,
} from "lucide-react";
import {
  createPostAction,
  followCommunityAction,
  joinCommunityAction,
  leaveCommunityAction,
  unfollowCommunityAction,
} from "@/lib/actions/communities";
import { getCommunityDetail } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";
import { Avatar, Badge, Button, Card, EmptyState, Field, LinkButton, TextArea } from "@/components/ui";
import { EventCard } from "@/features/events/event-card";
import { PostCard } from "@/features/posts/post-card";
import { fullName } from "@/lib/utils";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function CommunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; message?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const current = await getCurrentProfile();

  if (!current) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="space-y-4 text-center">
          <UsersRound className="mx-auto size-10 text-[#f05a28]" />
          <h1 className="text-2xl font-black text-slate-950">Topluluk detayları için giriş yap</h1>
          <p className="text-sm leading-6 text-slate-600">
            Topluluk akışı, üyelik ve gönderiler okul içi oturumla görüntülenir.
          </p>
          <LinkButton href="/login">Giriş yap</LinkButton>
        </Card>
      </div>
    );
  }

  const data = await getCommunityDetail(slug, query.sort ?? "new");
  const isMember = Boolean(data.membership);
  const returnTo = `/communities/${data.community.slug}`;

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-white shadow-sm">
        <div className="h-28 bg-gradient-to-r from-slate-950 via-[#f05a28] to-amber-300" />
        <div className="p-5 pt-0">
          <div className="-mt-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              {data.imageUrl ? (
                <img
                  src={data.imageUrl}
                  alt=""
                  className="size-20 rounded-lg border-4 border-white object-cover shadow-sm"
                />
              ) : (
                <span className="flex size-20 items-center justify-center rounded-lg border-4 border-white bg-slate-950 text-white shadow-sm">
                  <UsersRound className="size-9" />
                </span>
              )}
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-black text-slate-950">{data.community.name}</h1>
                  <Badge tone="green">aktif</Badge>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {data.community.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isMember ? (
                <form action={leaveCommunityAction}>
                  <input type="hidden" name="community_id" value={data.community.id} />
                  <input type="hidden" name="slug" value={data.community.slug} />
                  <Button variant="secondary">Üyelikten ayrıl</Button>
                </form>
              ) : (
                <form action={joinCommunityAction}>
                  <input type="hidden" name="community_id" value={data.community.id} />
                  <input type="hidden" name="slug" value={data.community.slug} />
                  <Button>Üye ol</Button>
                </form>
              )}
              {data.follow ? (
                <form action={unfollowCommunityAction}>
                  <input type="hidden" name="community_id" value={data.community.id} />
                  <input type="hidden" name="slug" value={data.community.slug} />
                  <Button variant="ghost">Takibi bırak</Button>
                </form>
              ) : (
                <form action={followCommunityAction}>
                  <input type="hidden" name="community_id" value={data.community.id} />
                  <input type="hidden" name="slug" value={data.community.slug} />
                  <Button variant="secondary">
                    <Bell className="size-4" />
                    Takip et
                  </Button>
                </form>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-orange-50 p-3 text-sm">
              <b className="block text-xl text-slate-950">{data.members.length}</b>
              üye
            </div>
            <div className="rounded-md bg-blue-50 p-3 text-sm">
              <b className="block text-xl text-slate-950">{data.posts.length}</b>
              gönderi
            </div>
            <div className="rounded-md bg-emerald-50 p-3 text-sm">
              <b className="block text-xl text-slate-950">{data.events.length}</b>
              etkinlik
            </div>
          </div>
        </div>
      </section>

      {query.message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {query.message}
        </div>
      ) : null}

      <section className="grid gap-7 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Topluluk akışı</h2>
              <p className="text-sm text-slate-600">Yeni veya popüler sıralamayla gönderiler.</p>
            </div>
            <div className="flex rounded-md border border-[var(--border-soft)] bg-white p-1">
              <Link
                href={`${returnTo}?sort=new`}
                className={`rounded px-3 py-1.5 text-sm font-bold ${query.sort !== "popular" ? "bg-orange-50 text-[#f05a28]" : "text-slate-600 hover:bg-slate-50"}`}
              >
                Yeni
              </Link>
              <Link
                href={`${returnTo}?sort=popular`}
                className={`rounded px-3 py-1.5 text-sm font-bold ${query.sort === "popular" ? "bg-orange-50 text-[#f05a28]" : "text-slate-600 hover:bg-slate-50"}`}
              >
                Popüler
              </Link>
            </div>
          </div>

          {data.posts.length ? (
            <div className="grid gap-4">
              {data.posts.map((post: any) => (
                <PostCard
                  key={post.id}
                  post={post}
                  returnTo={returnTo}
                  currentUserId={data.profile.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Henüz gönderi yok"
              body="Topluluk üyeleri ilk paylaşımı yaptığında burada görünecek."
            />
          )}
        </div>

        <aside className="space-y-4">
          {isMember ? (
            <Card className="space-y-4">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <MessageSquarePlus className="size-5 text-[#f05a28]" />
                Gönderi paylaş
              </h2>
              <form action={createPostAction} className="grid gap-4">
                <input type="hidden" name="community_id" value={data.community.id} />
                <input type="hidden" name="slug" value={data.community.slug} />
                <input type="hidden" name="return_to" value={returnTo} />
                <Field label="Başlık" name="title" required />
                <TextArea label="Metin" name="body" required rows={6} />
                <SubmitButton pendingLabel="Paylaşılıyor...">Paylaş</SubmitButton>
              </form>
            </Card>
          ) : (
            <Card>
              <h2 className="text-lg font-bold text-slate-950">Gönderi için topluluğa katıl</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Katıldığın topluluklarda paylaşım ve yorum yapabilirsin.
              </p>
            </Card>
          )}

          {data.canManage ? (
            <Card className="space-y-3">
              <h2 className="text-xl font-black text-slate-950">Yönetici araçları</h2>
              <LinkButton href={`/events/new?community_id=${data.community.id}`} className="w-full">
                <Plus className="size-4" />
                Etkinlik oluştur
              </LinkButton>
            </Card>
          ) : null}

          <Card className="space-y-4">
            <h2 className="text-xl font-black text-slate-950">Üyeler</h2>
            <div className="grid gap-3">
              {data.members.slice(0, 10).map((member: any) => (
                <Link
                  key={member.profiles?.id ?? member.role}
                  href={`/profile/${member.profiles?.id}`}
                  className="flex items-center gap-2 rounded-md p-2 hover:bg-orange-50"
                >
                  <Avatar
                    firstName={member.profiles?.first_name}
                    lastName={member.profiles?.last_name}
                    size="sm"
                  />
                  <span className="text-sm font-semibold">{fullName(member.profiles)}</span>
                  {member.role === "admin" ? <Badge tone="blue">yönetici</Badge> : null}
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-[#f05a28]" />
            <h2 className="text-2xl font-black text-slate-950">Topluluk etkinlikleri</h2>
          </div>
          {data.canManage ? (
            <LinkButton href={`/events/new?community_id=${data.community.id}`} variant="secondary">
              Yeni etkinlik
            </LinkButton>
          ) : null}
        </div>
        {data.events.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.events.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Etkinlik yok"
            body="Onaylı ve bekleyen etkinlikler burada takip edilir."
          />
        )}
      </section>
    </div>
  );
}
