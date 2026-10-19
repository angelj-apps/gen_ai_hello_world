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
- If you mention a Python term (built-in, type, etc.), define it in the same sentence in plain language.
- When the learner provided an attempt: the "code" field MUST be a corrected rewrite of THEIR attempt (keep their intent, names, and structure when possible). Do NOT invent a parallel unrelated demo (e.g. fruits when they wrote numbers). Explanation must name what was wrong/right in their lines, then the fix.`;

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
    try_changing:
      typeof obj.try_changing === "string" && obj.try_changing.trim()
        ? obj.try_changing.trim()
        : "—",
    tags: tags.length ? tags : ["python"],
    difficulty: asString(obj.difficulty ?? "beginner", "difficulty"),
  };
}

type GenerateOptions = {
  conceptLabel?: string;
  hintSyntax?: string;
  learnerAttempt?: string;
  discoveryPrompt?: string;
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
  if (options?.discoveryPrompt?.trim()) {
    lines.push(
      `Discovery exercise the learner just tried: ${options.discoveryPrompt.trim()}`,
      `Keep the tool card grounded in that discovery scenario when possible.`,
    );
  }
  if (options?.learnerAttempt?.trim()) {
    lines.push(
      `Learner attempt (REQUIRED starting point — rewrite THIS, do not replace with a new example):\n${options.learnerAttempt.trim()}`,
      `CRITICAL: Put the fixed version of their attempt in "code". Keep the same task and similar variable names. In "explanation", say what they got right, what to change, and why. example_input/example_output should match their scenario. Stay encouraging. Same single concept only.`,
    );
  }
  // try_changing still required by schema; keep short/neutral until a terminal exists.
  lines.push(`For try_changing, give one brief phrase (not a long experiment).`);
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

export async function generatePracticeFields(
  tools: {
    title: string;
    code?: string;
    what_it_does: string;
  }[],
) {
  const systemPrompt = `You create one short beginner Python practice task.
Return ONLY JSON with strings: prompt, hint, sample_solution, explanation.

Task design rules:
- One coherent goal the learner can finish in a few lines (not a checklist of skills).
- Weave the given skills in naturally. Setup that is required for another skill (e.g. making a list so you can loop) is NOT a separate requirement.
- Do NOT write bullet lists like "1) define a list 2) use a for loop" when step 2 already implies step 1.
- Prefer one verifiable outcome (what should print / what the program should do).
- If several skills are selected, combine them into ONE small scenario — pick the main action; leave out redundant extras.
- Keep it tiny. No unrelated concepts.`;

  const userPrompt = [
    "Skills available (use what fits one small task; do not turn each into its own bullet):",
    ...tools.map((t, i) => {
      const code = t.code?.trim()
        ? `\nExample code:\n${t.code}`
        : "";
      return `${i + 1}. ${t.title}: ${t.what_it_does}${code}`;
    }),
    "Write prompt as a short natural-language problem (2–4 sentences max), not a skill checklist.",
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
    parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<
      string,
      unknown
    >;
  }

  return {
    prompt: asString(parsed.prompt, "prompt"),
    hint: asString(parsed.hint, "hint"),
    sample_solution: asString(parsed.sample_solution, "sample_solution"),
    explanation: asString(parsed.explanation, "explanation"),
  } satisfies PracticePayload;
}

export type PracticeGrade = {
  outcome: "correct" | "partial" | "incorrect";
  feedback: string;
};

export async function gradePracticeAttempt(input: {
  prompt: string;
  sampleSolution: string;
  userAnswer: string;
  /** Captured stdout/stderr from running the learner's code (may be empty). */
  runOutput?: string;
  /** Runtime error message if the program crashed. */
  runError?: string | null;
}) {
  const systemPrompt = `You grade a beginner Python practice attempt.
You MUST consider BOTH:
1) the code the learner wrote, and
2) the program output / runtime error from running that code (when provided).

Return ONLY JSON with:
- outcome: "correct" | "partial" | "incorrect"
- feedback: short plain-language note (what worked, what to fix)

Grading guide:
- correct: code and observed output show the task is solved (small style differences OK)
- partial: right idea but incomplete, wrong output, or fixable bugs
- incorrect: does not address the task, or output clearly fails the requirement
Be fair to beginners. If output is missing, judge from the code alone but prefer partial over correct when unsure.`;

  const userPrompt = [
    `Task:\n${input.prompt}`,
    `Sample solution:\n${input.sampleSolution}`,
    `Learner code:\n${input.userAnswer}`,
    `Program output:\n${input.runOutput?.trim() ? input.runOutput : "(no output captured)"}`,
    `Runtime error:\n${input.runError?.trim() ? input.runError : "(none)"}`,
  ].join("\n\n");

  const raw = await openRouterChat({
    systemPrompt,
    userPrompt,
    maxTokens: 500,
    temperature: 0.2,
    title: "Little Tools Grade",
  });

  const cleaned = stripFences(raw);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<
      string,
      unknown
    >;
  }

  const outcomeRaw = String(parsed.outcome ?? "incorrect").toLowerCase();
  const outcome: PracticeGrade["outcome"] =
    outcomeRaw === "correct" || outcomeRaw === "partial"
      ? outcomeRaw
      : "incorrect";

  return {
    outcome,
    feedback: asString(parsed.feedback ?? "Checked your attempt.", "feedback"),
  } satisfies PracticeGrade;
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
