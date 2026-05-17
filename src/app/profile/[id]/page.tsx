import Link from "next/link";
import {
  cancelFriendRequestAction,
  removeFriendAction,
  sendFriendRequestAction,
  updateProfileAction,
} from "@/lib/actions/profile";
import { getProfileDetail } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";
import { Avatar, Badge, Button, Card, Field, LinkButton } from "@/components/ui";
import { fullName } from "@/lib/utils";
import { FileUploadPreview } from "@/components/file-upload-preview";
import { EventCard } from "@/features/events/event-card";
import { PostCard } from "@/features/posts/post-card";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

function FriendButton({ data }: { data: Awaited<ReturnType<typeof getProfileDetail>> }) {
  const { current, target, friendship } = data;

  if (current.id === target.id) {
    return null;
  }

  if (!friendship) {
    return (
      <form action={sendFriendRequestAction}>
        <input type="hidden" name="receiver_id" value={target.id} />
        <Button>Arkadaş ekle</Button>
      </form>
    );
  }

  if (friendship.status === "accepted") {
    return (
      <form action={removeFriendAction}>
        <input type="hidden" name="friendship_id" value={friendship.id} />
        <input type="hidden" name="target_id" value={target.id} />
        <Button variant="secondary">Arkadaşlıktan çıkar</Button>
      </form>
    );
  }

  if (friendship.status === "pending" && friendship.requester_id === current.id) {
    return (
      <form action={cancelFriendRequestAction}>
        <input type="hidden" name="friendship_id" value={friendship.id} />
        <input type="hidden" name="target_id" value={target.id} />
        <Button variant="secondary">İsteği iptal et</Button>
      </form>
    );
  }

  if (friendship.status === "pending") {
    return (
      <Link
        href="/friends?tab=requests"
        className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white"
      >
        İsteği yanıtla
      </Link>
    );
  }

  return <Badge tone="slate">{friendship.status}</Badge>;
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const current = await getCurrentProfile();

  if (!current) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="space-y-4 text-center">
          <h1 className="text-2xl font-black text-slate-950">Profiller için giriş yap</h1>
          <p className="text-sm leading-6 text-slate-600">
            Profil, arkadaşlık ve ilgi alanı bilgileri okul hesabıyla görüntülenir.
          </p>
          <LinkButton href="/login">Giriş yap</LinkButton>
        </Card>
      </div>
    );
  }

  const data = await getProfileDetail(id);
  const isOwnProfile = data.current.id === data.target.id;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-white shadow-sm">
        <div className="h-32 bg-gradient-to-r from-slate-950 via-[#f05a28] to-amber-300" />
        <div className="px-5 pb-5">
          <div className="-mt-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <Avatar
                firstName={data.target.first_name}
                lastName={data.target.last_name}
                src={data.avatarUrl}
                size="lg"
              />
              <div className="pb-1">
                <h1 className="text-3xl font-black text-slate-950">{fullName(data.target)}</h1>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {data.target.class_name} · No {data.target.school_number}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={data.target.role === "admin" ? "red" : data.target.role === "teacher" ? "green" : "blue"}>
                {data.target.role}
              </Badge>
              <FriendButton data={data} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-orange-50 p-3">
              <div className="text-2xl font-black text-slate-950">
                {data.target.participation_points ?? 0}
              </div>
              <div className="text-sm font-semibold text-slate-600">katılım puanı</div>
            </div>
            <div className="rounded-md bg-blue-50 p-3">
              <div className="text-2xl font-black text-slate-950">{data.friends.length}</div>
              <div className="text-sm font-semibold text-slate-600">arkadaş</div>
            </div>
            <div className="rounded-md bg-emerald-50 p-3">
              <div className="text-2xl font-black text-slate-950">{data.badges.length}</div>
              <div className="text-sm font-semibold text-slate-600">rozet</div>
            </div>
          </div>
        </div>
      </section>

      {query.message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {query.message}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <Card>
            <h2 className="text-lg font-black text-slate-950">İlgi alanları</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(data.target.interests ?? []).length ? (
                data.target.interests?.map((interest) => (
                  <Badge key={interest}>{interest}</Badge>
                ))
              ) : (
                <span className="text-sm text-slate-600">Henüz eklenmemiş.</span>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-black text-slate-950">Rozetler</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.badges.length ? (
                data.badges.map((item: any) => (
                  <Badge key={item.badges?.code ?? item.badges?.name} tone="amber">
                    {item.badges?.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-600">Henüz rozet yok.</span>
              )}
            </div>
          </Card>
        </aside>

        <div className="space-y-4">
          {isOwnProfile ? (
            <Card className="space-y-4">
              <h2 className="text-xl font-black text-slate-950">Profili düzenle</h2>
              <form action={updateProfileAction} className="grid gap-4 sm:grid-cols-2">
                <Field label="Ad" name="first_name" defaultValue={data.target.first_name ?? ""} required />
                <Field label="Soyad" name="last_name" defaultValue={data.target.last_name ?? ""} required />
                <Field label="Sınıf" name="class_name" defaultValue={data.target.class_name ?? ""} required />
                <Field label="Okul numarası" name="school_number" defaultValue={data.target.school_number ?? ""} required />
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
            </Card>
          ) : null}

          <Card>
            <h2 className="text-xl font-black text-slate-950">Arkadaşlar</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.friends.length ? (
                data.friends.map((friendship: any) => {
                  const friend =
                    friendship.requester_id === data.target.id
                      ? friendship.receiver
                      : friendship.requester;

                  return (
                    <Link
                      key={friendship.id}
                      href={`/profile/${friend?.id}`}
                      className="flex items-center gap-2 rounded-md border border-[var(--border-soft)] p-3 hover:bg-orange-50"
                    >
                      <Avatar
                        firstName={friend?.first_name}
                        lastName={friend?.last_name}
                        size="sm"
                      />
                      <span className="text-sm font-semibold">{fullName(friend)}</span>
                    </Link>
                  );
                })
              ) : (
                <p className="text-sm text-slate-600">Arkadaş listesi boş.</p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black text-slate-950">Katıldığı etkinlikler</h2>
            {data.attendedEvents.length ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {data.attendedEvents.map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                Henüz katıldığı etkinlik görünmüyor.
              </p>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-black text-slate-950">Son gönderiler</h2>
            {data.authoredPosts.length ? (
              <div className="mt-4 grid gap-4">
                {data.authoredPosts.map((post: any) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    returnTo={`/profile/${data.target.id}`}
                    currentUserId={data.current.id}
                    compact
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                Henüz gönderi paylaşılmamış.
              </p>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
