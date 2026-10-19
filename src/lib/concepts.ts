export type Concept = {
  id: string;
  label: string;
  howPrompt: string;
  hintSyntax: string;
  track: string;
  /** Curriculum wave (1–8). Defaults to 1 when omitted. */
  wave?: number;
};

/** Skillpoints at or above this count as mastered (green on the path map). */
export const MASTERY_SKILL_POINTS = 3;

/** Starter Wave 1 concepts — function language, not a keyword dump. */
export const CONCEPTS: Concept[] = [
  {
    id: "assign_value",
    label: "Store a value in a name",
    howPrompt: "How do I store a value in a name?",
    hintSyntax: "x = ...",
    track: "names",
  },
  {
    id: "print_value",
    label: "Show a value",
    howPrompt: "How do I show a value?",
    hintSyntax: "print",
    track: "names",
  },
  {
    id: "arith_add",
    label: "Add numbers together",
    howPrompt: "How do I add numbers together?",
    hintSyntax: "+",
    track: "names",
  },
  {
    id: "equality",
    label: "Check whether two values are equal",
    howPrompt: "How do I check whether two values are equal?",
    hintSyntax: "==",
    track: "compare",
  },
  {
    id: "inequality",
    label: "Check whether two values are not equal",
    howPrompt: "How do I check whether two values are not equal?",
    hintSyntax: "!=",
    track: "compare",
  },
  {
    id: "compare_order",
    label: "Compare which value is bigger or smaller",
    howPrompt: "How do I compare which value is bigger or smaller?",
    hintSyntax: "< >",
    track: "compare",
  },
  {
    id: "if_branch",
    label: "Do something only when a condition is true",
    howPrompt: "How do I do something only when a condition is true?",
    hintSyntax: "if",
    track: "choose",
  },
  {
    id: "if_else",
    label: "Choose between two paths",
    howPrompt: "How do I choose between two paths?",
    hintSyntax: "if / else",
    track: "choose",
  },
  {
    id: "list_create",
    label: "Make a list of values",
    howPrompt: "How do I make a list of values?",
    hintSyntax: "[a, b, c]",
    track: "lists",
  },
  {
    id: "list_length",
    label: "Count items in a list",
    howPrompt: "How do I count items in a list?",
    hintSyntax: "len",
    track: "lists",
  },
  {
    id: "list_index",
    label: "Get an item by position",
    howPrompt: "How do I get an item by position?",
    hintSyntax: "list[0]",
    track: "lists",
  },
  {
    id: "list_membership",
    label: "Check whether a value is in a list",
    howPrompt: "How do I check whether a value is in a list?",
    hintSyntax: "in",
    track: "lists",
  },
  {
    id: "list_absence",
    label: "Check that a value is missing from a list",
    howPrompt: "How do I check that a value is missing from a list?",
    hintSyntax: "not in",
    track: "lists",
  },
  {
    id: "list_append",
    label: "Add an item to the end of a list",
    howPrompt: "How do I add an item to the end of a list?",
    hintSyntax: ".append",
    track: "lists",
  },
  {
    id: "for_loop",
    label: "Repeat something for each item in a list",
    howPrompt: "How do I repeat something for each item in a list?",
    hintSyntax: "for ... in",
    track: "loop",
  },
  {
    id: "loop_accumulate",
    label: "Build a result while looping",
    howPrompt: "How do I build a result while looping?",
    hintSyntax: "running total / collect",
    track: "loop",
  },
  {
    id: "string_combine",
    label: "Join text together",
    howPrompt: "How do I join text together?",
    hintSyntax: "+ or f-string",
    track: "text",
  },
  {
    id: "string_length",
    label: "Count characters in text",
    howPrompt: "How do I count characters in text?",
    hintSyntax: "len on str",
    track: "text",
  },
  {
    id: "string_index",
    label: "Get a character by position",
    howPrompt: "How do I get a character by position?",
    hintSyntax: "text[0]",
    track: "text",
  },
  {
    id: "input_read",
    label: "Ask the user for a value",
    howPrompt: "How do I ask the user for a value?",
    hintSyntax: "input",
    track: "names",
  },
  {
    id: "bool_and",
    label: "Require two conditions both true",
    howPrompt: "How do I require two conditions both true?",
    hintSyntax: "and",
    track: "choose",
  },
  {
    id: "bool_or",
    label: "Accept either of two conditions",
    howPrompt: "How do I accept either of two conditions?",
    hintSyntax: "or",
    track: "choose",
  },
];

export const CONCEPT_BY_ID = Object.fromEntries(
  CONCEPTS.map((c) => [c.id, c]),
) as Record<string, Concept>;

/**
 * Direct prerequisites: child → rule.
 * - `all`: every listed parent is required
 * - `anyOf`: at least one listed parent is enough
 * Soft guidance only — not access locks.
 */
export type PrereqRule = {
  all?: string[];
  anyOf?: string[];
};

export const PREREQS: Record<string, PrereqRule> = {
  // Names and output
  input_read: { all: ["assign_value"] },
  arith_add: { all: ["assign_value"] },
  // Comparisons
  inequality: { all: ["equality"] },
  compare_order: { all: ["equality"] },
  // Decisions
  if_branch: { anyOf: ["equality", "compare_order"] },
  if_else: { all: ["if_branch"] },
  bool_and: { all: ["if_branch"] },
  bool_or: { all: ["if_branch"] },
  // Lists
  list_length: { all: ["list_create"] },
  list_index: { all: ["list_create"] },
  list_membership: { all: ["list_create"] },
  list_absence: { all: ["list_membership"] },
  list_append: { all: ["list_create"] },
  // Text
  string_combine: { all: ["assign_value"] },
  string_length: { all: ["string_combine"] },
  string_index: { all: ["string_combine"] },
  // Loops
  for_loop: { all: ["list_create"] },
  loop_accumulate: { all: ["for_loop", "assign_value"] },
};

/** Flattened parent ids (for edges / display). */
export function directPrereqs(conceptId: string): string[] {
  const rule = PREREQS[conceptId];
  if (!rule) return [];
  return [...(rule.all ?? []), ...(rule.anyOf ?? [])];
}

export function prereqsMet(
  conceptId: string,
  owned: Set<string> | ReadonlySet<string>,
): boolean {
  const rule = PREREQS[conceptId];
  if (!rule) return true;
  const allOk = (rule.all ?? []).every((id) => owned.has(id));
  const anyOf = rule.anyOf ?? [];
  const anyOk = anyOf.length === 0 || anyOf.some((id) => owned.has(id));
  return allOk && anyOk;
}

export type ConceptLayer = {
  layer: number;
  concepts: Concept[];
};

/** Topological layers for the waterfall map (layer 0 = starters). */
export function getConceptLayers(): ConceptLayer[] {
  const layerOf = new Map<string, number>();

  function depth(id: string, stack: Set<string>): number {
    if (layerOf.has(id)) return layerOf.get(id)!;
    if (stack.has(id)) return 0;
    stack.add(id);
    const rule = PREREQS[id];
    let d = 0;
    if (rule) {
      const allDepths = (rule.all ?? []).map((p) => depth(p, stack));
      const anyDepths = (rule.anyOf ?? []).map((p) => depth(p, stack));
      const fromAll =
        allDepths.length === 0 ? 0 : 1 + Math.max(...allDepths);
      // anyOf: learnable after the shallowest alternative
      const fromAny =
        anyDepths.length === 0 ? 0 : 1 + Math.min(...anyDepths);
      d = Math.max(fromAll, fromAny);
    }
    stack.delete(id);
    layerOf.set(id, d);
    return d;
  }

  for (const c of CONCEPTS) depth(c.id, new Set());

  const maxLayer = Math.max(0, ...[...layerOf.values()]);
  const layers: ConceptLayer[] = [];
  for (let i = 0; i <= maxLayer; i++) {
    layers.push({
      layer: i,
      concepts: CONCEPTS.filter((c) => layerOf.get(c.id) === i),
    });
  }
  return layers;
}

/** Directed edges for drawing the map (all + anyOf parents). */
export function getPrereqEdges(): { from: string; to: string }[] {
  const edges: { from: string; to: string }[] = [];
  for (const child of Object.keys(PREREQS)) {
    if (!CONCEPT_BY_ID[child]) continue;
    for (const parent of directPrereqs(child)) {
      if (CONCEPT_BY_ID[parent]) edges.push({ from: parent, to: child });
    }
  }
  return edges;
}

/** Top-level path map nodes (curriculum waves). */
export type WaveDef = {
  id: number;
  label: string;
  blurb: string;
  /** Highlight as the current product focus. */
  focus?: boolean;
};

export const WAVES: WaveDef[] = [
  {
    id: 1,
    label: "Foundations",
    blurb: "Write small programs and trace what they do",
    focus: true,
  },
  {
    id: 2,
    label: "Working with data",
    blurb: "Choose an appropriate data structure for a task",
  },
  {
    id: 3,
    label: "Reusable, reliable code",
    blurb: "Turn a solution into a reusable, testable function",
  },
  {
    id: 4,
    label: "Core problem-solving patterns",
    blurb: "Recognize recurring problems and select a strategy",
  },
  {
    id: 5,
    label: "Search and ordering",
    blurb: "Exploit ordering to solve problems more efficiently",
  },
  {
    id: 6,
    label: "Recursion and structured data",
    blurb: "Solve problems with hierarchical data and recursive structure",
  },
  {
    id: 7,
    label: "Graphs and traversal",
    blurb: "Reason about relationships, reachability, and routes",
  },
  {
    id: 8,
    label: "Advanced algorithms",
    blurb: "Solve unfamiliar problems and analyze efficiency",
  },
];

/** Coarse sections inside a wave (not individual skills). */
export type TrackDef = {
  id: string;
  label: string;
  blurb: string;
  wave: number;
  /** Waterfall row within the wave (0 = top). */
  layer: number;
};

export const TRACKS: TrackDef[] = [
  // Wave 1
  {
    id: "names",
    wave: 1,
    label: "Names and output",
    blurb: "Store, show, ask, and add values",
    layer: 0,
  },
  {
    id: "compare",
    wave: 1,
    label: "Comparisons",
    blurb: "Equal, not equal, bigger or smaller",
    layer: 0,
  },
  {
    id: "lists",
    wave: 1,
    label: "Lists",
    blurb: "Make, count, index, and grow lists",
    layer: 1,
  },
  {
    id: "text",
    wave: 1,
    label: "Text",
    blurb: "Join, measure, and index strings",
    layer: 1,
  },
  {
    id: "choose",
    wave: 1,
    label: "Decisions",
    blurb: "If, else, and / or",
    layer: 1,
  },
  {
    id: "loop",
    wave: 1,
    label: "Loops",
    blurb: "Repeat and build results",
    layer: 2,
  },
  // Wave 2 (roadmap tracks — skills not shipped yet)
  {
    id: "w2_lists",
    wave: 2,
    label: "Deeper lists",
    blurb: "Slice, update, sort, nest, copy",
    layer: 0,
  },
  {
    id: "w2_tuples",
    wave: 2,
    label: "Tuples",
    blurb: "Group and unpack values",
    layer: 1,
  },
  {
    id: "w2_dicts",
    wave: 2,
    label: "Dictionaries",
    blurb: "Keys, lookup, and updates",
    layer: 1,
  },
  {
    id: "w2_sets",
    wave: 2,
    label: "Sets",
    blurb: "Uniqueness and membership",
    layer: 2,
  },
  {
    id: "w2_comprehensions",
    wave: 2,
    label: "Comprehensions",
    blurb: "Build collections from iterables",
    layer: 2,
  },
  // Wave 3
  {
    id: "w3_functions",
    wave: 3,
    label: "Functions",
    blurb: "Define, parameters, return vs print",
    layer: 0,
  },
  {
    id: "w3_builtins",
    wave: 3,
    label: "Built-ins",
    blurb: "sum, sorted, enumerate, zip, …",
    layer: 1,
  },
  {
    id: "w3_errors",
    wave: 3,
    label: "Errors & debugging",
    blurb: "Tracebacks, try/except, edge cases",
    layer: 1,
  },
  {
    id: "w3_mutation",
    wave: 3,
    label: "Mutation & copies",
    blurb: "Shared references vs independent data",
    layer: 2,
  },
  // Wave 4
  {
    id: "w4_transform",
    wave: 4,
    label: "Filter & transform",
    blurb: "Keep, convert, and reshape items",
    layer: 0,
  },
  {
    id: "w4_count",
    wave: 4,
    label: "Counting & lookup",
    blurb: "Frequency, seen sets, fast lookup",
    layer: 0,
  },
  {
    id: "w4_linear",
    wave: 4,
    label: "Stacks & queues",
    blurb: "Order of processing",
    layer: 1,
  },
  {
    id: "w4_windows",
    wave: 4,
    label: "Windows & pointers",
    blurb: "Two pointers, sliding window, prefix sums",
    layer: 1,
  },
  // Waves 5–8 (coarse families)
  {
    id: "w5_sort",
    wave: 5,
    label: "Sorting",
    blurb: "Order and custom keys",
    layer: 0,
  },
  {
    id: "w5_search",
    wave: 5,
    label: "Binary search",
    blurb: "Boundaries and sorted data",
    layer: 1,
  },
  {
    id: "w5_intervals",
    wave: 5,
    label: "Intervals",
    blurb: "Merge and search ranges",
    layer: 1,
  },
  {
    id: "w6_recursion",
    wave: 6,
    label: "Recursion",
    blurb: "Base cases and call stack",
    layer: 0,
  },
  {
    id: "w6_trees",
    wave: 6,
    label: "Trees & BSTs",
    blurb: "Hierarchical structure",
    layer: 1,
  },
  {
    id: "w6_heaps",
    wave: 6,
    label: "Heaps",
    blurb: "Priority queues",
    layer: 1,
  },
  {
    id: "w7_graphs",
    wave: 7,
    label: "Graph reps",
    blurb: "Adjacency and relationships",
    layer: 0,
  },
  {
    id: "w7_traverse",
    wave: 7,
    label: "BFS & DFS",
    blurb: "Visited sets and components",
    layer: 1,
  },
  {
    id: "w7_paths",
    wave: 7,
    label: "Ordering & paths",
    blurb: "Topo sort and shortest paths",
    layer: 2,
  },
  {
    id: "w8_search",
    wave: 8,
    label: "Backtracking & greedy",
    blurb: "Explore choices systematically",
    layer: 0,
  },
  {
    id: "w8_dp",
    wave: 8,
    label: "Dynamic programming",
    blurb: "Overlapping subproblems",
    layer: 1,
  },
  {
    id: "w8_complexity",
    wave: 8,
    label: "Complexity & mixed",
    blurb: "Justify and analyze approaches",
    layer: 1,
  },
];

/** Section edges within a wave. */
export const TRACK_PREREQS: Record<string, string[]> = {
  // Wave 1
  text: ["names"],
  choose: ["compare"],
  lists: ["names"],
  loop: ["lists"],
  // Wave 2
  w2_tuples: ["w2_lists"],
  w2_dicts: ["w2_lists"],
  w2_sets: ["w2_dicts"],
  w2_comprehensions: ["w2_lists", "w2_dicts"],
  // Wave 3
  w3_builtins: ["w3_functions"],
  w3_errors: ["w3_functions"],
  w3_mutation: ["w3_functions"],
  // Wave 4
  w4_linear: ["w4_transform", "w4_count"],
  w4_windows: ["w4_transform", "w4_count"],
  // Wave 5
  w5_search: ["w5_sort"],
  w5_intervals: ["w5_sort"],
  // Wave 6
  w6_trees: ["w6_recursion"],
  w6_heaps: ["w6_recursion"],
  // Wave 7
  w7_traverse: ["w7_graphs"],
  w7_paths: ["w7_traverse"],
  // Wave 8
  w8_dp: ["w8_search"],
  w8_complexity: ["w8_search"],
};

export function conceptWave(c: Concept): number {
  return c.wave ?? 1;
}

export function conceptsInTrack(trackId: string): Concept[] {
  return CONCEPTS.filter((c) => c.track === trackId);
}

export function conceptsInWave(wave: number): Concept[] {
  return CONCEPTS.filter((c) => conceptWave(c) === wave);
}

export function tracksInWave(wave: number): TrackDef[] {
  return TRACKS.filter((t) => t.wave === wave);
}

export function getTrackLayers(
  wave = 1,
): { layer: number; tracks: TrackDef[] }[] {
  const tracks = tracksInWave(wave);
  if (tracks.length === 0) return [];
  const maxLayer = Math.max(...tracks.map((t) => t.layer));
  const layers: { layer: number; tracks: TrackDef[] }[] = [];
  for (let i = 0; i <= maxLayer; i++) {
    layers.push({
      layer: i,
      tracks: tracks.filter((t) => t.layer === i),
    });
  }
  return layers;
}

export function getTrackEdges(
  wave = 1,
): { from: string; to: string }[] {
  const ids = new Set(tracksInWave(wave).map((t) => t.id));
  const edges: { from: string; to: string }[] = [];
  for (const [child, parents] of Object.entries(TRACK_PREREQS)) {
    if (!ids.has(child)) continue;
    for (const parent of parents) {
      if (ids.has(parent)) edges.push({ from: parent, to: child });
    }
  }
  return edges;
}

export function getWaveEdges(): { from: number; to: number }[] {
  const edges: { from: number; to: number }[] = [];
  for (let i = 0; i < WAVES.length - 1; i++) {
    edges.push({ from: WAVES[i].id, to: WAVES[i + 1].id });
  }
  return edges;
}

/** Undirected adjacency edges (a, b). */
const EDGE_PAIRS: [string, string][] = [
  ["assign_value", "print_value"],
  ["assign_value", "list_create"],
  ["assign_value", "input_read"],
  ["assign_value", "string_combine"],
  ["assign_value", "loop_accumulate"],
  ["assign_value", "arith_add"],
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
  ["list_index", "string_index"],
  ["list_membership", "list_absence"],
  ["list_membership", "for_loop"],
  ["list_absence", "list_append"],
  ["list_append", "for_loop"],
  ["for_loop", "loop_accumulate"],
  ["string_combine", "string_length"],
  ["string_combine", "string_index"],
  ["string_combine", "input_read"],
  ["string_length", "list_length"],
  ["string_length", "string_index"],
  ["bool_and", "bool_or"],
  ["input_read", "string_combine"],
];

export const STARTER_CONCEPT_IDS = [
  "assign_value",
  "print_value",
  "list_create",
  "equality",
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

/** Skills linked by soft edges or hard prereqs (parents + children). */
export function getSkillNeighbors(conceptId: string): string[] {
  const ids = new Set<string>();
  for (const parent of directPrereqs(conceptId)) {
    if (CONCEPT_BY_ID[parent]) ids.add(parent);
  }
  for (const child of Object.keys(PREREQS)) {
    if (!CONCEPT_BY_ID[child]) continue;
    if (directPrereqs(child).includes(conceptId)) ids.add(child);
  }
  for (const n of neighborsOf(conceptId)) {
    if (CONCEPT_BY_ID[n]) ids.add(n);
  }
  ids.delete(conceptId);
  return [...ids];
}

/** Focus skill plus its neighbors, with edges among that set. */
export function getNeighborhoodGraph(focusId: string): {
  conceptIds: string[];
  edges: { from: string; to: string }[];
} {
  if (!CONCEPT_BY_ID[focusId]) {
    return { conceptIds: [], edges: [] };
  }
  const conceptIds = [focusId, ...getSkillNeighbors(focusId)];
  const idSet = new Set(conceptIds);
  const edgeKeys = new Set<string>();
  const edges: { from: string; to: string }[] = [];

  const push = (from: string, to: string) => {
    const key = `${from}->${to}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ from, to });
  };

  for (const id of conceptIds) {
    for (const parent of directPrereqs(id)) {
      if (idSet.has(parent)) push(parent, id);
    }
  }
  for (const [a, b] of EDGE_PAIRS) {
    if (!idSet.has(a) || !idSet.has(b)) continue;
    if (edgeKeys.has(`${a}->${b}`) || edgeKeys.has(`${b}->${a}`)) continue;
    push(a, b);
  }

  return { conceptIds, edges };
}

/** Prereq edges among skills in a track (for section drill-down). */
export function getTrackSkillEdges(
  trackId: string,
): { from: string; to: string }[] {
  const ids = new Set(conceptsInTrack(trackId).map((c) => c.id));
  return getPrereqEdges().filter(
    (e) => ids.has(e.from) && ids.has(e.to),
  );
}

export function getConcept(id: string): Concept | undefined {
  return CONCEPT_BY_ID[id];
}

/** Section (track) labels for Explore tags — never the word "wave". */
export function sectionLabelsForConceptIds(conceptIds: string[]): string[] {
  const labels = new Set<string>();
  for (const id of conceptIds) {
    const concept = CONCEPT_BY_ID[id];
    if (!concept) continue;
    const track = TRACKS.find((t) => t.id === concept.track);
    if (track?.label) labels.add(track.label);
  }
  return [...labels];
}

/** Tags that are not curriculum-section chips. */
export const EXPLORE_META_TAGS = new Set(["practice", "challenge", "python"]);

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
