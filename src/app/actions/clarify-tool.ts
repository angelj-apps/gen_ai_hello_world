"use server";

import { revalidatePath } from "next/cache";
import {
  generateCardClarification,
  type ClarifyKind,
} from "@/lib/tool-card";
import { createClient } from "@/lib/supabase/server";
import type { ToolCard, ToolCardClarification } from "@/lib/supabase/types";

const QUESTION_MAX = 500;
const ANSWER_MAX = 8000;

function revalidateClarifyPaths() {
  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/toolkit");
}

function defaultQuestion(kind: ClarifyKind) {
  if (kind === "simpler") {
    return "Can you say that in simpler words?";
  }
  if (kind === "example") {
    return "Can I see another small example?";
  }
  return "";
}

export async function askCardClarification(
  toolCardId: string,
  kind: ClarifyKind,
  customQuestion?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to ask a follow-up.", clarification: null };
  }

  const question =
    kind === "custom"
      ? (customQuestion ?? "").trim()
      : defaultQuestion(kind);

  if (!question) {
    return { error: "Write what is still unclear.", clarification: null };
  }
  if (question.length > QUESTION_MAX) {
    return {
      error: `Keep the question under ${QUESTION_MAX} characters.`,
      clarification: null,
    };
  }

  const { data: card, error: cardError } = await supabase
    .from("tool_cards")
    .select("*")
    .eq("id", toolCardId)
    .maybeSingle();

  if (cardError || !card) {
    return { error: "Could not load this tool card.", clarification: null };
  }

  const toolCard = card as ToolCard;
  if (toolCard.user_id && toolCard.user_id !== user.id) {
    return {
      error: "Follow-ups are only on cards you created.",
      clarification: null,
    };
  }

  const { data: priorRows, error: priorError } = await supabase
    .from("tool_card_clarifications")
    .select("question_text, answer_text")
    .eq("user_id", user.id)
    .eq("tool_card_id", toolCardId)
    .order("created_at", { ascending: true });

  if (priorError) {
    return {
      error:
        priorError.message.includes("tool_card_clarifications")
          ? "Run supabase/clarifications.sql to enable follow-ups."
          : priorError.message,
      clarification: null,
    };
  }

  let answerText: string;
  try {
    answerText = await generateCardClarification({
      card: {
        goal: toolCard.goal,
        title: toolCard.title,
        what_it_does: toolCard.what_it_does,
        code: toolCard.code,
        explanation: toolCard.explanation,
      },
      learnerAttempt: toolCard.learner_attempt,
      priorClarifications: priorRows ?? [],
      question,
      kind,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not generate a clarification.",
      clarification: null,
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("tool_card_clarifications")
    .insert({
      user_id: user.id,
      tool_card_id: toolCardId,
      question_text: question,
      answer_text: answerText,
      kind,
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    return {
      error: insertError?.message ?? "Could not save clarification.",
      clarification: null,
    };
  }

  revalidateClarifyPaths();

  return {
    error: null,
    clarification: inserted as ToolCardClarification,
  };
}

export async function updateCardClarification(
  clarificationId: string,
  questionText: string,
  answerText: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in required." };
  }

  const question = questionText.trim();
  const answer = answerText.trim();
  if (!question || !answer) {
    return { error: "Question and clarification text are required." };
  }
  if (question.length > QUESTION_MAX || answer.length > ANSWER_MAX) {
    return { error: "Text is too long." };
  }

  const { error } = await supabase
    .from("tool_card_clarifications")
    .update({
      question_text: question,
      answer_text: answer,
    })
    .eq("id", clarificationId)
    .eq("user_id", user.id);

  if (error) {
    return {
      error: error.message.includes("policy")
        ? "Run supabase/clarifications.sql (update/delete policies)."
        : error.message,
    };
  }

  // Skip revalidate — client keeps local draft; avoids flicker while typing.
  return { error: null };
}

export async function deleteCardClarification(clarificationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in required." };
  }

  const { error } = await supabase
    .from("tool_card_clarifications")
    .delete()
    .eq("id", clarificationId)
    .eq("user_id", user.id);

  if (error) {
    return {
      error: error.message.includes("policy")
        ? "Run supabase/clarifications.sql (update/delete policies)."
        : error.message,
    };
  }

  revalidateClarifyPaths();
  return { error: null };
}
