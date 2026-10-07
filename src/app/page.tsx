import Link from "next/link";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { SiteNav } from "@/components/SiteNav";
import { VoteButtons } from "@/components/VoteButtons";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  profileNeedsNames,
  type GenerationCard,
  type Profile,
  type Vote,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function SignedOutGate() {
  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <SiteNav />
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Members only
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Weekend captions
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Sign in to generate AI captions for NYC and Boston spots and rate the feed.
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

export default async function Home() {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, favorite_drink, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  const needsProfile = profileNeedsNames((profile as Profile | null) ?? null);

  const { data: generations, error } = await supabase
    .from("generations")
    .select(
      "id, caption, prompt, score, created_at, spots!spot_id(name, neighborhood), profiles!user_id(first_name, last_name)",
    )
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(40);

  const cards: GenerationCard[] = (generations ?? []).map((row) => {
    const spot = Array.isArray(row.spots) ? row.spots[0] : row.spots;
    const author = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      caption: row.caption,
      prompt: row.prompt,
      score: row.score,
      created_at: row.created_at,
      spots: spot ?? null,
      profiles: author ?? null,
    };
  });

  const { data: myVotes } = await supabase
    .from("votes")
    .select("generation_id, value")
    .eq("user_id", user.id);

  const voteMap = new Map(
    ((myVotes as Vote[] | null) ?? []).map((vote) => [
      vote.generation_id,
      vote.value,
    ]),
  );

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <SiteNav />
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Daily for dorm explorers
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Weekend captions
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Chronically online takes on NYC and Boston coffee runs and weekend wanders.
            Generate one, vote on the rest, come back tomorrow for new posts.
          </p>
          <Link
            href="/generate"
            className="inline-flex w-fit items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Generate a caption
          </Link>
        </header>

        {needsProfile ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-medium">Welcome — finish your profile</p>
            <p className="mt-1 text-sm opacity-80">
              Your first or last name is still empty.{" "}
              <Link href="/profile" className="underline underline-offset-2">
                Add your name
              </Link>{" "}
              so the feed can credit you.
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="text-zinc-600 dark:text-zinc-400">Could not load captions.</p>
        ) : null}

        {!error && cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-5 py-8 text-center dark:border-zinc-700">
            <p className="text-zinc-700 dark:text-zinc-300">
              No captions yet. Be the first to generate one.
            </p>
            <Link
              href="/generate"
              className="mt-3 inline-block text-sm underline underline-offset-2"
            >
              Open generate
            </Link>
          </div>
        ) : null}

        <ul className="grid gap-4">
          {cards.map((card) => {
            const author = [card.profiles?.first_name, card.profiles?.last_name]
              .filter(Boolean)
              .join(" ");
            return (
              <li
                key={card.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                      {card.spots?.neighborhood ?? "NYC / Boston"}
                      {card.spots?.name ? ` · ${card.spots.name}` : ""}
                    </p>
                    <p className="mt-2 text-xl font-semibold leading-8 text-zinc-950 dark:text-zinc-50">
                      {card.caption}
                    </p>
                    <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                      {author || "Anonymous"} · prompt saved with this post
                    </p>
                    <details className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                      <summary className="cursor-pointer select-none">
                        View prompt
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-zinc-50 p-3 font-mono text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        {card.prompt}
                      </pre>
                    </details>
                  </div>
                  <VoteButtons
                    generationId={card.id}
                    score={card.score}
                    myVote={voteMap.get(card.id) ?? null}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
