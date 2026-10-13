"use server";

import { createClient } from "@/lib/supabase/server";
import { generatePracticeFields } from "@/lib/tool-card";
import type { ToolCard } from "@/lib/supabase/types";

export async function createPracticeSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to practice.", data: null };
  }

  const { data: saved, error: savedError } = await supabase
    .from("saved_tools")
    .select("tool_card_id")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false })
    .limit(12);

  if (savedError) {
    return { error: savedError.message, data: null };
  }

  const ids = (saved ?? []).map((row) => row.tool_card_id as string);
  if (ids.length === 0) {
    return {
      error: "Save at least one tool in your library before practicing.",
      data: null,
    };
  }

  const pickCount = ids.length >= 2 ? 2 : 1;
  const shuffled = [...ids].sort(() => Math.random() - 0.5).slice(0, pickCount);

  const { data: cards, error: cardsError } = await supabase
    .from("tool_cards")
    .select("id, title, code, what_it_does")
    .in("id", shuffled);

  if (cardsError || !cards?.length) {
    return { error: cardsError?.message ?? "Could not load saved tools.", data: null };
  }

  let practice;
  try {
    practice = await generatePracticeFields(
      cards.map((c) => ({
        title: c.title as string,
        code: c.code as string,
        what_it_does: c.what_it_does as string,
      })),
    );
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
      tool_card_ids: cards.map((c) => c.id),
      hint: practice.hint,
      sample_solution: practice.sample_solution,
      explanation: practice.explanation,
    })
    .select("id, prompt_text, hint, sample_solution, explanation, tool_card_ids")
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
      tools: cards as Pick<ToolCard, "id" | "title" | "code" | "what_it_does">[],
    },
  };
}

export async function submitPracticeAnswer(attemptId: string, answer: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in required." };
  }

  const trimmed = answer.trim();
  if (!trimmed) {
    return { error: "Write a short attempt first." };
  }

  const { error } = await supabase
    .from("practice_attempts")
    .update({
      user_answer: trimmed,
      outcome: "attempted",
    })
    .eq("id", attemptId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
