"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitToolVote(toolCardId: string, value: 1 | -1) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to vote." };
  }

  const { data: existing } = await supabase
    .from("tool_votes")
    .select("id, value")
    .eq("user_id", user.id)
    .eq("tool_card_id", toolCardId)
    .maybeSingle();

  if (existing?.value === value) {
    const { error } = await supabase.from("tool_votes").delete().eq("id", existing.id);
    if (error) return { error: "Could not update your vote." };
  } else if (existing) {
    const { error } = await supabase
      .from("tool_votes")
      .update({ value })
      .eq("id", existing.id);
    if (error) return { error: "Could not update your vote." };
  } else {
    const { error } = await supabase.from("tool_votes").insert({
      user_id: user.id,
      tool_card_id: toolCardId,
      value,
    });
    if (error) return { error: "Could not save your vote." };
  }

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/toolkit");
  return { error: null };
}
