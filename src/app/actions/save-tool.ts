"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleSaveTool(toolCardId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to save tools.", saved: false };
  }

  const { data: existing } = await supabase
    .from("saved_tools")
    .select("id")
    .eq("user_id", user.id)
    .eq("tool_card_id", toolCardId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("saved_tools").delete().eq("id", existing.id);
    if (error) return { error: error.message, saved: true };
    revalidatePath("/library");
    revalidatePath("/");
    revalidatePath("/explore");
    return { error: null, saved: false };
  }

  const { error } = await supabase.from("saved_tools").insert({
    user_id: user.id,
    tool_card_id: toolCardId,
  });
  if (error) return { error: error.message, saved: false };

  revalidatePath("/library");
  revalidatePath("/");
  revalidatePath("/explore");
  return { error: null, saved: true };
}
