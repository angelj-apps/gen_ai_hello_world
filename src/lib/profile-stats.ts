import {
  CONCEPTS,
  MASTERY_SKILL_POINTS,
  WAVES,
  conceptWave,
} from "@/lib/concepts";

export type SkillProgressRow = {
  conceptId: string;
  skillPoints: number;
  learnedAt?: string | null;
};

export type WaveBar = {
  wave: number;
  label: string;
  total: number;
  seen: number;
  mastered: number;
  /** 0..1 average mastery fraction across skills in the wave */
  fill: number;
};

function dayKey(iso: string, timeZone?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone }); // YYYY-MM-DD
}

function todayKey(timeZone?: string): string {
  return new Date().toLocaleDateString("en-CA", { timeZone });
}

function shiftDayKey(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

/** Consecutive active days ending today, or yesterday if today is quiet. */
export function computeStreak(
  activityIsos: readonly string[],
  timeZone?: string,
): number {
  const days = new Set<string>();
  for (const iso of activityIsos) {
    const key = dayKey(iso, timeZone);
    if (key) days.add(key);
  }
  if (days.size === 0) return 0;

  let cursor = todayKey(timeZone);
  if (!days.has(cursor)) {
    cursor = shiftDayKey(cursor, -1);
    if (!days.has(cursor)) return 0;
  }

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftDayKey(cursor, -1);
  }
  return streak;
}

export function waveProgressBars(
  progress: readonly SkillProgressRow[],
): WaveBar[] {
  const points = new Map(
    progress.map((row) => [row.conceptId, Math.max(0, row.skillPoints)]),
  );

  return WAVES.map((wave) => {
    const skills = CONCEPTS.filter((c) => conceptWave(c) === wave.id);
    const total = skills.length;
    let seen = 0;
    let mastered = 0;
    let fillSum = 0;

    for (const skill of skills) {
      if (!points.has(skill.id)) continue;
      seen += 1;
      const pts = points.get(skill.id) ?? 0;
      if (pts >= MASTERY_SKILL_POINTS) {
        mastered += 1;
        fillSum += 1;
      } else {
        fillSum += Math.min(1, pts / MASTERY_SKILL_POINTS);
      }
    }

    return {
      wave: wave.id,
      label: wave.label,
      total,
      seen,
      mastered,
      fill: total === 0 ? 0 : fillSum / total,
    };
  });
}
