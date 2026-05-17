import { Vote } from "lucide-react";
import { votePollAction } from "@/lib/actions/polls";
import { getPollsData } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";
import { Badge, Card, EmptyState, LinkButton } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function PollsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const query = await searchParams;
  const current = await getCurrentProfile();

  if (!current) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="space-y-4 text-center">
          <Vote className="mx-auto size-10 text-[#f05a28]" />
          <h1 className="text-2xl font-black text-slate-950">Anketler için giriş yap</h1>
          <p className="text-sm leading-6 text-slate-600">
            Okul anketlerine oy vermek için hesabınla oturum açmalısın.
          </p>
          <LinkButton href="/login">Giriş yap</LinkButton>
        </Card>
      </div>
    );
  }

  const { polls, profile } = await getPollsData();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">Okul anketleri</h1>
        <p className="mt-2 text-sm text-slate-600">
          Genel okul kararları ve sosyal etkinlik fikirleri için tek oy hakkın var.
        </p>
      </div>
      {query.message ? (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {query.message}
        </div>
      ) : null}
      {polls.length ? (
        <div className="grid gap-4">
          {polls.map((poll: any) => {
            const options = [...(poll.poll_options ?? [])].sort(
              (a: any, b: any) => a.position - b.position,
            );
            const total = options.reduce(
              (sum: number, option: any) => sum + (option.poll_votes?.length ?? 0),
              0,
            );
            const votedOption = options.find((option: any) =>
              option.poll_votes?.some((vote: any) => vote.user_id === profile.id),
            );

            return (
              <Card key={poll.id} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">{poll.title}</h2>
                    {poll.description ? (
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {poll.description}
                      </p>
                    ) : null}
                  </div>
                  <Badge tone={poll.status === "open" ? "green" : "slate"}>
                    {poll.status === "open" ? "açık" : "kapalı"}
                  </Badge>
                </div>
                <div className="grid gap-3">
                  {options.map((option: any) => {
                    const count = option.poll_votes?.length ?? 0;
                    const percent = total ? Math.round((count / total) * 100) : 0;

                    return (
                      <form
                        key={option.id}
                        action={votePollAction}
                        className="rounded-md border border-slate-100 p-3"
                      >
                        <input type="hidden" name="poll_id" value={poll.id} />
                        <input type="hidden" name="option_id" value={option.id} />
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-slate-800">
                            {option.label}
                          </span>
                          <SubmitButton
                            variant={votedOption?.id === option.id ? "primary" : "secondary"}
                            disabled={poll.status !== "open"}
                            pendingLabel="Oy kaydediliyor..."
                          >
                            <Vote className="size-4" />
                            {votedOption?.id === option.id ? "Oylandı" : "Oy ver"}
                          </SubmitButton>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full bg-blue-600"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {count} oy · %{percent}
                        </p>
                      </form>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Anket yok"
          body="Admin veya öğretmenler okul geneli anket açtığında burada görünür."
        />
      )}
    </div>
  );
}
