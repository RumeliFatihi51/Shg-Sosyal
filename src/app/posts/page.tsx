import Link from "next/link";
import { Clock, Compass, MessageCircle, Plus, Radio, Search, Send, Sparkles, TrendingUp } from "lucide-react";
import { AnimatedSection, OrganicGrid } from "@/components/motion";
import {
  AgendaItem,
  BentoCard,
  CampusBoardPanel,
  PulseBadge,
  SignalMetric,
  guessPostCategory,
} from "@/components/radar";
import { SubmitButton } from "@/components/submit-button";
import { Button, Card, EmptyState, Field, LinkButton, TextArea } from "@/components/ui";
import { PostCard, postScore } from "@/features/posts/post-card";
import { createPostAction } from "@/lib/actions/communities";
import { getPostFormData, getPostsFeedData } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";

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
      <AnimatedSection className="mx-auto max-w-3xl">
        <BentoCard tone="purple" className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-purple-100 text-purple-700">
            <Compass className="size-7" />
          </div>
          <h1 className="mt-5 text-3xl font-black text-slate-950">Okul gündemi girişten sonra açılır</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Topluluk gönderileri, beğeniler, eksi oylar ve yorumlar okul içi hesapla görüntülenir. Etkinlikler ise herkese açık kalır.
          </p>
          <div className="mt-6 flex justify-center">
            <LinkButton href="/login">Giriş yap</LinkButton>
          </div>
        </BentoCard>
      </AnimatedSection>
    );
  }

  const data = await getPostsFeedData(query);
  const formData = await getPostFormData();
  const sort = data.sort;
  const currentUrl = `/posts?sort=${sort}&q=${encodeURIComponent(query.q ?? "")}&community=${encodeURIComponent(query.community ?? "")}`;
  const totalScore = data.posts.reduce((sum: number, post: any) => sum + postScore(post), 0);
  const totalComments = data.posts.reduce(
    (sum: number, post: any) =>
      sum + (Array.isArray(post.comments) ? post.comments.length : post.comments?.[0]?.count ?? 0),
    0,
  );
  const topPost = data.posts[0];
  const boardItems = [
    {
      title: `${data.posts.length} gündem sinyali`,
      body: query.q || query.community ? "Filtre sonucundaki konuşmalar." : "Okulun son paylaşımları.",
      icon: MessageCircle,
      tone: "orange" as const,
    },
    {
      title: `${totalScore} net skor`,
      body: "Beğeni ve eksi oy dengesi.",
      icon: TrendingUp,
      tone: "green" as const,
    },
    {
      title: `${totalComments} yorum hareketi`,
      body: "Sohbetin nerede yoğunlaştığını gösterir.",
      icon: Radio,
      tone: "blue" as const,
    },
    {
      title: topPost ? guessPostCategory(topPost) : "Sohbet",
      body: topPost?.title ?? "İlk gönderiyle okul gündemi canlanacak.",
      icon: Sparkles,
      tone: "purple" as const,
    },
  ];

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_370px]">
      <section className="space-y-7">
        <AnimatedSection className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <PulseBadge tone="purple" live>
              Okulun Gündemi
            </PulseBadge>
            <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-slate-950 text-balance sm:text-5xl">
              Bugün okulda ne konuşuluyor?
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Reddit gibi taranabilir, Instagram gibi canlı: soru, duyuru, etkinlik, anket ve sohbet sinyalleri tek akışta.
            </p>
          </div>
          <Link
            href="#new-post"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-[var(--primary)]"
          >
            <Plus className="size-4" />
            Gündeme konu bırak
          </Link>
        </AnimatedSection>

        <AnimatedSection>
          <CampusBoardPanel
            items={boardItems}
            eyebrow="Gündem Panosu"
            title="Okulun Konuşulanları"
            description="Soru, duyuru, etkinlik ve sohbet başlıkları daha düzenli bir sosyal akış panosunda toplanır."
            featured={
              topPost
                ? {
                    title: topPost.title,
                    body: `${guessPostCategory(topPost)} · ${topPost.communities?.name ?? "Topluluk"}`,
                    href: `/posts/${topPost.id}`,
                  }
                : null
            }
          />
        </AnimatedSection>

        <OrganicGrid className="grid gap-4 sm:grid-cols-3">
          <SignalMetric icon={MessageCircle} label="gönderi" value={data.posts.length} tone="orange" />
          <SignalMetric icon={TrendingUp} label="net skor" value={totalScore} tone="green" />
          <SignalMetric icon={Clock} label="yorum hareketi" value={totalComments} tone="blue" />
        </OrganicGrid>

        {query.message ? (
          <AnimatedSection>
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
              {query.message}
            </div>
          </AnimatedSection>
        ) : null}

        <AnimatedSection>
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <PulseBadge tone="blue">gündem filtresi</PulseBadge>
                <h2 className="mt-2 text-xl font-black text-slate-950">Akışı tara</h2>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/posts?sort=new&q=${encodeURIComponent(query.q ?? "")}&community=${encodeURIComponent(query.community ?? "")}`}
                  className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-black transition ${
                    sort === "new"
                      ? "bg-slate-950 text-white"
                      : "border border-white/80 bg-white/80 text-slate-600 hover:bg-orange-50"
                  }`}
                >
                  <Clock className="size-4" />
                  En Yeni
                </Link>
                <Link
                  href={`/posts?sort=popular&q=${encodeURIComponent(query.q ?? "")}&community=${encodeURIComponent(query.community ?? "")}`}
                  className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-black transition ${
                    sort === "popular"
                      ? "bg-slate-950 text-white"
                      : "border border-white/80 bg-white/80 text-slate-600 hover:bg-orange-50"
                  }`}
                >
                  <TrendingUp className="size-4" />
                  Popüler
                </Link>
              </div>
            </div>

            <form className="grid gap-3 md:grid-cols-[1fr_190px_auto]">
              <label className="relative">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="q"
                  defaultValue={query.q ?? ""}
                  placeholder="Gönderi, soru veya duyuru ara"
                  className="h-11 w-full rounded-2xl border border-white/80 bg-white/85 pl-11 pr-4 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                />
              </label>
              <select
                name="community"
                defaultValue={query.community ?? ""}
                className="h-11 rounded-2xl border border-white/80 bg-white/85 px-4 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              >
                <option value="">Tüm topluluklar</option>
                {data.communities.map((community: any) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
              <Button variant="secondary">Tara</Button>
            </form>
          </Card>
        </AnimatedSection>

        <AnimatedSection className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <PulseBadge tone="green" live={data.posts.length > 0}>
                okul nabzı
              </PulseBadge>
              <h2 className="mt-3 text-3xl font-black text-slate-950">Gündem akışı</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Kategori rozetleri, skor ve yorum yoğunluğu hangi konunun öne çıktığını hızlı gösterir.
              </p>
            </div>
          </div>

          {data.posts.length ? (
            <div className="grid gap-5">
              <OrganicGrid className="grid gap-4 lg:grid-cols-2">
                {data.posts.slice(0, 4).map((post: any) => (
                  <AgendaItem
                    key={`agenda-${post.id}`}
                    category={guessPostCategory(post)}
                    title={post.title}
                    body={post.body}
                    meta={post.communities?.name ?? "Topluluk"}
                    href={`/posts/${post.id}`}
                    score={postScore(post)}
                    comments={Array.isArray(post.comments) ? post.comments.length : post.comments?.[0]?.count ?? 0}
                  />
                ))}
              </OrganicGrid>
              <OrganicGrid className="grid gap-4">
                {data.posts.map((post: any) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    returnTo={currentUrl}
                    currentUserId={data.profile.id}
                    category={guessPostCategory(post)}
                  />
                ))}
              </OrganicGrid>
            </div>
          ) : (
            <EmptyState
              title="İlk gündem başlığını sen aç"
              body="Filtrelerde gönderi bulunamadı. Üyesi olduğun toplulukta soru, duyuru veya sohbet başlatabilirsin."
              icon={<MessageCircle className="size-5" />}
              action={<LinkButton href="#new-post">Gündeme konu bırak</LinkButton>}
            />
          )}
        </AnimatedSection>
      </section>

      <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
        <AnimatedSection>
          <Card id="new-post" className="space-y-4">
            <div>
              <PulseBadge tone="orange" live>
                paylaşım paneli
              </PulseBadge>
              <h2 className="mt-3 text-2xl font-black text-slate-950">Gündeme konu bırak</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Üyesi olduğun toplulukta soru sor, duyuru yap veya sohbet başlat.
              </p>
            </div>
            {formData.communities.length ? (
              <form action={createPostAction} className="grid gap-4">
                <input type="hidden" name="return_to" value="/posts" />
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Topluluk
                  <select
                    name="community_id"
                    required
                    className="h-11 rounded-2xl border border-white/80 bg-white/85 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                  >
                    {formData.communities.map((community: any) => (
                      <option key={community.id} value={community.id}>
                        {community.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Field label="Başlık" name="title" required placeholder="Örn. Turnuva için takım arıyoruz" />
                <TextArea label="Metin" name="body" required rows={5} placeholder="Kısa, net ve okul gündemine uygun yaz." />
                <SubmitButton pendingLabel="Gündeme ekleniyor...">
                  <Send className="size-4" />
                  Paylaş
                </SubmitButton>
              </form>
            ) : (
              <EmptyState
                title="Topluluk üyeliğin yok"
                body="Gönderi paylaşmak için önce bir topluluğa katıl."
                icon={<Compass className="size-5" />}
                action={<LinkButton href="/communities">Topluluklara göz at</LinkButton>}
              />
            )}
          </Card>
        </AnimatedSection>
      </aside>
    </div>
  );
}
