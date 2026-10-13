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

type ChatOptions = {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  title?: string;
};

export async function openRouterChat(options: ChatOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OpenRouter is not configured. Add OPENROUTER_API_KEY to .env.local.");
  }

  const model = process.env.OPENROUTER_MODEL?.trim() || "openrouter/auto";
  const maxTokens = options.maxTokens ?? 1024;
  const temperature = options.temperature ?? 0.4;
  const title = options.title ?? "Little Tools";

  async function request(includeReasoning: boolean) {
    const body: Record<string, unknown> = {
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userPrompt },
      ],
    };
    if (includeReasoning) {
      body.reasoning = { effort: "low", max_tokens: 128 };
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000",
        "X-Title": title,
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as {
      choices?: {
        message?: { content?: unknown };
        finish_reason?: string | null;
      }[];
      error?: { message?: string };
    };

    return { response, payload };
  }

  let { response, payload } = await request(true);

  if (
    !response.ok &&
    (payload.error?.message?.toLowerCase().includes("reasoning") ||
      response.status === 400)
  ) {
    ({ response, payload } = await request(false));
  }

  if (!response.ok) {
    const apiMessage = payload.error?.message ?? `HTTP ${response.status}`;
    if (apiMessage.toLowerCase().includes("guardrail")) {
      throw new Error(
        "OpenRouter blocked this model via workspace guardrails. Open https://openrouter.ai/workspaces/default/guardrails and allow at least one model.",
      );
    }
    throw new Error(`OpenRouter error: ${apiMessage}`);
  }

  let raw = extractMessageContent(payload.choices?.[0]?.message?.content);

  if (!raw && payload.choices?.[0]?.finish_reason === "length") {
    ({ response, payload } = await request(false));
    if (!response.ok) {
      throw new Error(
        `OpenRouter error: ${payload.error?.message ?? `HTTP ${response.status}`}`,
      );
    }
    raw = extractMessageContent(payload.choices?.[0]?.message?.content);
  }

  if (!raw) {
    const reason = payload.choices?.[0]?.finish_reason
      ? ` (finish_reason: ${payload.choices[0].finish_reason})`
      : "";
    throw new Error(`OpenRouter returned an empty response.${reason}`);
  }

  return raw;
}
