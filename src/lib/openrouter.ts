import { cleanCaption } from "./prompts";

function extractMessageContent(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: string }).text ?? "");
        }
        return "";
      })
      .join("")
      .trim();
  }
  return "";
}

export async function generateCaptionText(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OpenRouter is not configured. Add OPENROUTER_API_KEY to .env.local.");
  }

  const model =
    process.env.OPENROUTER_MODEL?.trim() || "openrouter/auto";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
        "http://localhost:3000",
      "X-Title": "Weekend captions",
    },
    body: JSON.stringify({
      model,
      temperature: 0.9,
      // Optional vibe makes prompts longer; give free/thinking models room.
      max_tokens: 256,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const payload = (await response.json()) as {
    choices?: {
      message?: { content?: unknown };
      finish_reason?: string | null;
    }[];
    error?: { message?: string };
  };

  if (!response.ok) {
    const apiMessage = payload.error?.message ?? `HTTP ${response.status}`;
    if (apiMessage.toLowerCase().includes("guardrail")) {
      throw new Error(
        "OpenRouter blocked this model via workspace guardrails. Open https://openrouter.ai/workspaces/default/guardrails and allow at least one model.",
      );
    }
    throw new Error(`OpenRouter error: ${apiMessage}`);
  }

  const choice = payload.choices?.[0];
  const raw = extractMessageContent(choice?.message?.content);

  if (!raw) {
    const reason = choice?.finish_reason
      ? ` (finish_reason: ${choice.finish_reason})`
      : "";
    throw new Error(`OpenRouter returned an empty caption.${reason}`);
  }

  const text = cleanCaption(raw);

  if (!text) {
    throw new Error("OpenRouter returned an empty caption.");
  }

  return text;
}
