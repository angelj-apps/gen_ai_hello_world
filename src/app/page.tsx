import Link from "next/link";
import { redirect } from "next/navigation";
import { AttemptFirstLearn } from "@/components/AttemptFirstLearn";
import { SiteNav } from "@/components/SiteNav";
import { ToolCardView } from "@/components/ToolCardView";
import {
  canClarifyCard,
  canEditToolCardCode,
  loadClarificationsByCardIds,
} from "@/lib/clarifications";
import { CONCEPT_BY_ID, getHorizon } from "@/lib/concepts";
import {
  cardIdFromExploreConcept,
  conceptIdFromSkillLabel,
  labelForLearnedSkill,
  resolveConceptIdForCard,
} from "@/lib/save-concept";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  profileNeedsNames,
  type Profile,
  type ToolCard,
  type ToolVote,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ card?: string; start?: string }>;
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, favorite_drink, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  const needsProfile = profileNeedsNames((profile as Profile | null) ?? null);

  let { data: learnedRows, error: learnedError } = await supabase
    .from("learned_concepts")
    .select("concept_id, tool_card_id, learned_at")
    .eq("user_id", user.id)
    .order("learned_at", { ascending: false });

  // Older schemas may lack tool_card_id — still load concept progress.
  if (learnedError) {
    const fallback = await supabase
      .from("learned_concepts")
      .select("concept_id, learned_at")
      .eq("user_id", user.id)
      .order("learned_at", { ascending: false });
    learnedRows = (fallback.data ?? []).map((row) => ({
      ...row,
      tool_card_id: null as string | null,
    }));
    learnedError = fallback.error;
  }

  const { data: mySaves } = await supabase
    .from("saved_tools")
    .select("tool_card_id")
    .eq("user_id", user.id);

  // Hide any curriculum skill already in the toolkit (learned or saved).
  const ownedConceptIds = new Set<string>();
  const cardIdsToResolve = new Set<string>();

  for (const row of learnedRows ?? []) {
    const conceptId = String(row.concept_id ?? "").trim();
    if (!conceptId) continue;
    if (CONCEPT_BY_ID[conceptId]) ownedConceptIds.add(conceptId);
    if (row.tool_card_id) cardIdsToResolve.add(row.tool_card_id as string);
    const fromExplore = cardIdFromExploreConcept(conceptId);
    if (fromExplore) cardIdsToResolve.add(fromExplore);
  }

  for (const row of mySaves ?? []) {
    cardIdsToResolve.add(row.tool_card_id as string);
  }

  const cardMap = new Map<string, ToolCard>();
  if (cardIdsToResolve.size > 0) {
    const { data: linkedCards } = await supabase
      .from("tool_cards")
      .select("id, title, concept_id, tags, goal")
      .in("id", [...cardIdsToResolve]);

    for (const card of (linkedCards as ToolCard[] | null) ?? []) {
      cardMap.set(card.id, card);
      const resolved = resolveConceptIdForCard(card);
      if (CONCEPT_BY_ID[resolved]) ownedConceptIds.add(resolved);
    }
  }

  // Match toolkit display labels (e.g. "Store a value in a name") back to ids.
  for (const row of learnedRows ?? []) {
    const conceptId = String(row.concept_id ?? "").trim();
    const cardId =
      (row.tool_card_id as string | null) ??
      cardIdFromExploreConcept(conceptId);
    const card = cardId ? cardMap.get(cardId) : undefined;
    const label = labelForLearnedSkill(conceptId, card?.title);
    const fromLabel = conceptIdFromSkillLabel(label);
    if (fromLabel) ownedConceptIds.add(fromLabel);
  }
  for (const card of cardMap.values()) {
    const fromLabel = conceptIdFromSkillLabel(card.title);
    if (fromLabel) ownedConceptIds.add(fromLabel);
  }

  const learnedIds = [...ownedConceptIds];
  const lastConceptId =
    (learnedRows ?? []).find((r) => CONCEPT_BY_ID[String(r.concept_id ?? "").trim()])
      ?.concept_id ?? null;
  const horizon = getHorizon(
    learnedIds,
    lastConceptId ? String(lastConceptId) : null,
  );
  const learnedCount = learnedError
    ? learnedIds.length
    : (learnedRows ?? []).length || learnedIds.length;

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

  const focusUnlock = Boolean(latestCard && !params.start);

  return (
    <div className="app-shell">
      <main className={`app-main ${focusUnlock ? "max-w-3xl" : ""}`}>
        <SiteNav />
        {focusUnlock ? (
          <header className="flex flex-col gap-2">
            <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-accent uppercase">
              Nice unlock
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              You earned a tool
            </h1>
          </header>
        ) : (
          <header className="flex flex-col gap-3">
            <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-accent uppercase">
              Daily quest
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Learn something tiny
            </h1>
            <Link
              href="/toolkit#path"
              className="inline-flex w-fit rounded-full bg-accent-soft px-3 py-1.5 text-sm font-bold text-accent transition hover:bg-accent hover:text-surface-raised"
            >
              See your path →
            </Link>
          </header>
        )}

        {needsProfile ? (
          <div className="border border-accent bg-accent-soft px-5 py-4 text-ink">
            <p className="font-medium">Welcome — finish your profile</p>
            <p className="mt-1 text-sm text-muted">
              Your first or last name is still empty.{" "}
              <Link
                href="/profile"
                className="text-accent underline underline-offset-2"
              >
                Add your name
              </Link>
              .
            </p>
          </div>
        ) : null}

        {focusUnlock && latestCard ? (
          <section className="studio-fade-up w-full">
            <ToolCardView
              card={latestCard}
              myVote={myVote}
              saved={saved}
              clarifications={cardClarifications}
              canClarify={canClarifyCard(latestCard.user_id, user.id)}
              canEditCode={canEditToolCardCode(latestCard.user_id, user.id)}
              funStyle
              showQuestFooter
              nextSkill={
                horizon[0]
                  ? { id: horizon[0].id, label: horizon[0].label }
                  : null
              }
            />
          </section>
        ) : (
          <div id="learn" className="scroll-mt-6">
            <AttemptFirstLearn
              horizon={horizon}
              learnedCount={learnedCount}
              startConceptId={params.start ?? null}
            />
          </div>
        )}
      </main>
    </div>
  );
}
