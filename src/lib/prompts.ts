/** Max length for the optional "what just happened" prompt. */
export const VIBE_MAX_CHARS = 80;

export const CAPTION_SYSTEM_PROMPT = `You write Instagram/group-chat captions for Sam: a chronically online Midwest transplant bouncing between Columbia dorm life in NYC and weekend/coffee stops in Boston.

Voice: short, quirky, dry, mildly unhinged. Secondhand embarrassment welcome. Never corporate.

Hard rules:
- Reply with ONLY the caption. Nothing else.
- Exactly one sentence.
- Lean into the awkward moment if one is provided.
- No quotes, hashtags, emojis, labels, or reasoning.`;

export function buildUserPrompt(input: {
  spotName: string;
  neighborhood: string;
  note: string;
  vibe: string;
}) {
  const vibe = input.vibe.trim();

  // Keep this short — long briefs make flaky free models burn tokens on planning.
  if (vibe) {
    return [
      `${input.spotName}, ${input.neighborhood}.`,
      `Awkward moment: ${vibe}.`,
      `One quirky caption, sentence only:`,
    ].join(" ");
  }

  return [
    `${input.spotName}, ${input.neighborhood} (${input.note}).`,
    `One quirky awkward caption, sentence only:`,
  ].join(" ");
}

/** Strip leaked reasoning if a model ignores the "caption only" rule. */
export function cleanCaption(raw: string) {
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  if (!trimmed) return "";

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const meta =
    /^(the user wants|let'?s think|voice:|rules:|place:|known for|hard rules|write one|caption only|awkward (thing|moment):)/i;

  const candidates = lines.filter((line) => !meta.test(line));
  const picked = (candidates.at(-1) ?? lines.at(-1) ?? trimmed).trim();

  // If cleanup wiped everything useful, keep the original text.
  if (!picked || meta.test(picked)) {
    // Prefer the last sentence of the raw dump.
    const sentences = trimmed
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return sentences.at(-1) ?? trimmed;
  }

  return picked.replace(/^["']|["']$/g, "").trim();
}
