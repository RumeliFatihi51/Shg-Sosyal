import type { ReactNode } from "react";
import { BarChart3, Flag, Megaphone, ShieldCheck, UsersRound } from "lucide-react";
import {
  createAnnouncementAction,
  createPollAction,
  deleteCommentAction,
  markReportReviewedAction,
  reviewCommunityAction,
  reviewEventAction,
  softDeletePostAction,
  suspendCommunityAction,
  suspendUserAction,
  updateEventLifecycleAction,
  updateUserRoleAction,
} from "@/lib/actions/admin";
import { getAdminData } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";
import { Badge, Card, EmptyState, Field, LinkButton, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PageTabs, RailItem, RailSection, SocialPage, StickyPageHeader } from "@/components/social-ui";

export const dynamic = "force-dynamic";

const roleLabels = ["student", "community_admin", "teacher", "moderator", "admin"];

const tabs = [
  { key: "events", label: "Etkinlikler", icon: BarChart3 },
  { key: "communities", label: "Topluluklar", icon: UsersRound },
  { key: "reports", label: "Raporlar", icon: Flag },
  { key: "users", label: "Kullanıcılar", icon: ShieldCheck },
  { key: "content", label: "Duyuru / Anket", icon: Megaphone },
] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; tab?: string; q?: string; role?: string; page?: string }>;
}) {
  const query = await searchParams;
  const current = await getCurrentProfile();

  if (!current) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="space-y-4 text-center">
          <ShieldCheck className="mx-auto size-10 text-[#f05a28]" />
          <h1 className="text-2xl font-black text-slate-950">Yönetim paneli için giriş yap</h1>
          <p className="text-sm leading-6 text-slate-600">
            Bu alan admin, moderator ve öğretmen rollerine açıktır.
          </p>
          <LinkButton href="/login">Giriş yap</LinkButton>
        </Card>
      </div>
    );
  }

  if (!["admin", "moderator", "teacher"].includes(current.role)) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="space-y-4 text-center">
          <ShieldCheck className="mx-auto size-10 text-slate-400" />
          <h1 className="text-2xl font-black text-slate-950">Erişim yetkin yok</h1>
          <p className="text-sm leading-6 text-slate-600">
            Yönetim paneli sadece admin, moderator ve öğretmen rollerine açıktır.
          </p>
          <LinkButton href="/" variant="secondary">Ana sayfaya dön</LinkButton>
        </Card>
      </div>
    );
  }

  const page = Number.parseInt(query.page ?? "1", 10);
  const data = await getAdminData({
    users: {
      q: query.q ?? "",
      role: query.role ?? "",
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: 25,
    },
  });
  const canChangeRoles = data.profile.role === "admin";
  const canModerate = ["admin", "moderator"].includes(data.profile.role);
  const requestedTab = tabs.some((tab) => tab.key === query.tab) ? query.tab : "events";
  const activeTab = canModerate ? requestedTab : "content";

  return (
    <SocialPage rail={<AdminRail data={data} canChangeRoles={canChangeRoles} canModerate={canModerate} />}>
      <StickyPageHeader title="Yönetim" subtitle="Onaylar, raporlar ve kullanıcı işleri.">
        <PageTabs
          tabs={tabs.map((tab) => {
            const disabled = !canModerate && tab.key !== "content";

            return {
              label: tab.label,
              href: disabled ? "/admin?tab=content" : `/admin?tab=${tab.key}`,
              active: activeTab === tab.key,
            };
          })}
        />
      </StickyPageHeader>

      {query.message ? (
        <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {query.message}
        </div>
      ) : null}

      {activeTab === "events" && canModerate ? (
        <div className="grid gap-4 bg-white p-4 xl:grid-cols-[1fr_0.9fr]">
          <Panel title="Bekleyen etkinlikler">
            {data.pendingEvents.length ? (
              <div className="grid gap-3">
                {data.pendingEvents.map((event: any) => (
                  <div key={event.id} className="rounded-md border border-[var(--border-soft)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-950">{event.title}</h3>
                        <p className="text-sm text-slate-600">
                          {event.event_date} · {event.location}
                        </p>
                      </div>
                      <Badge tone="amber">bekliyor</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <form action={reviewEventAction}>
                        <input type="hidden" name="event_id" value={event.id} />
                        <input type="hidden" name="status" value="approved" />
                        <SubmitButton pendingLabel="Onaylanıyor...">Onayla</SubmitButton>
                      </form>
                      <form action={reviewEventAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="event_id" value={event.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <input name="reason" placeholder="Ret sebebi" className="h-10 rounded-md border border-[var(--border-soft)] px-2 text-sm" />
                        <SubmitButton variant="secondary" pendingLabel="Reddediliyor...">
                          Reddet
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Etkinlik yok" body="Bekleyen etkinlik bulunmuyor." />
            )}
          </Panel>

          <Panel title="İptal / erteleme">
            {data.approvedEvents.length ? (
              <div className="grid gap-3">
                {data.approvedEvents.map((event: any) => (
                  <form key={event.id} action={updateEventLifecycleAction} className="grid gap-2 rounded-md border border-[var(--border-soft)] p-3">
                    <input type="hidden" name="event_id" value={event.id} />
                    <div className="font-bold text-slate-950">{event.title}</div>
                    <div className="text-sm text-slate-600">{event.event_date} · {event.location}</div>
                    <select name="lifecycle" defaultValue={event.lifecycle} className="h-10 rounded-md border border-[var(--border-soft)] bg-white px-3">
                      <option value="scheduled">Planlandı</option>
                      <option value="postponed">Ertelendi</option>
                      <option value="canceled">İptal</option>
                    </select>
                    <input name="reason" placeholder="İptal/erteleme notu" className="h-10 rounded-md border border-[var(--border-soft)] px-3" />
                    <SubmitButton variant="secondary" pendingLabel="Güncelleniyor...">
                      Durumu güncelle
                    </SubmitButton>
                  </form>
                ))}
              </div>
            ) : (
              <EmptyState title="Etkinlik yok" body="Yayınlanmış etkinlik bulunmuyor." />
            )}
          </Panel>
        </div>
      ) : null}

      {activeTab === "communities" && canModerate ? (
        <div className="grid gap-4 bg-white p-4 xl:grid-cols-[1fr_0.9fr]">
          <Panel title="Bekleyen topluluklar">
            {data.pendingCommunities.length ? (
              <div className="grid gap-3">
                {data.pendingCommunities.map((community: any) => (
                  <div key={community.id} className="rounded-md border border-[var(--border-soft)] p-3">
                    <h3 className="font-bold text-slate-950">{community.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {community.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <form action={reviewCommunityAction}>
                        <input type="hidden" name="community_id" value={community.id} />
                        <input type="hidden" name="status" value="approved" />
                        <SubmitButton pendingLabel="Onaylanıyor...">Onayla</SubmitButton>
                      </form>
                      <form action={reviewCommunityAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="community_id" value={community.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <input name="reason" placeholder="Ret sebebi" className="h-10 rounded-md border border-[var(--border-soft)] px-2 text-sm" />
                        <SubmitButton variant="secondary" pendingLabel="Reddediliyor...">
                          Reddet
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Başvuru yok" body="Bekleyen topluluk bulunmuyor." />
            )}
          </Panel>

          <Panel title="Topluluk askıya alma">
            {data.approvedCommunities.length ? (
              <div className="grid gap-3">
                {data.approvedCommunities.map((community: any) => (
                  <form key={community.id} action={suspendCommunityAction} className="grid gap-2 rounded-md border border-[var(--border-soft)] p-3">
                    <input type="hidden" name="community_id" value={community.id} />
                    <input type="hidden" name="is_suspended" value={String(!community.is_suspended)} />
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{community.name}</span>
                      {community.is_suspended ? <Badge tone="red">askıda</Badge> : <Badge tone="green">aktif</Badge>}
                    </div>
                    <input name="reason" placeholder="Sebep" className="h-10 rounded-md border border-[var(--border-soft)] px-3" />
                    <SubmitButton
                      variant={community.is_suspended ? "secondary" : "danger"}
                      pendingLabel="Kaydediliyor..."
                    >
                      {community.is_suspended ? "Askıdan çıkar" : "Askıya al"}
                    </SubmitButton>
                  </form>
                ))}
              </div>
            ) : (
              <EmptyState title="Topluluk yok" body="Onaylı topluluk bulunmuyor." />
            )}
          </Panel>
        </div>
      ) : null}

      {activeTab === "reports" && canModerate ? (
        <div className="grid gap-4 bg-white p-4 xl:grid-cols-[1fr_0.8fr]">
          <Panel title="Raporlanan içerikler">
            {data.reports.length ? (
              <div className="grid gap-3">
                {data.reports.map((report: any) => (
                  <div key={report.id} className="rounded-md border border-[var(--border-soft)] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="red">{report.target_type}</Badge>
                      <span className="text-sm font-semibold text-slate-500">{report.target_id}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{report.reason}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {report.target_type === "post" ? (
                        <form action={softDeletePostAction}>
                          <input type="hidden" name="post_id" value={report.target_id} />
                          <SubmitButton variant="danger" pendingLabel="Siliniyor...">
                            Gönderiyi sil
                          </SubmitButton>
                        </form>
                      ) : null}
                      {report.target_type === "comment" ? (
                        <form action={deleteCommentAction}>
                          <input type="hidden" name="comment_id" value={report.target_id} />
                          <SubmitButton variant="danger" pendingLabel="Siliniyor...">
                            Yorumu sil
                          </SubmitButton>
                        </form>
                      ) : null}
                      <form action={markReportReviewedAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="report_id" value={report.id} />
                        <input name="resolution_note" placeholder="Çözüm notu" className="h-10 rounded-md border border-[var(--border-soft)] px-2 text-sm" />
                        <SubmitButton variant="secondary" pendingLabel="Kaydediliyor...">
                          İncelendi
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Rapor yok" body="Açık rapor bulunmuyor." />
            )}
          </Panel>

          <Panel title="İşlem geçmişi">
            {data.auditLogs.length ? (
              <div className="grid gap-2">
                {data.auditLogs.map((log: any) => (
                  <div key={log.id} className="rounded-md bg-slate-50 p-3 text-sm">
                    <span className="font-bold">{log.action}</span>{" "}
                    <span className="text-slate-600">{log.target_type}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleString("tr-TR")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Kayıt yok" body="Admin işlemleri burada tutulacak." />
            )}
          </Panel>
        </div>
      ) : null}

      {activeTab === "users" && canModerate ? (
        <div className="bg-white p-4">
        <Panel title="Kullanıcı yönetimi">
          <form className="mb-4 grid gap-3 rounded-2xl bg-slate-50 p-3 md:grid-cols-[1fr_180px_auto]" action="/admin">
            <input type="hidden" name="tab" value="users" />
            <Field
              label="Kullanıcı ara"
              name="q"
              defaultValue={query.q ?? ""}
              placeholder="ad, e-posta, @etiket veya sınıf"
            />
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Rol
              <select
                name="role"
                defaultValue={query.role ?? ""}
                className="h-11 rounded-2xl border border-white/80 bg-white/85 px-4 text-slate-950 outline-none"
              >
                <option value="">Tüm roller</option>
                {roleLabels.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <SubmitButton variant="secondary" pendingLabel="Aranıyor...">
                Ara
              </SubmitButton>
            </div>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="py-2">Kullanıcı</th>
                  <th className="py-2">Etiket</th>
                  <th className="py-2">E-posta</th>
                  <th className="py-2">Sınıf</th>
                  <th className="py-2">Son aktivite</th>
                  <th className="py-2">Rol</th>
                  <th className="py-2">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user: any) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="py-3 font-semibold">
                      {user.first_name} {user.last_name}
                        {user.is_suspended ? <Badge tone="red">askıda</Badge> : null}
                      </td>
                    <td className="py-3 text-slate-600">{user.tag ?? "Etiket yok"}</td>
                    <td className="py-3 text-slate-600">{user.email ?? "E-posta yok"}</td>
                    <td className="py-3 text-slate-600">{user.class_name}</td>
                    <td className="py-3 text-slate-600">
                      {user.last_seen_at
                        ? new Date(user.last_seen_at).toLocaleDateString("tr-TR")
                        : "Henüz yok"}
                    </td>
                    <td className="py-3">
                      <Badge tone={user.role === "admin" ? "red" : user.role === "teacher" ? "green" : "blue"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {canChangeRoles ? (
                        <div className="flex flex-wrap gap-2">
                          <form action={updateUserRoleAction} className="flex gap-2">
                            <input type="hidden" name="user_id" value={user.id} />
                            <select
                              name="role"
                              defaultValue={user.role}
                              className="h-9 rounded-md border border-[var(--border-soft)] bg-white px-2"
                              disabled={user.id === data.profile.id}
                            >
                              {roleLabels.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                            <SubmitButton
                              variant="secondary"
                              disabled={user.id === data.profile.id}
                              pendingLabel="Kaydediliyor..."
                            >
                              Kaydet
                            </SubmitButton>
                          </form>
                          <form action={suspendUserAction} className="flex gap-2">
                            <input type="hidden" name="user_id" value={user.id} />
                            <input type="hidden" name="is_suspended" value={String(!user.is_suspended)} />
                            <input name="reason" placeholder="Sebep" className="h-9 w-24 rounded-md border border-[var(--border-soft)] px-2" />
                            <SubmitButton
                              variant={user.is_suspended ? "secondary" : "danger"}
                              disabled={user.id === data.profile.id}
                              pendingLabel="Kaydediliyor..."
                            >
                              {user.is_suspended ? "Aç" : "Askıya al"}
                            </SubmitButton>
                          </form>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">Sadece admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.users.length ? (
            <div className="mt-4">
              <EmptyState title="Kullanıcı bulunamadı" body="Aramaya uyan gerçek kullanıcı yok." />
            </div>
          ) : null}
          {data.userCount > data.userPageSize ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <span>
                {data.userCount} kullanıcı · Sayfa {data.userPage}
              </span>
              <div className="flex gap-2">
                {data.userPage > 1 ? (
                  <LinkButton
                    href={`/admin?tab=users&q=${encodeURIComponent(query.q ?? "")}&role=${encodeURIComponent(query.role ?? "")}&page=${data.userPage - 1}`}
                    variant="secondary"
                  >
                    Önceki
                  </LinkButton>
                ) : null}
                {data.userPage * data.userPageSize < data.userCount ? (
                  <LinkButton
                    href={`/admin?tab=users&q=${encodeURIComponent(query.q ?? "")}&role=${encodeURIComponent(query.role ?? "")}&page=${data.userPage + 1}`}
                    variant="secondary"
                  >
                    Sonraki
                  </LinkButton>
                ) : null}
              </div>
            </div>
          ) : null}
        </Panel>
        </div>
      ) : null}

      {activeTab === "content" ? (
        <div className="grid gap-4 bg-white p-4 lg:grid-cols-2">
          <Panel title="Admin duyurusu">
            <form action={createAnnouncementAction} className="grid gap-3">
              <Field label="Başlık" name="title" required />
              <TextArea label="Duyuru" name="body" required rows={4} />
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Kitle
                <select name="audience" className="h-10 rounded-md border border-[var(--border-soft)] bg-white px-3">
                  <option value="school">Tüm okul</option>
                  <option value="students">Öğrenciler</option>
                  <option value="teachers">Öğretmenler</option>
                </select>
              </label>
              <SubmitButton pendingLabel="Yayınlanıyor...">Yayınla</SubmitButton>
            </form>
          </Panel>

          <Panel title="Okul geneli anket">
            <form action={createPollAction} className="grid gap-3">
              <Field label="Soru" name="title" required />
              <TextArea label="Açıklama" name="description" rows={2} />
              <Field label="Seçenek 1" name="option_1" required />
              <Field label="Seçenek 2" name="option_2" required />
              <Field label="Seçenek 3" name="option_3" />
              <Field label="Seçenek 4" name="option_4" />
              <Field label="Kapanış zamanı" name="closes_at" type="datetime-local" />
              <SubmitButton pendingLabel="Anket açılıyor...">Anketi aç</SubmitButton>
            </form>
          </Panel>
        </div>
      ) : null}
    </SocialPage>
  );
}

function AdminRail({
  data,
  canChangeRoles,
  canModerate,
}: {
  data: Awaited<ReturnType<typeof getAdminData>>;
  canChangeRoles: boolean;
  canModerate: boolean;
}) {
  return (
    <>
      <RailSection title="Durum">
        <RailItem title={`${data.stats.users} kullanıcı`} meta="Toplam hesap" icon={UsersRound} />
        <RailItem title={`${data.stats.communities} topluluk`} meta="Okuldaki alanlar" icon={ShieldCheck} />
        <RailItem title={`${data.stats.activeEvents} aktif etkinlik`} meta="Yayında" icon={BarChart3} />
        <RailItem title={`${data.stats.posts} gönderi`} meta="Akıştaki paylaşımlar" icon={Megaphone} />
      </RailSection>

      <RailSection title="Kuyruk">
        <RailItem title={`${data.pendingEvents.length} etkinlik`} meta="Onay bekliyor" icon={BarChart3} href="/admin?tab=events" />
        <RailItem title={`${data.pendingCommunities.length} topluluk`} meta="Başvuru bekliyor" icon={UsersRound} href="/admin?tab=communities" />
        <RailItem title={`${data.reports.length} rapor`} meta="İnceleme bekliyor" icon={Flag} href="/admin?tab=reports" />
      </RailSection>

      <RailSection title="Yetki">
        <RailItem
          title={canChangeRoles ? "Admin yetkisi" : canModerate ? "Moderasyon yetkisi" : "Duyuru yetkisi"}
          meta={canChangeRoles ? "Rol değiştirebilir" : "Rol değiştirme kapalı"}
          icon={ShieldCheck}
        />
        <RailItem title="Duyuru / Anket" meta="Hızlı yayınlama" icon={Megaphone} href="/admin?tab=content" />
      </RailSection>
    </>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-black text-slate-950">{title}</h2>
      {children}
    </section>
  );
}
