"use server";

import { revalidatePath } from "next/cache";
import { sectionLabelsForConceptIds } from "@/lib/concepts";
import {
  cardIdFromExploreConcept,
  labelForLearnedSkill,
} from "@/lib/save-concept";
import {
  generatePracticeFields,
  gradePracticeAttempt,
} from "@/lib/tool-card";
import { createClient } from "@/lib/supabase/server";

export async function createPracticeFromSkills(conceptIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to practice.", data: null };
  }

  const unique = [...new Set(conceptIds.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return { error: "Select at least one skill from your toolkit.", data: null };
  }
  if (unique.length > 4) {
    return { error: "Pick at most 4 skills for one problem.", data: null };
  }

  const { data: learned, error: learnedError } = await supabase
    .from("learned_concepts")
    .select("concept_id, tool_card_id, skill_points")
    .eq("user_id", user.id)
    .in("concept_id", unique);

  if (learnedError) {
    return { error: learnedError.message, data: null };
  }

  if (!learned?.length) {
    return {
      error: "Those skills are not in your toolkit yet. Learn them first.",
      data: null,
    };
  }

  const cardIds = [
    ...new Set(
      learned.flatMap((r) => {
        const fromCol = r.tool_card_id as string | null;
        const fromExplore = cardIdFromExploreConcept(r.concept_id as string);
        return [fromCol, fromExplore].filter(Boolean) as string[];
      }),
    ),
  ];

  const { data: cards } =
    cardIds.length > 0
      ? await supabase
          .from("tool_cards")
          .select("id, title, code, what_it_does")
          .in("id", cardIds)
      : { data: [] };

  const cardById = new Map(
    (cards ?? []).map((c) => [c.id as string, c]),
  );

  const skillPayload = learned.map((row) => {
    const conceptId = row.concept_id as string;
    const cardId =
      (row.tool_card_id as string | null) ??
      cardIdFromExploreConcept(conceptId);
    const card = cardId ? cardById.get(cardId) : undefined;
    return {
      conceptId,
      title: labelForLearnedSkill(
        conceptId,
        card?.title ? String(card.title) : null,
      ),
      what_it_does: card?.what_it_does
        ? String(card.what_it_does)
        : labelForLearnedSkill(conceptId, card?.title ? String(card.title) : null),
      code: card?.code ? String(card.code) : undefined,
    };
  });

  let practice;
  try {
    practice = await generatePracticeFields(skillPayload);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not create a practice task.",
      data: null,
    };
  }

  const { data: attempt, error: attemptError } = await supabase
    .from("practice_attempts")
    .insert({
      user_id: user.id,
      prompt_text: practice.prompt,
      tool_card_ids: cardIds,
      hint: practice.hint,
      sample_solution: practice.sample_solution,
      explanation: practice.explanation,
      outcome: "started",
    })
    .select("id, prompt_text, hint, sample_solution, explanation")
    .single();

  if (attemptError || !attempt) {
    return {
      error: attemptError?.message ?? "Could not save practice attempt.",
      data: null,
    };
  }

  return {
    error: null,
    data: {
      attemptId: attempt.id as string,
      prompt: attempt.prompt_text as string,
      hint: attempt.hint as string,
      sampleSolution: attempt.sample_solution as string,
      explanation: attempt.explanation as string,
      conceptIds: skillPayload.map((s) => s.conceptId),
      skills: skillPayload.map((s) => ({
        id: s.conceptId,
        title: s.title,
        what_it_does: s.what_it_does,
        code: s.code ?? "",
      })),
    },
  };
}

export async function submitPracticeAnswer(
  attemptId: string,
  answer: string,
  conceptIds: string[],
  runOutput?: string,
  runError?: string | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in required.", grade: null };
  }

  const trimmed = answer.trim();
  if (!trimmed) {
    return { error: "Write a short attempt first.", grade: null };
  }

  const { data: attempt, error: loadError } = await supabase
    .from("practice_attempts")
    .select("id, prompt_text, sample_solution")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (loadError || !attempt) {
    return { error: "Could not load this practice session.", grade: null };
  }

  let grade;
  try {
    grade = await gradePracticeAttempt({
      prompt: attempt.prompt_text as string,
      sampleSolution: attempt.sample_solution as string,
      userAnswer: trimmed,
      runOutput: runOutput ?? "",
      runError: runError ?? null,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not grade attempt.",
      grade: null,
    };
  }

  const { error: updateError } = await supabase
    .from("practice_attempts")
    .update({
      user_answer: trimmed,
      outcome: grade.outcome,
    })
    .eq("id", attemptId)
    .eq("user_id", user.id);

  if (updateError) {
    return { error: updateError.message, grade: null };
  }

  let pointsAwarded = 0;
  if (grade.outcome === "correct") {
    const ids = [...new Set(conceptIds.filter(Boolean))];
    for (const conceptId of ids) {
      const { data: row } = await supabase
        .from("learned_concepts")
        .select("id, skill_points")
        .eq("user_id", user.id)
        .eq("concept_id", conceptId)
        .maybeSingle();

      if (!row) continue;

      const next = Number(row.skill_points ?? 0) + 1;
      const { error: pointsError } = await supabase
        .from("learned_concepts")
        .update({ skill_points: next })
        .eq("id", row.id)
        .eq("user_id", user.id);

      if (!pointsError) pointsAwarded += 1;
    }
  }

  revalidatePath("/toolkit");
  revalidatePath("/practice");

  return {
    error: null,
    grade: {
      outcome: grade.outcome,
      feedback: grade.feedback,
      pointsAwarded,
    },
  };
}

/** Publish a practice challenge to Explore and save it to the author's toolkit. */
export async function sharePracticeToExplore(attemptId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to share practice.", cardId: null };
  }

  const id = attemptId.trim();
  if (!id) {
    return { error: "Missing practice attempt.", cardId: null };
  }

  const { data: attempt, error: loadError } = await supabase
    .from("practice_attempts")
    .select(
      "id, prompt_text, hint, sample_solution, explanation, tool_card_ids",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (loadError || !attempt) {
    return {
      error: loadError?.message ?? "Could not find that practice challenge.",
      cardId: null,
    };
  }

  const prompt = String(attempt.prompt_text ?? "").trim();
  const hint = String(attempt.hint ?? "").trim();
  const sample = String(attempt.sample_solution ?? "").trim();
  const explanation = String(attempt.explanation ?? "").trim();
  // Short card titles only — full prompt lives in what_it_does.
  const titleSeed =
    prompt.split(/\n/).find((line) => line.trim())?.trim() ?? "Practice challenge";
  const clause =
    titleSeed.split(/[.!?]/)[0]?.trim() || titleSeed;
  const TITLE_MAX = 44;
  const short =
    clause.length <= TITLE_MAX
      ? clause
      : `${clause.slice(0, TITLE_MAX - 1).replace(/\s+\S*$/, "").trimEnd() || clause.slice(0, TITLE_MAX - 1)}…`;
  const title = short.startsWith("Practice") ? short : `Practice · ${short}`;

  const linkedCardIds = Array.isArray(attempt.tool_card_ids)
    ? (attempt.tool_card_ids as string[]).filter(Boolean)
    : [];

  const conceptIds = new Set<string>();
  if (linkedCardIds.length > 0) {
    const [{ data: learnedRows }, { data: linkedCards }] = await Promise.all([
      supabase
        .from("learned_concepts")
        .select("concept_id")
        .eq("user_id", user.id)
        .in("tool_card_id", linkedCardIds),
      supabase
        .from("tool_cards")
        .select("concept_id")
        .in("id", linkedCardIds),
    ]);
    for (const row of learnedRows ?? []) {
      if (row.concept_id) conceptIds.add(String(row.concept_id));
    }
    for (const row of linkedCards ?? []) {
      if (row.concept_id) conceptIds.add(String(row.concept_id));
    }
  }
  const sectionTags = sectionLabelsForConceptIds([...conceptIds]);

  const { data: card, error: insertError } = await supabase
    .from("tool_cards")
    .insert({
      user_id: user.id,
      goal: prompt,
      title,
      what_it_does: prompt,
      code: sample || "# Write a solution for this practice challenge",
      example_input: "",
      example_output: "",
      explanation: explanation || "A shared practice challenge from Little Tools.",
      when_to_use: "Open this as a practice challenge and try it before peeking at the sample.",
      try_changing: hint || "Solve it, then tweak the inputs in your solution.",
      tags: ["practice", "challenge", ...sectionTags],
      difficulty: "practice",
      prompt,
      system_prompt: "shared-practice",
    })
    .select("id")
    .single();

  if (insertError || !card) {
    return {
      error: insertError?.message ?? "Could not publish to Explore.",
      cardId: null,
    };
  }

  const cardId = card.id as string;

  const { data: existingSave } = await supabase
    .from("saved_tools")
    .select("id")
    .eq("user_id", user.id)
    .eq("tool_card_id", cardId)
    .maybeSingle();

  if (!existingSave) {
    await supabase.from("saved_tools").insert({
      user_id: user.id,
      tool_card_id: cardId,
    });
  }

  revalidatePath("/explore");
  revalidatePath("/toolkit");
  revalidatePath("/");

  return { error: null, cardId };
}
