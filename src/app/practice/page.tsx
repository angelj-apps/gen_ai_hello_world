import Link from "next/link";
import { redirect } from "next/navigation";
import { PracticeClient } from "@/components/PracticeClient";
import { SiteNav } from "@/components/SiteNav";
import {
  cardIdFromExploreConcept,
  labelForLearnedSkill,
} from "@/lib/save-concept";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
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

  let { data: learned, error: learnedError } = await supabase
    .from("learned_concepts")
    .select("concept_id, skill_points, tool_card_id, learned_at")
    .eq("user_id", user.id)
    .order("learned_at", { ascending: false });

  if (learnedError?.message?.toLowerCase().includes("skill_points")) {
    const fallback = await supabase
      .from("learned_concepts")
      .select("concept_id, tool_card_id, learned_at")
      .eq("user_id", user.id)
      .order("learned_at", { ascending: false });
    learned = (fallback.data ?? []).map((row) => ({
      ...row,
      skill_points: 0,
    }));
  }

  const cardIds = [
    ...new Set(
      (learned ?? []).flatMap((row) => {
        const fromCol = row.tool_card_id as string | null;
        const fromExplore = cardIdFromExploreConcept(row.concept_id as string);
        return [fromCol, fromExplore].filter(Boolean) as string[];
      }),
    ),
  ];

  const { data: cards } =
    cardIds.length > 0
      ? await supabase.from("tool_cards").select("id, title").in("id", cardIds)
      : { data: [] as { id: string; title: string }[] };

  const titleByCardId = new Map(
    (cards ?? []).map((c) => [c.id as string, c.title as string]),
  );

  const skills = (learned ?? []).map((row) => {
    const conceptId = row.concept_id as string;
    const cardId =
      (row.tool_card_id as string | null) ??
      cardIdFromExploreConcept(conceptId);
    const cardTitle = cardId ? titleByCardId.get(cardId) : null;
    return {
      conceptId,
      label: labelForLearnedSkill(conceptId, cardTitle),
      skillPoints: Number(row.skill_points ?? 0),
    };
  });

  return (
    <div className="app-shell app-shell--noscroll-practice">

          <main className="app-main">
            <SiteNav />
            <header className="flex flex-col gap-3">
              <h1 className="text-4xl font-semibold tracking-tight text-ink">
                Practice
              </h1>
              <p className="sr-only">
                Short challenges from skills you already unlocked — stack points
                when you solve them.
              </p>
            </header>

            {skills.length === 0 ? (
              <div className="learn-fun-shell text-center">
                <p className="text-2xl font-bold tracking-tight text-ink">
                  Unlock a skill first
                </p>
                <p className="mt-2 text-muted">
                  Practice uses tools from your toolkit. Learn one, then come back
                  for a challenge.
                </p>
                <Link href="/" className="learn-fun-cta mt-5 inline-flex">
                  Open Learn
                </Link>
              </div>
            ) : (
              <PracticeClient skills={skills} />
            )}
          </main>

    </div>
  );
}
