export type Concept = {
  id: string;
  label: string;
  howPrompt: string;
  hintSyntax: string;
};

/** Starter 20 beginner Python concepts — function language, not a keyword dump. */
export const CONCEPTS: Concept[] = [
  {
    id: "assign_value",
    label: "Store a value in a name",
    howPrompt: "How do I store a value in a name?",
    hintSyntax: "x = ...",
  },
  {
    id: "print_value",
    label: "Show a value",
    howPrompt: "How do I show a value?",
    hintSyntax: "print",
  },
  {
    id: "equality",
    label: "Check whether two values are equal",
    howPrompt: "How do I check whether two values are equal?",
    hintSyntax: "==",
  },
  {
    id: "inequality",
    label: "Check whether two values are not equal",
    howPrompt: "How do I check whether two values are not equal?",
    hintSyntax: "!=",
  },
  {
    id: "compare_order",
    label: "Compare which value is bigger or smaller",
    howPrompt: "How do I compare which value is bigger or smaller?",
    hintSyntax: "< >",
  },
  {
    id: "if_branch",
    label: "Do something only when a condition is true",
    howPrompt: "How do I do something only when a condition is true?",
    hintSyntax: "if",
  },
  {
    id: "if_else",
    label: "Choose between two paths",
    howPrompt: "How do I choose between two paths?",
    hintSyntax: "if / else",
  },
  {
    id: "list_create",
    label: "Make a list of values",
    howPrompt: "How do I make a list of values?",
    hintSyntax: "[a, b, c]",
  },
  {
    id: "list_length",
    label: "Count items in a list",
    howPrompt: "How do I count items in a list?",
    hintSyntax: "len",
  },
  {
    id: "list_index",
    label: "Get an item by position",
    howPrompt: "How do I get an item by position?",
    hintSyntax: "list[0]",
  },
  {
    id: "list_membership",
    label: "Check whether a value is in a list",
    howPrompt: "How do I check whether a value is in a list?",
    hintSyntax: "in",
  },
  {
    id: "list_absence",
    label: "Check that a value is missing from a list",
    howPrompt: "How do I check that a value is missing from a list?",
    hintSyntax: "not in",
  },
  {
    id: "list_append",
    label: "Add an item to the end of a list",
    howPrompt: "How do I add an item to the end of a list?",
    hintSyntax: ".append",
  },
  {
    id: "for_loop",
    label: "Repeat something for each item in a list",
    howPrompt: "How do I repeat something for each item in a list?",
    hintSyntax: "for ... in",
  },
  {
    id: "loop_accumulate",
    label: "Build a result while looping",
    howPrompt: "How do I build a result while looping?",
    hintSyntax: "running total / collect",
  },
  {
    id: "string_combine",
    label: "Join text together",
    howPrompt: "How do I join text together?",
    hintSyntax: "+ or f-string",
  },
  {
    id: "string_length",
    label: "Count characters in text",
    howPrompt: "How do I count characters in text?",
    hintSyntax: "len on str",
  },
  {
    id: "input_read",
    label: "Ask the user for a value",
    howPrompt: "How do I ask the user for a value?",
    hintSyntax: "input",
  },
  {
    id: "bool_and",
    label: "Require two conditions both true",
    howPrompt: "How do I require two conditions both true?",
    hintSyntax: "and",
  },
  {
    id: "bool_or",
    label: "Accept either of two conditions",
    howPrompt: "How do I accept either of two conditions?",
    hintSyntax: "or",
  },
];

export const CONCEPT_BY_ID = Object.fromEntries(
  CONCEPTS.map((c) => [c.id, c]),
) as Record<string, Concept>;

/** Undirected adjacency edges (a, b). */
const EDGE_PAIRS: [string, string][] = [
  ["assign_value", "print_value"],
  ["assign_value", "list_create"],
  ["assign_value", "input_read"],
  ["print_value", "string_combine"],
  ["equality", "inequality"],
  ["equality", "compare_order"],
  ["equality", "if_branch"],
  ["equality", "list_membership"],
  ["inequality", "compare_order"],
  ["inequality", "if_branch"],
  ["compare_order", "if_branch"],
  ["if_branch", "if_else"],
  ["if_branch", "bool_and"],
  ["if_branch", "bool_or"],
  ["if_branch", "for_loop"],
  ["if_else", "bool_and"],
  ["list_create", "list_length"],
  ["list_create", "list_index"],
  ["list_create", "list_append"],
  ["list_create", "list_membership"],
  ["list_length", "list_index"],
  ["list_length", "string_length"],
  ["list_length", "for_loop"],
  ["list_index", "for_loop"],
  ["list_membership", "list_absence"],
  ["list_membership", "for_loop"],
  ["list_absence", "list_append"],
  ["list_append", "for_loop"],
  ["for_loop", "loop_accumulate"],
  ["string_combine", "string_length"],
  ["string_combine", "input_read"],
  ["string_length", "list_length"],
  ["bool_and", "bool_or"],
  ["input_read", "string_combine"],
];

export const STARTER_CONCEPT_IDS = [
  "assign_value",
  "print_value",
  "list_create",
  "equality",
  "list_length",
] as const;

const HORIZON_CAP = 5;

function neighborsOf(conceptId: string): string[] {
  const out: string[] = [];
  for (const [a, b] of EDGE_PAIRS) {
    if (a === conceptId) out.push(b);
    else if (b === conceptId) out.push(a);
  }
  return out;
}

export function getConcept(id: string): Concept | undefined {
  return CONCEPT_BY_ID[id];
}

/**
 * Small related horizon: neighbors of last learned (not yet learned),
 * else starter cluster. Cap 3–5.
 */
export function getHorizon(
  learnedIds: string[],
  lastConceptId: string | null,
): Concept[] {
  const learned = new Set(learnedIds);
  const pick = (ids: string[]) =>
    ids
      .filter((id) => !learned.has(id) && CONCEPT_BY_ID[id])
      .slice(0, HORIZON_CAP)
      .map((id) => CONCEPT_BY_ID[id]);

  if (lastConceptId && CONCEPT_BY_ID[lastConceptId]) {
    const fromNeighbors = pick(neighborsOf(lastConceptId));
    if (fromNeighbors.length > 0) return fromNeighbors;
  }

  const starter = pick([...STARTER_CONCEPT_IDS]);
  if (starter.length > 0) return starter;

  // All starter done — any unlearned concept, prefer connected to something learned
  const remaining = CONCEPTS.filter((c) => !learned.has(c.id));
  if (remaining.length === 0) return [];

  const adjacentToLearned = new Set<string>();
  for (const id of learnedIds) {
    for (const n of neighborsOf(id)) adjacentToLearned.add(n);
  }
  const preferred = remaining.filter((c) => adjacentToLearned.has(c.id));
  const pool = preferred.length ? preferred : remaining;
  return pool.slice(0, HORIZON_CAP);
}
