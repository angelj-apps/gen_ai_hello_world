import { openRouterChat } from "./openrouter";

export const TOOL_CARD_SYSTEM_PROMPT = `You teach absolute beginners one tiny Python tool at a time.

Return ONLY valid JSON (no markdown fences) with these string fields:
- title: short action-oriented name
- what_it_does: one plain sentence
- code: a small Python snippet (not a whole program)
- example_input: short sample data / context
- example_output: expected output
- explanation: explain unfamiliar syntax simply
- when_to_use: one practical situation
- try_changing: one safe tiny experiment
- tags: array of 1-4 short topic tags
- difficulty: "beginner" | "early" | "intermediate"

Rules:
- Prefer a single new concept/operation (in, ==, len, indexing, for, if, etc.).
- If the goal is too broad, still return one smaller first-step tool that helps.
- Keep code short. No imports unless essential.
- Never claim the code is guaranteed correct.
- If you mention a Python term (built-in, type, etc.), define it in the same sentence in plain language.`;

export type GeneratedToolFields = {
  title: string;
  what_it_does: string;
  code: string;
  example_input: string;
  example_output: string;
  explanation: string;
  when_to_use: string;
  try_changing: string;
  tags: string[];
  difficulty: string;
};

function stripFences(raw: string) {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function asString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing field: ${field}`);
  }
  return value.trim();
}

export function parseToolCardJson(raw: string): GeneratedToolFields {
  const cleaned = stripFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Sometimes models wrap JSON in prose — try first { ... } block.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Model did not return JSON.");
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid tool card JSON.");
  }

  const obj = parsed as Record<string, unknown>;
  const tagsRaw = obj.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.map((t) => String(t).trim()).filter(Boolean).slice(0, 6)
    : typeof tagsRaw === "string"
      ? tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 6)
      : [];

  return {
    title: asString(obj.title, "title"),
    what_it_does: asString(obj.what_it_does, "what_it_does"),
    code: asString(obj.code, "code"),
    example_input: asString(obj.example_input, "example_input"),
    example_output: asString(obj.example_output, "example_output"),
    explanation: asString(obj.explanation, "explanation"),
    when_to_use: asString(obj.when_to_use, "when_to_use"),
    try_changing: asString(obj.try_changing, "try_changing"),
    tags: tags.length ? tags : ["python"],
    difficulty: asString(obj.difficulty ?? "beginner", "difficulty"),
  };
}

type GenerateOptions = {
  conceptLabel?: string;
  hintSyntax?: string;
  learnerAttempt?: string;
};

export function buildToolCardUserPrompt(
  goal: string,
  options?: GenerateOptions,
) {
  const lines = [
    `Beginner question: ${goal.trim()}`,
    `Produce one small Python tool card as JSON.`,
  ];
  if (options?.conceptLabel) {
    lines.push(`Focus on this single concept: ${options.conceptLabel}.`);
  }
  if (options?.hintSyntax) {
    lines.push(`Prefer teaching this idea/syntax: ${options.hintSyntax}.`);
  }
  if (options?.learnerAttempt?.trim()) {
    lines.push(
      `The learner already tried this (treat it as part of the lesson, not a side note):\n${options.learnerAttempt.trim()}`,
      `In explanation (and try_changing / examples when natural), bridge from their attempt to the correct tiny snippet: what was close, what to change. Stay encouraging. Same single concept only.`,
    );
  }
  return lines.join("\n");
}

export async function generateToolCardFields(
  goal: string,
  options?: GenerateOptions,
) {
  const userPrompt = buildToolCardUserPrompt(goal, options);
  const systemPrompt = TOOL_CARD_SYSTEM_PROMPT;

  try {
    const raw = await openRouterChat({
      systemPrompt,
      userPrompt,
      maxTokens: 1200,
      temperature: 0.3,
      title: "Little Tools",
    });
    return {
      fields: parseToolCardJson(raw),
      prompt: userPrompt,
      systemPrompt,
    };
  } catch (firstError) {
    // One retry for malformed JSON / empty responses.
    const raw = await openRouterChat({
      systemPrompt:
        systemPrompt +
        "\n\nYour previous reply was invalid. Reply with ONLY a JSON object.",
      userPrompt,
      maxTokens: 1200,
      temperature: 0.2,
      title: "Little Tools",
    });
    try {
      return {
        fields: parseToolCardJson(raw),
        prompt: userPrompt,
        systemPrompt,
      };
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error("Could not generate a valid tool card.");
    }
  }
}

export type PracticePayload = {
  prompt: string;
  hint: string;
  sample_solution: string;
  explanation: string;
};

export async function generatePracticeFields(tools: {
  title: string;
  code: string;
  what_it_does: string;
}[]) {
  const systemPrompt = `You create one short beginner Python practice task that combines the given tools.
Return ONLY JSON with strings: prompt, hint, sample_solution, explanation.
Keep the task tiny. Ask the learner to write or describe a few lines of code.
Do not introduce unrelated concepts.`;

  const userPrompt = [
    "Saved tools:",
    ...tools.map(
      (t, i) =>
        `${i + 1}. ${t.title}: ${t.what_it_does}\nCode:\n${t.code}`,
    ),
    "Create one practice task that uses these tools together.",
  ].join("\n\n");

  const raw = await openRouterChat({
    systemPrompt,
    userPrompt,
    maxTokens: 900,
    temperature: 0.4,
    title: "Little Tools Practice",
  });

  const cleaned = stripFences(raw);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  }

  return {
    prompt: asString(parsed.prompt, "prompt"),
    hint: asString(parsed.hint, "hint"),
    sample_solution: asString(parsed.sample_solution, "sample_solution"),
    explanation: asString(parsed.explanation, "explanation"),
  } satisfies PracticePayload;
}

const CLARIFY_SYSTEM_PROMPT = `You help a beginner who is still confused about one Python tool card they just opened.

Write plain-language follow-up text only (no JSON). This is an ADD-ON to the card — do not rewrite the whole lesson.

Rules:
- Use their attempt, their question, and the card content they already saw.
- If prior follow-ups exist, build on them; do not repeat or contradict.
- Prefer concrete before/after snippets when naming or syntax is the issue.
- Stay on the same concept; no new advanced topics.
- Short paragraphs; one small code example is fine in a fenced block if helpful.
- Encouraging tone; never shame wrong tries.`;

export type ClarifyKind = "custom" | "simpler" | "example";

export async function generateCardClarification(input: {
  card: {
    goal: string;
    title: string;
    what_it_does: string;
    code: string;
    explanation: string;
  };
  learnerAttempt?: string | null;
  priorClarifications: { question_text: string; answer_text: string }[];
  question: string;
  kind: ClarifyKind;
}) {
  const kindHint =
    input.kind === "simpler"
      ? "Re-explain the most confusing part of the card in simpler words."
      : input.kind === "example"
        ? "Give one new tiny example for the same concept, different from the card."
        : "Answer the learner's question directly.";

  const priorBlock =
    input.priorClarifications.length > 0
      ? [
          "Prior follow-ups on this card:",
          ...input.priorClarifications.map(
            (c, i) =>
              `${i + 1}. Q: ${c.question_text}\n   A: ${c.answer_text}`,
          ),
        ].join("\n")
      : "";

  const userPrompt = [
    `Task: ${kindHint}`,
    `Learner question: ${input.question.trim()}`,
    "",
    "Tool card they saw:",
    `Goal: ${input.card.goal}`,
    `Title: ${input.card.title}`,
    `What it does: ${input.card.what_it_does}`,
    `Code:\n${input.card.code}`,
    `Explanation: ${input.card.explanation}`,
    input.learnerAttempt?.trim()
      ? `Learner attempt before the card:\n${input.learnerAttempt.trim()}`
      : "",
    priorBlock,
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await openRouterChat({
    systemPrompt: CLARIFY_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 700,
    temperature: 0.35,
    title: "Little Tools Clarify",
  });

  const answer = raw.trim();
  if (!answer) {
    throw new Error("Could not generate a clarification.");
  }
  return answer;
}
