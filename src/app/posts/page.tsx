import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Compass,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { Avatar, Button, LinkButton, TextArea } from "@/components/ui";
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
import { createPostAction } from "@/lib/actions/communities";
import { votePostAction } from "@/lib/actions/posts";
import { getPostFormData, getPostsFeedData } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";
import { cn, fullName } from "@/lib/utils";
import { guessPostCategory } from "@/components/radar";
import { postScore, userPostVote } from "@/features/posts/post-card";

export const dynamic = "force-dynamic";

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string; community?: string; message?: string }>;
}) {
  const query = await searchParams;
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <SocialPage
        rail={<PublicRail />}
      >
        <StickyPageHeader title="Keşfet" subtitle="Okul gündemi, topluluk paylaşımları ve konuşulanlar." />
        <TimelineSurface>
          <InlineEmpty
            title="Giriş yap"
            body="Paylaşmak ve okul gündemini görmek için hesabına gir."
            action={<LinkButton href="/login">Giriş yap</LinkButton>}
          />
        </TimelineSurface>
      </SocialPage>
    );
  }

  const data = await getPostsFeedData(query);
  const formData = await getPostFormData();
  const sort = data.sort;
  const currentUrl = `/posts?sort=${sort}&q=${encodeURIComponent(query.q ?? "")}&community=${encodeURIComponent(query.community ?? "")}`;
  const topPosts = [...data.posts].sort((a: any, b: any) => postScore(b) - postScore(a)).slice(0, 4);

  return (
    <SocialPage
      rail={
        <PostsRail
          posts={topPosts}
          communities={data.communities}
          formCommunities={formData.communities}
        />
      }
    >
      <StickyPageHeader title="Keşfet">
        <PageTabs
          tabs={[
            { label: "Yeni", href: `/posts?sort=new&q=${encodeURIComponent(query.q ?? "")}&community=${encodeURIComponent(query.community ?? "")}`, active: sort === "new" },
            { label: "Popüler", href: `/posts?sort=popular&q=${encodeURIComponent(query.q ?? "")}&community=${encodeURIComponent(query.community ?? "")}`, active: sort === "popular" },
            { label: "Topluluklar", href: "/communities" },
            { label: "Etkinlikler", href: "/events" },
          ]}
        />
        <form className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="sort" value={sort} />
          <SearchBox defaultValue={query.q} placeholder="Etkinlik, topluluk veya konu ara" />
          <select
            name="community"
            defaultValue={query.community ?? ""}
            className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="">Tümü</option>
            {data.communities.map((community: any) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
          <Button variant="secondary">Ara</Button>
        </form>
      </StickyPageHeader>

      {query.message ? (
        <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {query.message}
        </div>
      ) : null}

      {formData.communities.length ? (
        <div className="border-b border-slate-100 bg-white px-4 py-4">
          <form action={createPostAction} className="flex gap-3">
            <Avatar firstName={profile.first_name} lastName={profile.last_name} size="sm" />
            <div className="min-w-0 flex-1 space-y-3">
              <input type="hidden" name="return_to" value="/posts" />
              <select
                name="community_id"
                required
                className="h-9 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-600 outline-none"
              >
                {formData.communities.map((community: any) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
              <input
                name="title"
                required
                placeholder="Okulda ne konuşuluyor?"
                className="w-full bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400"
              />
              <TextArea
                label="Metin"
                name="body"
                required
                rows={2}
                placeholder="Kısa yaz, detay isteyen gönderiye girsin."
              />
              <div className="flex justify-end">
                <SubmitButton pendingLabel="Paylaşılıyor...">
                  <Send className="size-4" />
                  Paylaş
                </SubmitButton>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      <TimelineSurface>
        {data.posts.length ? (
          data.posts.map((post: any) => (
            <PostTimelineItem
              key={post.id}
              post={post}
              currentUserId={data.profile.id}
              returnTo={currentUrl}
            />
          ))
        ) : (
          <InlineEmpty
            title="Henüz paylaşım yok"
            body="Bu haftanın ilk gönderisini sen paylaş."
            action={<LinkButton href="/communities" variant="secondary">Topluluklara bak</LinkButton>}
          />
        )}
      </TimelineSurface>
    </SocialPage>
  );
}

function PostTimelineItem({
  post,
  currentUserId,
  returnTo,
}: {
  post: any;
  currentUserId: string;
  returnTo: string;
}) {
  const score = postScore(post);
  const currentVote = userPostVote(post, currentUserId);
  const comments = post.comment_count ?? (Array.isArray(post.comments)
    ? post.comments.length
    : post.comments?.[0]?.count ?? 0);
  const category = guessPostCategory(post);

  return (
    <TimelineRow
      avatar={<Avatar firstName={post.profiles?.first_name} lastName={post.profiles?.last_name} size="sm" />}
      title={post.communities?.name ?? "Topluluk"}
      meta={`· ${fullName(post.profiles)} · ${formatRelative(post.created_at)}`}
      badge={<SocialBadge tone={categoryTone(category)}>{category}</SocialBadge>}
      body={
        <Link href={`/posts/${post.id}`} className="block">
          <span className="block text-base font-semibold text-slate-950 hover:underline">{post.title}</span>
          <span className="mt-1 line-clamp-3 block text-sm leading-6 text-slate-600">{post.body}</span>
        </Link>
      }
      actions={
        <>
          <Link href={`/posts/${post.id}`} className="inline-flex items-center gap-1.5 hover:text-slate-950">
            <MessageCircle className="size-4" />
            Yanıtla {comments ? comments : ""}
          </Link>
          <VoteButton postId={post.id} direction={1} active={currentVote === 1} returnTo={returnTo} />
          <span className="text-xs font-black text-slate-500">{score}</span>
          <VoteButton postId={post.id} direction={-1} active={currentVote === -1} returnTo={returnTo} />
          <Link href={`/posts/${post.id}`} className="hover:text-slate-950">Aç</Link>
        </>
      }
    />
  );
}

function VoteButton({
  postId,
  direction,
  active,
  returnTo,
}: {
  postId: string;
  direction: 1 | -1;
  active: boolean;
  returnTo: string;
}) {
  const Icon = direction === 1 ? ChevronUp : ChevronDown;

  return (
    <form action={votePostAction}>
      <input type="hidden" name="post_id" value={postId} />
      <input type="hidden" name="direction" value={String(direction)} />
      <input type="hidden" name="return_to" value={returnTo} />
      <button
        type="submit"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-1 transition hover:text-orange-700",
          active && "font-black text-orange-700",
        )}
      >
        <Icon className="size-4" />
        {direction === 1 ? "Beğen" : "Eksi"}
      </button>
    </form>
  );
}

function PostsRail({
  posts,
  communities,
  formCommunities,
}: {
  posts: any[];
  communities: any[];
  formCommunities: any[];
}) {
  return (
    <>
      <RailSection title="Konuşulanlar" actionHref="/posts?sort=popular">
        {posts.length ? posts.map((post) => (
          <RailItem
            key={post.id}
            title={post.title}
            meta={`${post.communities?.name ?? "Topluluk"} · ${postScore(post)} skor`}
            href={`/posts/${post.id}`}
            icon={Sparkles}
          />
        )) : <RailItem title="Bugün henüz sakin." meta="İlk gönderiyi sen paylaş." icon={MessageCircle} />}
      </RailSection>
      <RailSection title="Aktif topluluklar" actionHref="/communities">
        {communities.slice(0, 5).map((community: any) => (
          <RailItem
            key={community.id}
            title={community.name}
            meta="Topluluğu görüntüle"
            href={`/communities/${community.slug}`}
            icon={Compass}
          />
        ))}
      </RailSection>
      <RailSection title="Paylaş">
        <div className="px-4 py-3 text-sm text-slate-600">
          {formCommunities.length ? (
            <Link href="#top" className="inline-flex items-center gap-2 font-black text-slate-950">
              <Plus className="size-4" />
              Gündeme gönderi bırak
            </Link>
          ) : (
            <Link href="/communities" className="font-black text-sky-600">Önce bir topluluğa katıl</Link>
          )}
        </div>
      </RailSection>
    </>
  );
}

function PublicRail() {
  return (
    <RailSection title="ŞHG Sosyal">
      <RailItem title="Etkinlikleri herkes görebilir." meta="Gönderiler için giriş yap." icon={Compass} />
    </RailSection>
  );
}

function categoryTone(category: string) {
  if (category === "Soru") return "blue";
  if (category === "Duyuru") return "orange";
  if (category === "Etkinlik") return "green";
  if (category === "Anket") return "purple";
  if (category === "Yardım") return "amber";
  return "slate";
}

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));

  if (minutes < 1) return "şimdi";
  if (minutes < 60) return `${minutes} dk`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;

  return `${Math.floor(hours / 24)} g`;
}
