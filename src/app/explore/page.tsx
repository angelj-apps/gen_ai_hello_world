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

export default async function ExplorePage() {
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

  const { data: cards, error } = await supabase
    .from("tool_cards")
    .select("*")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(40);

  const list = (cards as ToolCard[] | null) ?? [];

  const [{ data: myVotes }, { data: mySaves }] = await Promise.all([
    supabase
      .from("tool_votes")
      .select("tool_card_id, value")
      .eq("user_id", user.id),
    supabase
      .from("saved_tools")
      .select("tool_card_id")
      .eq("user_id", user.id),
  ]);

  const voteMap = new Map(
    ((myVotes as ToolVote[] | null) ?? []).map((v) => [v.tool_card_id, v.value]),
  );
  const savedSet = new Set(
    (mySaves ?? []).map((row) => row.tool_card_id as string),
  );

  const clarifyableIds = list
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
            Explore
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Shared tool cards ranked by community score. Function first — open
            syntax when you need it. Vote and save keepers to your library.
          </p>
        </header>

        {error ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            Could not load tools. Run{" "}
            <code className="font-mono text-sm">supabase/little-tools.sql</code>{" "}
            if tables are missing.
          </p>
        ) : null}

        {!error && list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-5 py-8 text-center dark:border-zinc-700">
            <p className="text-zinc-700 dark:text-zinc-300">
              No tool cards yet. Learn your first concept.
            </p>
            <Link
              href="/"
              className="mt-3 inline-block text-sm underline underline-offset-2"
            >
              Open learn
            </Link>
          </div>
        ) : null}

        <ul className="grid gap-4">
          {list.map((card) => (
            <li key={card.id}>
              <ToolCardView
                card={card}
                myVote={voteMap.get(card.id) ?? null}
                saved={savedSet.has(card.id)}
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
