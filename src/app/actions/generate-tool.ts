"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getConcept } from "@/lib/concepts";
import { generateToolCardFields } from "@/lib/tool-card";
import { createClient } from "@/lib/supabase/server";

const GOAL_MAX = 200;

export async function generateToolCard(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const conceptId = String(formData.get("conceptId") ?? "").trim() || null;
  const attempt = String(formData.get("attempt") ?? "").trim();
  const customHow = String(formData.get("howQuestion") ?? "").trim();
  const discoveryPrompt = String(
    formData.get("discoveryPrompt") ?? "",
  ).trim();

  const concept = conceptId ? getConcept(conceptId) : undefined;
  const goal =
    customHow ||
    concept?.howPrompt ||
    String(formData.get("goal") ?? "").trim();

  if (!goal) {
    return { error: "Pick a concept or write How do I …? first." };
  }
  if (goal.length > GOAL_MAX) {
    return { error: `Keep the question under ${GOAL_MAX} characters.` };
  }
  // Catalog skills with a discovery sheet must include a real attempt.
  if (conceptId && discoveryPrompt && !attempt) {
    return { error: "Try the discovery question before opening syntax." };
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      first_name: user.user_metadata?.given_name ?? null,
      last_name: user.user_metadata?.family_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    });
    if (profileError) {
      return { error: `Could not create profile: ${profileError.message}` };
    }
  }

  let generated;
  try {
    generated = await generateToolCardFields(goal, {
      conceptLabel: concept?.label,
      hintSyntax: concept?.hintSyntax,
      learnerAttempt: attempt || undefined,
      discoveryPrompt: discoveryPrompt || undefined,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not generate a tool card. Try again.",
    };
  }

  const { fields, prompt, systemPrompt } = generated;

  const insertPayload: Record<string, unknown> = {
    user_id: user.id,
    goal,
    title: fields.title,
    what_it_does: fields.what_it_does,
    code: fields.code,
    example_input: fields.example_input,
    example_output: fields.example_output,
    explanation: fields.explanation,
    when_to_use: fields.when_to_use,
    try_changing: fields.try_changing,
    tags: fields.tags,
    difficulty: fields.difficulty,
    prompt,
    system_prompt: systemPrompt,
  };

  if (conceptId) insertPayload.concept_id = conceptId;
  if (attempt) insertPayload.learner_attempt = attempt;

  const { data, error: insertError } = await supabase
    .from("tool_cards")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertError || !data) {
    // Retry without new columns if migration not run yet.
    const missingColumn =
      insertError?.message?.toLowerCase().includes("concept_id") ||
      insertError?.message?.toLowerCase().includes("learner_attempt");
    if (missingColumn) {
      const { data: fallback, error: fallbackError } = await supabase
        .from("tool_cards")
        .insert({
          user_id: user.id,
          goal,
          title: fields.title,
          what_it_does: fields.what_it_does,
          code: fields.code,
          example_input: fields.example_input,
          example_output: fields.example_output,
          explanation: fields.explanation,
          when_to_use: fields.when_to_use,
          try_changing: fields.try_changing,
          tags: fields.tags,
          difficulty: fields.difficulty,
          prompt,
          system_prompt: systemPrompt,
        })
        .select("id")
        .single();
      if (fallbackError || !fallback) {
        return {
          error: `Could not save tool card: ${fallbackError?.message ?? insertError?.message}`,
        };
      }
      if (conceptId) {
        await markLearned(supabase, user.id, conceptId, fallback.id as string);
      }
      revalidatePath("/");
      revalidatePath("/explore");
      redirect(`/?card=${fallback.id}`);
    }
    return {
      error: `Could not save tool card: ${insertError?.message ?? "unknown error"}`,
    };
  }

  if (conceptId) {
    await markLearned(supabase, user.id, conceptId, data.id as string);
  }

  revalidatePath("/");
  revalidatePath("/explore");
  redirect(`/?card=${data.id}`);
}

async function markLearned(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  conceptId: string,
  toolCardId: string,
) {
  const { error } = await supabase.from("learned_concepts").insert({
    user_id: userId,
    concept_id: conceptId,
    tool_card_id: toolCardId,
  });
  // Ignore if table missing or already learned (unique).
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    // no-op — horizon still works from client if table absent after reload fail
  }
}
