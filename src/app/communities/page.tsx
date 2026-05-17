import Link from "next/link";
import { ArrowRight, Bell, CheckCircle2, Plus, Radio, Search, Sparkles, UsersRound } from "lucide-react";
import { AnimatedSection, OrganicGrid } from "@/components/motion";
import {
  BentoCard,
  PulseBadge,
  SignalMetric,
  featuredCommunityLabel,
} from "@/components/radar";
import { Badge, Button, Card, EmptyState, LinkButton } from "@/components/ui";
import { CommunityCard } from "@/components/premium";
import { getCommunitiesData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; q?: string }>;
}) {
  const query = await searchParams;
  const { profile, communities, ownCommunities, ownEvents } =
    await getCommunitiesData(query.q ?? "");
  const applicationCount = ownCommunities.length + ownEvents.length;
  const totalMembers = communities.reduce(
    (sum: number, community: any) =>
      sum + (community.member_count ?? community.community_members?.[0]?.count ?? 0),
    0,
  );
  const totalPosts = communities.reduce(
    (sum: number, community: any) =>
      sum + (community.post_count ?? community.posts?.[0]?.count ?? 0),
    0,
  );
  const totalFollowers = communities.reduce(
    (sum: number, community: any) =>
      sum + (community.follower_count ?? community.community_followers?.[0]?.count ?? 0),
    0,
  );
  const featured = communities[0];
  const others = communities.slice(featured ? 1 : 0);

  return (
    <div className="space-y-8">
      <AnimatedSection className="grid gap-5 xl:grid-cols-[1fr_0.75fr]">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-300 to-blue-300" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(240,90,40,0.22),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.18),transparent_32%)]" />
          <div className="relative">
            <PulseBadge tone="blue" live>
              Aktif Alanlar
            </PulseBadge>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-balance sm:text-5xl">
              Topluluklar artık liste değil, okulun sinyal haritası.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Hangi kulüp konuşuyor, hangi ekip büyüyor, hangi alan bu hafta parlıyor? Hepsini tek ekranda yakala.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {profile ? (
                <>
                  <LinkButton href="/communities/new" className="bg-white text-slate-950 hover:bg-orange-50">
                    <Plus className="size-4" />
                    Topluluk kur
                  </LinkButton>
                  <LinkButton href="/events/new" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                    Etkinlik öner
                  </LinkButton>
                </>
              ) : (
                <LinkButton href="/login" className="bg-white text-slate-950 hover:bg-orange-50">
                  Giriş yap
                </LinkButton>
              )}
            </div>
          </div>
        </div>

        <Card className="relative overflow-hidden">
          <PulseBadge tone="green" live={Boolean(featured)}>
            topluluk sinyalleri
          </PulseBadge>
          <div className="mt-5 grid gap-3">
            <SignalMetric icon={UsersRound} label="aktif topluluk" value={communities.length} tone="blue" />
            <SignalMetric icon={Sparkles} label="toplam üye" value={totalMembers} tone="orange" />
            <SignalMetric icon={Radio} label="gönderi hareketi" value={totalPosts} tone="green" />
          </div>
        </Card>
      </AnimatedSection>

      <OrganicGrid className="grid gap-4 md:grid-cols-3">
        <SignalMetric icon={UsersRound} label="aktif topluluk" value={communities.length} tone="blue" />
        <SignalMetric icon={Bell} label="takip sinyali" value={totalFollowers} tone="purple" />
        <SignalMetric icon={CheckCircle2} label="onay kuyruğum" value={applicationCount} tone="amber" />
      </OrganicGrid>

      <AnimatedSection>
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <PulseBadge tone="orange">topluluk tara</PulseBadge>
              <h2 className="mt-2 text-xl font-black text-slate-950">Sinyal ara</h2>
            </div>
            <LinkButton href="/communities" variant="ghost">Aramayı temizle</LinkButton>
          </div>
          <form className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="relative">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={query.q ?? ""}
                placeholder="Topluluk, kulüp veya ilgi alanı ara"
                className="h-11 w-full rounded-2xl border border-white/80 bg-white/85 pl-11 pr-4 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              />
            </label>
            <Button variant="secondary">Tara</Button>
          </form>
        </Card>
      </AnimatedSection>

      {query.message ? (
        <AnimatedSection>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
            {query.message}
          </div>
        </AnimatedSection>
      ) : null}

      {profile && applicationCount ? (
        <AnimatedSection>
          <Card className="space-y-4 border-amber-200/80 bg-amber-50/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <PulseBadge tone="amber" live>
                  onay kuyruğu
                </PulseBadge>
                <h2 className="mt-2 text-xl font-black text-slate-950">Başvurularım</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Topluluk ve etkinlik taleplerinin moderasyon durumunu buradan takip edebilirsin.
                </p>
              </div>
              <Badge tone="amber">{applicationCount} kayıt</Badge>
            </div>
            <OrganicGrid className="grid gap-3 md:grid-cols-2">
              {ownCommunities.map((community: any) => (
                <div
                  key={community.id}
                  className="rounded-3xl border border-amber-200 bg-white/80 px-4 py-3 text-sm shadow-sm"
                >
                  <div className="font-black text-slate-950">Topluluk: {community.name}</div>
                  <div className="mt-1 text-xs font-black text-amber-800">
                    {community.status === "pending" ? "Onay bekliyor" : `Reddedildi: ${community.rejection_reason ?? "sebep girilmedi"}`}
                  </div>
                </div>
              ))}
              {ownEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="rounded-3xl border border-amber-200 bg-white/80 px-4 py-3 text-sm shadow-sm"
                >
                  <div className="font-black text-slate-950">Etkinlik: {event.title}</div>
                  <div className="mt-1 text-xs font-black text-amber-800">
                    {event.status === "pending" ? "Onay bekliyor" : `Reddedildi: ${event.rejection_reason ?? "sebep girilmedi"}`}
                  </div>
                </div>
              ))}
            </OrganicGrid>
          </Card>
        </AnimatedSection>
      ) : null}

      <AnimatedSection className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <PulseBadge tone="green" live={communities.length > 0}>
              topluluk sinyalleri
            </PulseBadge>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Aktif alanlar</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              En aktif topluluk büyük kartta, diğer sinyaller değişken boyutlu bento akışında görünür.
            </p>
          </div>
        </div>

        {communities.length ? (
          <OrganicGrid className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featured ? (
              <BentoCard size="lg" tone="blue" className="bg-slate-950 text-white">
                <div className="flex h-full flex-col justify-between gap-8">
                  <div>
                    <PulseBadge tone="blue" live>
                      bu hafta parlayan topluluk
                    </PulseBadge>
                    <h3 className="mt-5 text-3xl font-black leading-tight">{featured.name}</h3>
                    <p className="mt-3 line-clamp-5 text-sm leading-6 text-slate-300">
                      {featured.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="rounded-3xl bg-white/10 px-4 py-3 text-sm font-black ring-1 ring-white/15">
                      {featuredCommunityLabel(featured)}
                    </div>
                    <Link
                      href={`/communities/${featured.slug}`}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-orange-50"
                    >
                      Aç
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              </BentoCard>
            ) : null}

            {others.map((community: any, index: number) =>
              index < 2 ? (
                <BentoCard key={community.id} tone={index % 2 === 0 ? "orange" : "green"} size="wide">
                  <PulseBadge tone={index % 2 === 0 ? "orange" : "green"} live>
                    aktif sinyal
                  </PulseBadge>
                  <h3 className="mt-4 text-2xl font-black text-slate-950">{community.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                    {community.description}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Badge tone="blue">{community.community_members?.[0]?.count ?? 0} üye</Badge>
                    <Badge tone="green">{community.posts?.[0]?.count ?? 0} gönderi</Badge>
                    <Link
                      href={`/communities/${community.slug}`}
                      className="ml-auto inline-flex items-center gap-1 text-sm font-black text-[var(--primary)]"
                    >
                      Aç <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </BentoCard>
              ) : (
                <CommunityCard key={community.id} community={community} />
              ),
            )}
          </OrganicGrid>
        ) : (
          <EmptyState
            title="İlk topluluk sinyali bekleniyor"
            body="Onaylanan ilk topluluk burada üyeleri, takipçileri ve son aktivite bilgisiyle okulun aktif alanına dönüşecek."
            icon={<UsersRound className="size-5" />}
            action={<LinkButton href="/communities/new">Topluluk kur</LinkButton>}
          />
        )}
      </AnimatedSection>
    </div>
  );
}
