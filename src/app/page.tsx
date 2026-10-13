import Link from "next/link";
import { AttemptFirstLearn } from "@/components/AttemptFirstLearn";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { SiteNav } from "@/components/SiteNav";
import { ToolCardView } from "@/components/ToolCardView";
import {
  canClarifyCard,
  canEditToolCardCode,
  loadClarificationsByCardIds,
} from "@/lib/clarifications";
import { getHorizon } from "@/lib/concepts";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  profileNeedsNames,
  type Profile,
  type ToolCard,
  type ToolVote,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function SignedOutGate() {
  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <SiteNav />
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Little Tools
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Learn Python one small tool at a time
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            See what you can learn to do, ask “How do I …?”, try first, and open
            syntax only when you need it.
          </p>
        </header>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <GoogleSignInButton />
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Or{" "}
            <Link href="/login" className="underline underline-offset-2">
              open the login page
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  if (!hasSupabaseEnv()) {
    return <SignedOutGate />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <SignedOutGate />;
  }

  const params = await searchParams;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, favorite_drink, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  const needsProfile = profileNeedsNames((profile as Profile | null) ?? null);

  const { data: learnedRows, error: learnedError } = await supabase
    .from("learned_concepts")
    .select("concept_id, learned_at")
    .eq("user_id", user.id)
    .order("learned_at", { ascending: false });

  // If concepts.sql not run yet, start at the starter horizon.
  const learnedIds = learnedError
    ? []
    : (learnedRows ?? []).map((r) => r.concept_id as string);
  const lastConceptId = learnedIds[0] ?? null;
  const horizon = getHorizon(learnedIds, lastConceptId);

  let latestCard: ToolCard | null = null;
  if (params.card) {
    const { data } = await supabase
      .from("tool_cards")
      .select("*")
      .eq("id", params.card)
      .maybeSingle();
    latestCard = (data as ToolCard | null) ?? null;
  }

  let myVote: number | null = null;
  let saved = false;
  if (latestCard) {
    const [{ data: vote }, { data: save }] = await Promise.all([
      supabase
        .from("tool_votes")
        .select("tool_card_id, value")
        .eq("user_id", user.id)
        .eq("tool_card_id", latestCard.id)
        .maybeSingle(),
      supabase
        .from("saved_tools")
        .select("id")
        .eq("user_id", user.id)
        .eq("tool_card_id", latestCard.id)
        .maybeSingle(),
    ]);
    myVote = (vote as ToolVote | null)?.value ?? null;
    saved = Boolean(save);
  }

  const cardClarifications = latestCard
    ? (
        await loadClarificationsByCardIds(supabase, user.id, [latestCard.id])
      ).get(latestCard.id) ?? []
    : [];

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <SiteNav />
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Little Tools
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Learn
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Pick a capability, make it your “How do I …?” question, attempt
            first, then open syntax when you’re stuck.
          </p>
        </header>

        {needsProfile ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-medium">Welcome — finish your profile</p>
            <p className="mt-1 text-sm opacity-80">
              Your first or last name is still empty.{" "}
              <Link href="/profile" className="underline underline-offset-2">
                Add your name
              </Link>
              .
            </p>
          </div>
        ) : null}

        {latestCard ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Your tool card
            </h2>
            <ToolCardView
              card={latestCard}
              myVote={myVote}
              saved={saved}
              clarifications={cardClarifications}
              canClarify={canClarifyCard(latestCard.user_id, user.id)}
              canEditCode={canEditToolCardCode(latestCard.user_id, user.id)}
            />
            <p className="text-sm text-zinc-500">
              Next ideas below refresh from what you just learned.
            </p>
          </section>
        ) : null}

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <AttemptFirstLearn
            horizon={horizon}
            learnedCount={learnedIds.length}
          />
        </div>
      </main>
    </div>
  );
}
