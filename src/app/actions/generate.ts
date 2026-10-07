"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateCaptionText } from "@/lib/openrouter";
import {
  buildUserPrompt,
  CAPTION_SYSTEM_PROMPT,
  VIBE_MAX_CHARS,
} from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";

export async function generateCaption(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const spotId = String(formData.get("spotId") ?? "").trim();
  const vibe = String(formData.get("vibe") ?? "").trim();

  if (!spotId) {
    return { error: "Pick a spot first." };
  }

  if (vibe.length > VIBE_MAX_CHARS) {
    return {
      error: `Keep the optional prompt under ${VIBE_MAX_CHARS} characters.`,
    };
  }

  const { data: spot, error: spotError } = await supabase
    .from("spots")
    .select("id, name, neighborhood, note")
    .eq("id", spotId)
    .maybeSingle();

  if (spotError || !spot) {
    return { error: "That spot is not available." };
  }

  const userPrompt = buildUserPrompt({
    spotName: spot.name,
    neighborhood: spot.neighborhood,
    note: spot.note,
    vibe,
  });

  let caption: string;
  try {
    caption = await generateCaptionText(CAPTION_SYSTEM_PROMPT, userPrompt);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not generate a caption. Try again in a moment.";
    return { error: message };
  }

  // generations.user_id references profiles(id). Ensure a profile row exists.
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
      return {
        error: `Could not create profile before saving: ${profileError.message}`,
      };
    }
  }

  const { error: insertError } = await supabase.from("generations").insert({
    user_id: user.id,
    spot_id: spot.id,
    prompt: userPrompt,
    system_prompt: CAPTION_SYSTEM_PROMPT,
    caption,
  });

  if (insertError) {
    return { error: `Could not save that caption: ${insertError.message}` };
  }

  revalidatePath("/");
  redirect("/");
}
