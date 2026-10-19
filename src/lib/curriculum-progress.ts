import {
  CONCEPT_BY_ID,
  MASTERY_SKILL_POINTS,
  conceptsInTrack,
  conceptsInWave,
  type Concept,
} from "@/lib/concepts";

export type ProgressKind = "grey" | "yellow" | "green";

export type NodeStyle = {
  kind: ProgressKind;
  /** 0..1 yellow intensity; only set when kind === "yellow". */
  t?: number;
  fill: string;
  labelColor: string;
};

const GREY = "#c5ccc8";
const GREEN = "#2f6f4e";
const YELLOW_PALE = "#f5efd0";
const YELLOW_STRONG = "#d4a017";
/** Dark enough on grey/pale yellow fills (≥ ~4.5:1). */
const LABEL_ON_LIGHT = "#12151a";
const LABEL_ON_GREEN = "#f7faf8";

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function mixHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const h = hex.replace("#", "");
    return [
      Number.parseInt(h.slice(0, 2), 16),
      Number.parseInt(h.slice(2, 4), 16),
      Number.parseInt(h.slice(4, 6), 16),
    ] as const;
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/** Yellow fill from pale (t=0) to strong amber (t→1). */
export function yellowFill(t: number): string {
  return mixHex(YELLOW_PALE, YELLOW_STRONG, clamp01(t));
}

/**
 * Map toolkit progress to node style.
 * - grey: never seen (no points map entry)
 * - yellow: seen, skill_points < mastery (deeper yellow as points rise)
 * - green: skill_points >= mastery
 */
export function nodeStyle(
  conceptId: string,
  skillPointsByConcept: ReadonlyMap<string, number>,
): NodeStyle {
  if (!CONCEPT_BY_ID[conceptId]) {
    return { kind: "grey", fill: GREY, labelColor: LABEL_ON_LIGHT };
  }

  if (!skillPointsByConcept.has(conceptId)) {
    return { kind: "grey", fill: GREY, labelColor: LABEL_ON_LIGHT };
  }

  const points = Math.max(0, Number(skillPointsByConcept.get(conceptId) ?? 0));

  if (points >= MASTERY_SKILL_POINTS) {
    return { kind: "green", fill: GREEN, labelColor: LABEL_ON_GREEN };
  }

  // Grade yellow using points / mastery so 0 is pale and near-mastery is deep.
  const t = clamp01(points / MASTERY_SKILL_POINTS);
  // Nudge 0-point "seen" slightly above pure pale so it reads as yellow, not cream.
  const visualT = points === 0 ? 0.12 : Math.max(0.2, t);
  const fill = yellowFill(visualT);
  return {
    kind: "yellow",
    t: visualT,
    fill,
    labelColor: LABEL_ON_LIGHT,
  };
}

type AggregateStyle = NodeStyle & {
  seen: number;
  total: number;
  mastered: number;
};

function aggregateSkills(
  skills: Concept[],
  skillPointsByConcept: ReadonlyMap<string, number>,
): AggregateStyle {
  const total = skills.length;
  if (total === 0) {
    return {
      kind: "grey",
      fill: GREY,
      labelColor: LABEL_ON_LIGHT,
      seen: 0,
      total: 0,
      mastered: 0,
    };
  }

  let seen = 0;
  let mastered = 0;
  let progressSum = 0;

  for (const skill of skills) {
    if (!skillPointsByConcept.has(skill.id)) {
      progressSum += 0;
      continue;
    }
    seen += 1;
    const points = Math.max(0, Number(skillPointsByConcept.get(skill.id) ?? 0));
    if (points >= MASTERY_SKILL_POINTS) {
      mastered += 1;
      progressSum += 1;
    } else {
      progressSum += clamp01(points / MASTERY_SKILL_POINTS);
    }
  }

  if (seen === 0) {
    return {
      kind: "grey",
      fill: GREY,
      labelColor: LABEL_ON_LIGHT,
      seen,
      total,
      mastered,
    };
  }

  if (mastered === total) {
    return {
      kind: "green",
      fill: GREEN,
      labelColor: LABEL_ON_GREEN,
      seen,
      total,
      mastered,
    };
  }

  const t = clamp01(progressSum / total);
  const visualT = Math.max(0.15, t);
  return {
    kind: "yellow",
    t: visualT,
    fill: yellowFill(visualT),
    labelColor: LABEL_ON_LIGHT,
    seen,
    total,
    mastered,
  };
}

/** Aggregate a whole track/section for the path map. */
export function sectionStyle(
  trackId: string,
  skillPointsByConcept: ReadonlyMap<string, number>,
): AggregateStyle {
  return aggregateSkills(conceptsInTrack(trackId), skillPointsByConcept);
}

/** Aggregate an entire curriculum wave. */
export function waveStyle(
  wave: number,
  skillPointsByConcept: ReadonlyMap<string, number>,
): AggregateStyle {
  return aggregateSkills(conceptsInWave(wave), skillPointsByConcept);
}
