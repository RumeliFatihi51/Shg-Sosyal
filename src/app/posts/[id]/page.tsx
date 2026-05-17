import Link from "next/link";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { addCommentAction, reportContentAction, votePostAction } from "@/lib/actions/posts";
import { getPostDetail } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";
import { Avatar, Button, Card, EmptyState, LinkButton, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { fullName } from "@/lib/utils";
import { postScore, userPostVote } from "@/features/posts/post-card";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="space-y-4 text-center">
          <MessageCircle className="mx-auto size-10 text-[#f05a28]" />
          <h1 className="text-2xl font-black text-slate-950">Gönderiyi görmek için giriş yap</h1>
          <p className="text-sm leading-6 text-slate-600">
            Gönderiler, yorumlar ve oylar okul hesabıyla görüntülenir.
          </p>
          <LinkButton href="/login">Giriş yap</LinkButton>
        </Card>
      </div>
    );
  }

  const { post, comments } = await getPostDetail(id);
  const currentVote = userPostVote(post, profile.id);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section className="space-y-4">
        {query.message ? (
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
            {query.message}
          </div>
        ) : null}
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/communities/${(post as any).communities?.slug}`}
              className="text-sm font-bold text-blue-700 hover:underline"
            >
              {(post as any).communities?.name ?? "Topluluk"}
            </Link>
            <span className="text-xs font-semibold text-slate-500">
              {new Date(post.created_at).toLocaleString("tr-TR")}
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-950">{post.title}</h1>
          <p className="whitespace-pre-line text-base leading-8 text-slate-700">
            {post.body}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Avatar
                firstName={(post as any).profiles?.first_name}
                lastName={(post as any).profiles?.last_name}
                size="sm"
              />
              {fullName((post as any).profiles)}
            </div>
            <div className="flex items-center gap-2">
              <form action={votePostAction}>
                <input type="hidden" name="post_id" value={post.id} />
                <input type="hidden" name="direction" value="1" />
                <Button variant={currentVote === 1 ? "primary" : "secondary"}>
                  <ChevronUp className="size-4" />
                  Beğen
                </Button>
              </form>
              <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-black text-slate-950">
                {postScore(post)}
              </span>
              <form action={votePostAction}>
                <input type="hidden" name="post_id" value={post.id} />
                <input type="hidden" name="direction" value="-1" />
                <Button variant={currentVote === -1 ? "danger" : "ghost"}>
                  <ChevronDown className="size-4" />
                  Eksi oy
                </Button>
              </form>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <MessageCircle className="size-5" />
            Yorumlar
          </h2>
          <form action={addCommentAction} className="grid gap-3">
            <input type="hidden" name="post_id" value={post.id} />
            <TextArea label="Yorum yaz" name="body" required rows={3} />
            <SubmitButton pendingLabel="Yorum ekleniyor...">Yorum ekle</SubmitButton>
          </form>
          {comments.length ? (
            <div className="grid gap-3 border-t border-slate-100 pt-4">
              {comments.map((comment: any) => (
                <div key={comment.id} className="rounded-md bg-slate-50 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Avatar
                      firstName={comment.profiles?.first_name}
                      lastName={comment.profiles?.last_name}
                      size="sm"
                    />
                    {fullName(comment.profiles)}
                  </div>
                  <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
                    {comment.body}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Yorum yok" body="İlk yorumu sen yazabilirsin." />
          )}
        </Card>
      </section>

      <aside>
        <Card className="space-y-4">
          <h2 className="text-xl font-black text-slate-950">Raporla</h2>
          <form action={reportContentAction} className="grid gap-3">
            <input type="hidden" name="target_type" value="post" />
            <input type="hidden" name="target_id" value={post.id} />
            <input type="hidden" name="return_to" value={`/posts/${post.id}`} />
            <TextArea label="Sebep" name="reason" required rows={4} />
            <SubmitButton variant="secondary" pendingLabel="Rapor gönderiliyor...">
              Rapor gönder
            </SubmitButton>
          </form>
        </Card>
      </aside>
    </div>
  );
}
