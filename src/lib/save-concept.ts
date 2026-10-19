import { CONCEPTS, CONCEPT_BY_ID, getConcept } from "@/lib/concepts";

/** Map known seed / card titles to curriculum concept ids. */
const TITLE_TO_CONCEPT: Record<string, string> = {
  "check membership with in": "list_membership",
  "count items with len()": "list_length",
  "compare with ==": "equality",
  "index the first element": "list_index",
  "loop with for": "for_loop",
  "check absence with not in": "list_absence",
  "store a value in a name": "assign_value",
  "show a value": "print_value",
  "make a list of values": "list_create",
};

function conceptFromTitle(title: string): string | null {
  const titleKey = title.trim().toLowerCase().replace(/\?$/, "");
  if (TITLE_TO_CONCEPT[titleKey]) return TITLE_TO_CONCEPT[titleKey];

  for (const c of CONCEPTS) {
    if (titleKey === c.label.toLowerCase()) return c.id;
    const how = c.howPrompt.toLowerCase().replace(/\?$/, "");
    if (titleKey === how || titleKey === `how do i ${how.replace(/^how do i\s+/, "")}`) {
      return c.id;
    }
  }

  // Fuzzy match common phrasing.
  if (
    titleKey.includes("store a value") ||
    titleKey.includes("in a name") ||
    (titleKey.includes("assign") && titleKey.includes("value"))
  ) {
    return "assign_value";
  }
  if (titleKey.includes("show a value") || titleKey.includes("print")) {
    return "print_value";
  }
  if (titleKey.includes("membership") || /\bwith in\b/.test(titleKey)) {
    return "list_membership";
  }
  if (titleKey.includes("not in") || titleKey.includes("absence")) {
    return "list_absence";
  }
  if (titleKey.includes("len") || titleKey.includes("count items")) {
    return "list_length";
  }
  if (titleKey.includes("index") || titleKey.includes("first element")) {
    return "list_index";
  }
  if (titleKey.includes("loop") || titleKey.includes("for each")) {
    return "for_loop";
  }
  if (titleKey.includes("==") || titleKey.includes("equal")) {
    return "equality";
  }
  if (titleKey.includes("make a list") || titleKey.includes("list of values")) {
    return "list_create";
  }
  return null;
}

export function resolveConceptIdForCard(card: {
  id: string;
  title?: string | null;
  concept_id?: string | null;
  tags?: string[] | null;
  goal?: string | null;
}): string {
  if (card.concept_id && CONCEPT_BY_ID[card.concept_id]) {
    return card.concept_id;
  }

  const fromTitle = card.title ? conceptFromTitle(card.title) : null;
  if (fromTitle) return fromTitle;

  const fromGoal = card.goal ? conceptFromTitle(card.goal) : null;
  if (fromGoal) return fromGoal;

  for (const tag of card.tags ?? []) {
    const t = tag.trim().toLowerCase();
    if (t === "in" || t === "membership") return "list_membership";
    if (t === "len") return "list_length";
    if (t === "for" || t === "loops") return "for_loop";
    if (t === "indexing") return "list_index";
    if (t === "comparison" || t === "booleans") return "equality";
    if (t === "not in") return "list_absence";
    if (t === "variables" || t === "assignment") return "assign_value";
    if (t === "print") return "print_value";
    if (t === "lists") return "list_create";
  }

  // Stable id so skillpoints can live on explore-only cards.
  return `explore:${card.id}`;
}

/** Map a toolkit display label back to a curriculum concept when possible. */
export function conceptIdFromSkillLabel(label: string): string | null {
  return conceptFromTitle(label);
}

export function isExploreOnlyConcept(conceptId: string) {
  return conceptId.startsWith("explore:");
}

/** Human label for practice / toolkit UI. */
export function labelForLearnedSkill(
  conceptId: string,
  cardTitle?: string | null,
) {
  const concept = getConcept(conceptId);
  if (concept) return concept.label;
  if (cardTitle?.trim()) return cardTitle.trim();
  if (isExploreOnlyConcept(conceptId)) return "Saved Explore tool";
  return conceptId;
}

/** Card uuid embedded in explore:… concept ids. */
export function cardIdFromExploreConcept(conceptId: string): string | null {
  if (!isExploreOnlyConcept(conceptId)) return null;
  return conceptId.slice("explore:".length) || null;
}
