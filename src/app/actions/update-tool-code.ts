"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const CODE_MAX = 12000;

export async function updateToolCardCode(toolCardId: string, code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in required." };
  }

  const trimmed = code.trimEnd();
  if (!trimmed.trim()) {
    return { error: "Code cannot be empty." };
  }
  if (trimmed.length > CODE_MAX) {
    return { error: `Keep code under ${CODE_MAX} characters.` };
  }

  const { data: card, error: loadError } = await supabase
    .from("tool_cards")
    .select("user_id")
    .eq("id", toolCardId)
    .maybeSingle();

  if (loadError || !card) {
    return { error: "Could not load this tool card." };
  }

  if (card.user_id !== user.id) {
    return { error: "You can only edit code on cards you created." };
  }

  const { error } = await supabase
    .from("tool_cards")
    .update({ code: trimmed })
    .eq("id", toolCardId)
    .eq("user_id", user.id);

  if (error) {
    return {
      error: error.message.includes("policy")
        ? "Run supabase/tool-card-code-update.sql to enable code edits."
        : error.message,
    };
  }

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/library");

  return { error: null };
}
