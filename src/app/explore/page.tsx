import Link from "next/link";
import { redirect } from "next/navigation";
import { ExploreBoard, type ExploreCardRow } from "@/components/ExploreBoard";
import { SiteNav } from "@/components/SiteNav";
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
    .contains("tags", ["practice"])
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(80);

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

  const rows: ExploreCardRow[] = list.map((card) => ({
    card,
    myVote: voteMap.get(card.id) ?? null,
    saved: savedSet.has(card.id),
    clarifications: clarificationMap.get(card.id) ?? [],
    canClarify: canClarifyCard(card.user_id, user.id),
    canEdit: canEditToolCardCode(card.user_id, user.id),
  }));

  return (
    <div className="app-shell">
      <main className="app-main">
        <SiteNav />
        <header className="learn-fun-shell flex flex-col gap-3">
          <p className="font-mono text-[11px] font-semibold tracking-[0.1em] text-accent uppercase">
            Shared practice
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Explore
          </h1>
        </header>

        {error ? (
          <div className="learn-fun-shell">
            <p className="text-muted">
              Could not load tools. Run{" "}
              <code className="font-mono text-sm text-ink">
                supabase/little-tools.sql
              </code>{" "}
              if tables are missing.
            </p>
          </div>
        ) : null}

        {!error && list.length === 0 ? (
          <div className="learn-fun-shell text-center">
            <p className="text-lg font-bold text-ink">
              No shared challenges yet
            </p>
            <p className="mt-2 text-sm text-muted">
              Build one in Practice, then tap Share to Explore.
            </p>
            <Link href="/practice" className="learn-fun-cta mt-5 inline-flex">
              Open practice
            </Link>
          </div>
        ) : null}

        {!error && list.length > 0 ? (
          <ExploreBoard userId={user.id} rows={rows} />
        ) : null}
      </main>
    </div>
  );
}
