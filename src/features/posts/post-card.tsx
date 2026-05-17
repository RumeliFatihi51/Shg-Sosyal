import Link from "next/link";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { votePostAction } from "@/lib/actions/posts";
import { AnimatedCard } from "@/components/motion";
import { Avatar, Badge, Card } from "@/components/ui";
import { cn, fullName } from "@/lib/utils";

export function postScore(post: any) {
  if (typeof post.score === "number") {
    return post.score;
  }

  return (post.post_votes ?? []).reduce(
    (sum: number, vote: { direction: number }) => sum + vote.direction,
    0,
  );
}

export function userPostVote(post: any, currentUserId?: string | null) {
  if (!currentUserId) {
    return 0;
  }

  return (
    post.post_votes?.find((vote: { user_id?: string; direction: number }) => vote.user_id === currentUserId)
      ?.direction ?? 0
  );
}

export function PostCard({
  post,
  returnTo,
  currentUserId,
  compact = false,
  category,
}: {
  post: any;
  returnTo?: string;
  currentUserId?: string | null;
  compact?: boolean;
  category?: string;
}) {
  const score = postScore(post);
  const currentVote = userPostVote(post, currentUserId);
  const commentCount = post.comment_count ?? (Array.isArray(post.comments)
    ? post.comments.length
    : post.comments?.[0]?.count ?? 0);

  return (
    <AnimatedCard>
      <Card className={cn("flex gap-4 p-4 hover:border-orange-200 hover:shadow-[0_24px_70px_rgba(240,90,40,0.11)]", !compact && "sm:p-5")}>
        <div className="flex w-12 shrink-0 flex-col items-center rounded-2xl border border-white/80 bg-white/80 p-1 shadow-inner shadow-slate-950/[0.03]">
          <VoteButton
            postId={post.id}
            direction={1}
            returnTo={returnTo}
            active={currentVote === 1}
            label="Gönderiyi beğen"
          />
          <span className="py-1 text-sm font-black text-slate-950">{score}</span>
          <VoteButton
            postId={post.id}
            direction={-1}
            returnTo={returnTo}
            active={currentVote === -1}
            label="Gönderiye eksi oy ver"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {category ? <Badge tone={categoryTone(category)}>{category}</Badge> : null}
              <Link
                href={`/communities/${post.communities?.slug ?? ""}`}
                className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-[var(--primary)] hover:bg-orange-100"
              >
                {post.communities?.name ?? "Topluluk"}
              </Link>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {formatRelative(post.created_at)}
            </span>
          </div>

          <Link href={`/posts/${post.id}`} className="mt-3 block">
            <h3 className="text-lg font-black leading-snug text-slate-950 transition hover:text-[var(--primary)]">
              {post.title}
            </h3>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
              {post.body}
            </p>
          </Link>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/profile/${post.author_id}`}
              className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"
            >
              <Avatar
                firstName={post.profiles?.first_name}
                lastName={post.profiles?.last_name}
                size="sm"
              />
              <span className="truncate">{fullName(post.profiles)}</span>
            </Link>
            <Link
              href={`/posts/${post.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-sm font-black text-slate-500 hover:bg-orange-50 hover:text-[var(--primary)]"
            >
              <MessageCircle className="size-4" />
              {commentCount}
            </Link>
          </div>
        </div>
      </Card>
    </AnimatedCard>
  );
}

function VoteButton({
  postId,
  direction,
  returnTo,
  active,
  label,
}: {
  postId: string;
  direction: 1 | -1;
  returnTo?: string;
  active: boolean;
  label: string;
}) {
  const Icon = direction === 1 ? ChevronUp : ChevronDown;

  return (
    <form action={votePostAction}>
      <input type="hidden" name="post_id" value={postId} />
      <input type="hidden" name="direction" value={String(direction)} />
      {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}
      <button
        type="submit"
        className={cn(
          "flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-orange-50 hover:text-[var(--primary)]",
          active && "bg-orange-50 text-[var(--primary)]",
        )}
        aria-label={label}
      >
        <Icon className="size-5" />
      </button>
    </form>
  );
}

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));

  if (minutes < 1) {
    return "şimdi";
  }

  if (minutes < 60) {
    return `${minutes} dk`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} sa`;
  }

  return `${Math.floor(hours / 24)} g`;
}

function categoryTone(
  category: string,
): "slate" | "green" | "amber" | "red" | "blue" | "orange" | "purple" {
  if (category === "Soru") {
    return "blue";
  }

  if (category === "Duyuru") {
    return "orange";
  }

  if (category === "Etkinlik") {
    return "green";
  }

  if (category === "Anket") {
    return "purple";
  }

  if (category === "Yardım") {
    return "amber";
  }

  return "slate";
}
