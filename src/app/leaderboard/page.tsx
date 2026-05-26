import { Flame, Medal, School, Trophy } from "lucide-react";
import { getLeaderboardData } from "@/features/rewards/queries";
import {
  InlineEmpty,
  PageTabs,
  RailItem,
  RailSection,
  SocialBadge,
  SocialPage,
  StickyPageHeader,
  TimelineRow,
  TimelineSurface,
} from "@/components/social-ui";
import { Avatar, LinkButton } from "@/components/ui";
import { fullName } from "@/lib/utils";
import type {
  LeaderboardClassRow,
  LeaderboardCommunityRow,
  LeaderboardUserRow,
} from "@/features/rewards/types";

export const dynamic = "force-dynamic";

const tabs = [
  { label: "Günlük", scope: "daily" },
  { label: "Haftalık", scope: "weekly" },
  { label: "Genel", scope: "all" },
  { label: "Topluluklar", scope: "communities" },
  { label: "Sınıflar", scope: "classes" },
];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const query = await searchParams;
  const data = await getLeaderboardData(query.scope ?? "weekly");

  return (
    <SocialPage
      rail={
        <>
          <RailSection title="Bu hafta">
            {data.users.slice(0, 3).map((row) => (
              <RailItem
                key={row.user_id}
                title={`${row.rank}. ${fullName({ first_name: row.first_name, last_name: row.last_name })}`}
                meta={`${row.points} puan`}
                href={`/profile/${row.user_id}`}
                icon={Medal}
              />
            ))}
            {!data.users.length ? <RailItem title="Liste henüz sakin." meta="Puan kazandıkça açılır." icon={Trophy} /> : null}
          </RailSection>
          <RailSection title="Rozetler">
            <RailItem title="Rozet kataloğu" meta="Hedeflerini gör" href="/badges" icon={Flame} />
            {data.myRank ? (
              <RailItem title={`${data.myRank.rank}. sıradasın`} meta={`${data.myRank.points} puan`} icon={Trophy} />
            ) : (
              <RailItem title="Henüz sırada değilsin" meta="İlk puanını kazan" icon={Trophy} />
            )}
          </RailSection>
        </>
      }
    >
      <StickyPageHeader title="Sıralama" subtitle="Okulda bu dönem kimler aktif?">
        <PageTabs
          tabs={tabs.map((tab) => ({
            label: tab.label,
            href: `/leaderboard?scope=${tab.scope}`,
            active: data.scope === tab.scope,
          }))}
        />
      </StickyPageHeader>

      <TimelineSurface>
        {data.scope === "communities" ? (
          <CommunityRows rows={data.communities} />
        ) : data.scope === "classes" ? (
          <ClassRows rows={data.classes} />
        ) : (
          <UserRows rows={data.users} />
        )}
      </TimelineSurface>
    </SocialPage>
  );
}

function UserRows({ rows }: { rows: LeaderboardUserRow[] }) {
  if (!rows.length) {
    return (
      <InlineEmpty
        title="Liste henüz sakin."
        body="Etkinliğe katıl, gönderi paylaş veya yorum yap."
        action={<LinkButton href="/events">Etkinliklere bak</LinkButton>}
      />
    );
  }

  return rows.map((row) => (
    <TimelineRow
      key={row.user_id}
      avatar={<Avatar firstName={row.first_name} lastName={row.last_name} size="md" />}
      title={fullName({ first_name: row.first_name, last_name: row.last_name })}
      meta={row.tag ?? row.username ?? row.class_name ?? ""}
      badge={<RankBadge rank={row.rank} />}
      body={`${row.points} puan`}
      href={`/profile/${row.user_id}`}
    />
  ));
}

function CommunityRows({ rows }: { rows: LeaderboardCommunityRow[] }) {
  if (!rows.length) {
    return <InlineEmpty title="Topluluk listesi sakin." body="Topluluklar paylaşım yaptıkça sıralama oluşur." />;
  }

  return rows.map((row) => (
    <TimelineRow
      key={row.community_id}
      icon={<span className="flex size-11 items-center justify-center rounded-full bg-cyan-400 text-sm font-black text-[#020617]">{row.name.slice(0, 2).toLocaleUpperCase("tr-TR")}</span>}
      title={row.name}
      meta={`${row.member_count ?? 0} üye · ${row.post_count ?? 0} gönderi`}
      badge={<RankBadge rank={row.rank} />}
      body={`${row.points} topluluk puanı`}
      href={`/communities/${row.slug}`}
    />
  ));
}

function ClassRows({ rows }: { rows: LeaderboardClassRow[] }) {
  if (!rows.length) {
    return <InlineEmpty title="Sınıf listesi sakin." body="Sınıflar puan kazandıkça burada görünür." />;
  }

  return rows.map((row) => (
    <TimelineRow
      key={row.class_name ?? row.rank}
      icon={<span className="flex size-11 items-center justify-center rounded-full bg-emerald-400 text-[#020617]"><School className="size-5" /></span>}
      title={row.class_name ?? "Sınıf belirtilmemiş"}
      meta={`${row.user_count} öğrenci`}
      badge={<RankBadge rank={row.rank} />}
      body={`${row.points} haftalık puan`}
    />
  ));
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <SocialBadge tone="amber">1.</SocialBadge>;
  if (rank === 2) return <SocialBadge tone="blue">2.</SocialBadge>;
  if (rank === 3) return <SocialBadge tone="green">3.</SocialBadge>;

  return <SocialBadge>{rank}.</SocialBadge>;
}
