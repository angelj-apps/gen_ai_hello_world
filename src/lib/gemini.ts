export async function generateCaptionText(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Gemini is not configured. Add GEMINI_API_KEY to .env.local.");
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 1,
        // gemini-3.x spends tokens on "thinking" before text; keep headroom.
        maxOutputTokens: 1024,
      },
    }),
  });

  const payload = (await response.json()) as {
    candidates?: {
      content?: { parts?: { text?: string; thought?: boolean }[] };
      finishReason?: string;
    }[];
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(
      payload.error?.message
        ? `Gemini error: ${payload.error.message}`
        : `Gemini error: HTTP ${response.status}`,
    );
  }

  const candidate = payload.candidates?.[0];
  const text = candidate?.content?.parts
    ?.filter((part) => !part.thought && part.text)
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    const reason = candidate?.finishReason
      ? ` (finishReason: ${candidate.finishReason})`
      : "";
    throw new Error(`Gemini returned an empty caption.${reason}`);
  }

  return text;
}
