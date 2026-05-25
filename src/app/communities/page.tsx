import Link from "next/link";
import { Bell, CheckCircle2, Plus, UsersRound } from "lucide-react";
import { Avatar, Button, LinkButton } from "@/components/ui";
import {
  FilterChips,
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
import { joinCommunityAction } from "@/lib/actions/communities";
import { getCommunitiesData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; q?: string; tab?: string }>;
}) {
  const query = await searchParams;
  const { profile, communities, ownCommunities, ownEvents } =
    await getCommunitiesData(query.q ?? "");
  const activeCommunities = [...communities].sort((a: any, b: any) =>
    communityActivity(b) - communityActivity(a),
  );
  const newCommunities = [...communities].sort((a: any, b: any) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const applicationCount = ownCommunities.length + ownEvents.length;
  const tab = query.tab ?? "suggested";
  const shownCommunities = tab === "active"
    ? activeCommunities
    : tab === "new"
      ? newCommunities
      : communities;

  return (
    <SocialPage
      rail={
        <CommunitiesRail
          communities={communities}
          applicationCount={applicationCount}
          signedIn={Boolean(profile)}
        />
      }
    >
      <StickyPageHeader
        title="Topluluklar"
        action={
          <LinkButton href={profile ? "/communities/new" : "/login"} className="h-10 px-4">
            <Plus className="size-4" />
            Topluluk kur
          </LinkButton>
        }
      >
        <PageTabs
          tabs={[
            { label: "Önerilen", href: "/communities?tab=suggested", active: tab === "suggested" },
            { label: "Aktif", href: "/communities?tab=active", active: tab === "active" },
            { label: "Yeni", href: "/communities?tab=new", active: tab === "new" },
            { label: "Başvurularım", href: "/communities?tab=requests", active: tab === "requests" },
          ]}
        />
        <form className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="tab" value={tab} />
          <SearchBox defaultValue={query.q} placeholder="Topluluk ara" />
          <Button variant="secondary">Ara</Button>
        </form>
        <div className="mt-3">
          <FilterChips
            chips={[
              { label: "Tümü", href: "/communities", active: !query.q },
              { label: "Spor", href: "/communities?q=spor", active: query.q === "spor" },
              { label: "Sanat", href: "/communities?q=sanat", active: query.q === "sanat" },
              { label: "Teknoloji", href: "/communities?q=teknoloji", active: query.q === "teknoloji" },
              { label: "Sosyal", href: "/communities?q=sosyal", active: query.q === "sosyal" },
            ]}
          />
        </div>
      </StickyPageHeader>

      {query.message ? (
        <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {query.message}
        </div>
      ) : null}

      {tab === "requests" ? (
        <TimelineSurface>
          {applicationCount ? (
            <>
              {ownCommunities.map((community: any) => (
                <TimelineRow
                  key={community.id}
                  icon={<CircleIcon label={community.name} />}
                  title={community.name}
                  meta="· topluluk başvurusu"
                  badge={<SocialBadge tone={community.status === "pending" ? "amber" : "red"}>{community.status === "pending" ? "Onay bekliyor" : "Reddedildi"}</SocialBadge>}
                  body={community.status === "pending" ? "Başvurun yönetim onayında." : community.rejection_reason ?? "Sebep girilmedi."}
                />
              ))}
              {ownEvents.map((event: any) => (
                <TimelineRow
                  key={event.id}
                  icon={<CircleIcon label={event.title} />}
                  title={event.title}
                  meta="· etkinlik başvurusu"
                  badge={<SocialBadge tone={event.status === "pending" ? "amber" : "red"}>{event.status === "pending" ? "Onay bekliyor" : "Reddedildi"}</SocialBadge>}
                  body={event.status === "pending" ? "Etkinlik talebin yönetim onayında." : event.rejection_reason ?? "Sebep girilmedi."}
                />
              ))}
            </>
          ) : (
            <InlineEmpty title="Başvuru yok" body="Topluluk kurabilir veya etkinlik önerebilirsin." />
          )}
        </TimelineSurface>
      ) : (
        <TimelineSurface>
          {shownCommunities.length ? shownCommunities.map((community: any) => (
            <CommunityTimelineItem
              key={community.id}
              community={community}
              signedIn={Boolean(profile)}
            />
          )) : (
            <InlineEmpty
              title="Topluluk bulunamadı"
              body="Topluluklar hareketlenmeye hazır."
              action={<LinkButton href="/communities/new">Topluluk kur</LinkButton>}
            />
          )}
        </TimelineSurface>
      )}
    </SocialPage>
  );
}

function CommunityTimelineItem({
  community,
  signedIn,
}: {
  community: any;
  signedIn: boolean;
}) {
  const members = community.member_count ?? community.community_members?.[0]?.count ?? 0;
  const posts = community.post_count ?? community.posts?.[0]?.count ?? 0;
  const active = communityActivity(community) > 0;

  return (
    <TimelineRow
      avatar={<CircleIcon label={community.name} />}
      title={community.name}
      meta={`· ${members} üye · ${posts ? `${posts} gönderi` : "Henüz paylaşım yok"}`}
      badge={<SocialBadge tone={active ? "green" : "slate"}>{active ? "Bugün aktif" : "Topluluğu görüntüle"}</SocialBadge>}
      body={<span className="line-clamp-2">{community.description}</span>}
      actions={
        <>
          <Link href={`/communities/${community.slug}`} className="font-black text-slate-950 hover:text-orange-700">
            Görüntüle
          </Link>
          {signedIn ? (
            <form action={joinCommunityAction}>
              <input type="hidden" name="community_id" value={community.id} />
              <button type="submit" className="font-black text-slate-950 hover:text-orange-700">
                Katıl
              </button>
            </form>
          ) : (
            <Link href="/login" className="font-black text-slate-950 hover:text-orange-700">
              Katıl
            </Link>
          )}
        </>
      }
    />
  );
}

function CommunitiesRail({
  communities,
  applicationCount,
  signedIn,
}: {
  communities: any[];
  applicationCount: number;
  signedIn: boolean;
}) {
  const active = [...communities].sort((a: any, b: any) => communityActivity(b) - communityActivity(a));

  return (
    <>
      <RailSection title="Aktif topluluklar">
        {active.slice(0, 5).map((community: any) => (
          <RailItem
            key={community.id}
            title={community.name}
            meta={`${community.member_count ?? community.community_members?.[0]?.count ?? 0} üye`}
            href={`/communities/${community.slug}`}
            icon={UsersRound}
          />
        ))}
      </RailSection>
      <RailSection title="Yeni kurulanlar" actionHref="/communities?tab=new">
        {communities.slice(0, 4).map((community: any) => (
          <RailItem key={community.id} title={community.name} meta="Topluluğu görüntüle" href={`/communities/${community.slug}`} icon={Bell} />
        ))}
      </RailSection>
      <RailSection title="Kısa yollar">
        <RailItem title="Topluluk kur" meta={signedIn ? "Başvuru gönder" : "Giriş yap"} href={signedIn ? "/communities/new" : "/login"} icon={Plus} />
        <RailItem title="Başvurularım" meta={applicationCount ? `${applicationCount} kayıt` : "Başvuru yok"} href="/communities?tab=requests" icon={CheckCircle2} />
      </RailSection>
    </>
  );
}

function CircleIcon({ label }: { label: string }) {
  return (
    <Avatar
      firstName={label.slice(0, 1)}
      lastName={label.split(" ")[1]?.slice(0, 1) ?? ""}
      size="sm"
    />
  );
}

function communityActivity(community: any) {
  return (
    community.activity_24h_count ??
    community.trend_score ??
    community.posts?.[0]?.count ??
    community.post_count ??
    0
  );
}
