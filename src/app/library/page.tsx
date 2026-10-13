import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { ToolCardView } from "@/components/ToolCardView";
import {
  canClarifyCard,
  canEditToolCardCode,
  loadClarificationsByCardIds,
} from "@/lib/clarifications";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ToolCard, ToolVote } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();

  const { data: savedRows, error } = await supabase
    .from("saved_tools")
    .select("tool_card_id, saved_at, tool_cards(*)")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  let cards: ToolCard[] = ((savedRows ?? [])
    .map((row) => {
      const nested = row.tool_cards;
      return (Array.isArray(nested) ? nested[0] : nested) as ToolCard | null;
    })
    .filter(Boolean) as ToolCard[]);

  if (q) {
    cards = cards.filter((card) => {
      const hay = [
        card.title,
        card.what_it_does,
        card.goal,
        card.tags?.join(" "),
        card.code,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  const { data: myVotes } = await supabase
    .from("tool_votes")
    .select("tool_card_id, value")
    .eq("user_id", user.id);

  const voteMap = new Map(
    ((myVotes as ToolVote[] | null) ?? []).map((v) => [v.tool_card_id, v.value]),
  );

  const clarifyableIds = cards
    .filter((card) => canClarifyCard(card.user_id, user.id))
    .map((card) => card.id);
  const clarificationMap = await loadClarificationsByCardIds(
    supabase,
    user.id,
    clarifyableIds,
  );

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <SiteNav />
        <header className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Library
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Your saved toolkit. Search by title, tags, or code, then practice
            with them.
          </p>
          <Link
            href="/practice"
            className="inline-flex w-fit text-sm underline underline-offset-2"
          >
            Go to practice
          </Link>
        </header>

        <form className="flex gap-2" action="/library" method="get">
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search saved tools…"
            className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
          <button
            type="submit"
            className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
          >
            Search
          </button>
        </form>

        {error ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            Could not load your library.
          </p>
        ) : null}

        {!error && cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-5 py-8 text-center dark:border-zinc-700">
            <p className="text-zinc-700 dark:text-zinc-300">
              {q
                ? "No saved tools match that search."
                : "Nothing saved yet. Explore the feed and tap Save."}
            </p>
            <Link
              href="/explore"
              className="mt-3 inline-block text-sm underline underline-offset-2"
            >
              Browse explore
            </Link>
          </div>
        ) : null}

        <ul className="grid gap-4">
          {cards.map((card) => (
            <li key={card.id}>
              <ToolCardView
                card={card}
                myVote={voteMap.get(card.id) ?? null}
                saved
                syntaxCollapsed
                clarifications={clarificationMap.get(card.id) ?? []}
                canClarify={canClarifyCard(card.user_id, user.id)}
                canEditCode={canEditToolCardCode(card.user_id, user.id)}
              />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
