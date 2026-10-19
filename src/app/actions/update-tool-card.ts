"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const TITLE_MAX = 44;
const TEXT_MAX = 8000;

export async function updateToolCardFields(
  toolCardId: string,
  fields: {
    title: string;
    what_it_does: string;
    explanation: string;
    example_input?: string;
    example_output?: string;
  },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in required." };
  }

  const { data: card, error: loadError } = await supabase
    .from("tool_cards")
    .select("user_id, title, what_it_does, explanation, example_input, example_output")
    .eq("id", toolCardId)
    .maybeSingle();

  if (loadError || !card) {
    return { error: "Could not load this post." };
  }
  if (card.user_id !== user.id) {
    return { error: "You can only edit posts you shared." };
  }

  const storedTitle = (card.title ?? "").replace(/\s+/g, " ").trim();
  const requestedTitle = fields.title.replace(/\s+/g, " ").trim();
  // Only enforce the 44-char cap when the title itself changed. Legacy
  // oversize titles must not block Example / explanation autosaves.
  let title = requestedTitle || storedTitle;
  if (title.length > TITLE_MAX) {
    if (!requestedTitle || requestedTitle === storedTitle) {
      title = card.title;
    } else {
      return {
        error: `Keep the title under ${TITLE_MAX} characters (${title.length} now).`,
      };
    }
  }

  const what_it_does = fields.what_it_does.trim() || card.what_it_does;
  const explanation = fields.explanation.trim();
  // Single Example field: keep text in example_input; clear legacy output.
  const example_input = (fields.example_input ?? "").trim();
  const example_output = "";

  if (!title) return { error: "Title cannot be empty." };
  if (!what_it_does) return { error: "Challenge text cannot be empty." };
  if (
    what_it_does.length > TEXT_MAX ||
    explanation.length > TEXT_MAX ||
    example_input.length > TEXT_MAX
  ) {
    return { error: `Keep each field under ${TEXT_MAX} characters.` };
  }

  const { data: updated, error } = await supabase
    .from("tool_cards")
    .update({
      title,
      what_it_does,
      goal: what_it_does,
      prompt: what_it_does,
      explanation: explanation || "A shared practice challenge from Little Tools.",
      example_input,
      example_output,
    })
    .eq("id", toolCardId)
    .eq("user_id", user.id)
    .select(
      "id, title, what_it_does, explanation, example_input, example_output",
    )
    .maybeSingle();

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("policy") || msg.includes("permission")) {
      return {
        error:
          "Edits aren’t enabled in the database yet. Run supabase/tool-card-code-update.sql in the Supabase SQL editor.",
      };
    }
    return { error: error.message };
  }

  // Supabase returns no error when RLS blocks the row — verify the write.
  if (!updated) {
    return {
      error:
        "Edit didn’t save. Run supabase/tool-card-code-update.sql in the Supabase SQL editor, then try again.",
    };
  }

  revalidatePath("/explore");
  revalidatePath("/toolkit");
  revalidatePath("/");
  return {
    error: null,
    card: {
      title: updated.title as string,
      what_it_does: updated.what_it_does as string,
      explanation: updated.explanation as string,
      example_input: updated.example_input as string,
      example_output: (updated.example_output as string) ?? "",
    },
  };
}
