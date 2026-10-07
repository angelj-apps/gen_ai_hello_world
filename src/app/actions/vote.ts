"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitVote(generationId: string, value: 1 | -1) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to vote." };
  }

  const { data: existing } = await supabase
    .from("votes")
    .select("id, value")
    .eq("user_id", user.id)
    .eq("generation_id", generationId)
    .maybeSingle();

  if (existing?.value === value) {
    const { error } = await supabase.from("votes").delete().eq("id", existing.id);
    if (error) return { error: "Could not update your vote." };
  } else if (existing) {
    const { error } = await supabase
      .from("votes")
      .update({ value })
      .eq("id", existing.id);
    if (error) return { error: "Could not update your vote." };
  } else {
    const { error } = await supabase.from("votes").insert({
      user_id: user.id,
      generation_id: generationId,
      value,
    });
    if (error) return { error: "Could not save your vote." };
  }

  revalidatePath("/");
  return { error: null };
}
