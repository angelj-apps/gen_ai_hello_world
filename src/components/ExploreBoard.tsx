"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ToolCardView } from "@/components/ToolCardView";
import { EXPLORE_META_TAGS } from "@/lib/concepts";
import type { ToolCard, ToolCardClarification } from "@/lib/supabase/types";

export type ExploreCardRow = {
  card: ToolCard;
  myVote: number | null;
  saved: boolean;
  clarifications: ToolCardClarification[];
  canClarify: boolean;
  canEdit: boolean;
};

type Scope = "all" | "mine" | "community";

type Props = {
  userId: string;
  rows: ExploreCardRow[];
};

export function ExploreBoard({ userId, rows }: Props) {
  const [scope, setScope] = useState<Scope>("all");
  const [section, setSection] = useState<string | null>(null);

  const sectionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      for (const tag of row.card.tags ?? []) {
        if (!EXPLORE_META_TAGS.has(tag.toLowerCase())) set.add(tag);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(({ card }) => {
      const mine = card.user_id === userId;
      if (scope === "mine" && !mine) return false;
      if (scope === "community" && mine) return false;
      if (section && !(card.tags ?? []).includes(section)) return false;
      return true;
    });
  }, [rows, scope, section, userId]);

  const scopes: { id: Scope; label: string; blurb: string }[] = [
    { id: "all", label: "Yours + community", blurb: "Everything shared" },
    { id: "mine", label: "Your posts", blurb: "Challenges you published" },
    { id: "community", label: "Community", blurb: "From other learners" },
  ];

  const progressPct =
    rows.length === 0
      ? 0
      : Math.min(100, Math.round((filtered.length / rows.length) * 100) || 8);

  return (
    <div className="flex flex-col gap-5">
      <div className="learn-fun-shell flex flex-col gap-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] font-semibold tracking-[0.1em] text-accent uppercase">
              Browse · {filtered.length} challenge
              {filtered.length === 1 ? "" : "s"}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Pick a challenge
            </h2>
          </div>
          <Link href="/practice" className="learn-fun-cta w-fit shrink-0">
            Make one in Practice
          </Link>
        </div>

        <div
          className="learn-fun-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          aria-label="Filtered share of Explore feed"
        >
          <span style={{ width: `${Math.max(progressPct, 8)}%` }} />
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] font-bold tracking-[0.1em] text-muted uppercase">
            Whose posts
          </p>
          <div
            className="grid gap-2 sm:grid-cols-3"
            role="group"
            aria-label="Whose posts"
          >
            {scopes.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScope(s.id)}
                aria-pressed={scope === s.id}
                data-on={scope === s.id ? "true" : "false"}
                className="learn-fun-skill flex w-full flex-col items-start gap-1"
              >
                <span className="font-mono text-[11px] font-bold tracking-[0.08em] text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-bold text-ink">{s.label}</span>
                <span className="text-xs text-muted">{s.blurb}</span>
              </button>
            ))}
          </div>
        </div>

        {sectionOptions.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] font-bold tracking-[0.1em] text-muted uppercase">
              Sections
            </p>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter by section"
            >
              <button
                type="button"
                onClick={() => setSection(null)}
                aria-pressed={section === null}
                data-on={section === null ? "true" : "false"}
                className="learn-fun-skill !rounded-full !px-3.5 !py-2 text-sm font-bold"
              >
                All sections
              </button>
              {sectionOptions.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setSection((cur) => (cur === label ? null : label))
                  }
                  aria-pressed={section === label}
                  data-on={section === label ? "true" : "false"}
                  className="learn-fun-skill !rounded-full !px-3.5 !py-2 text-sm font-bold"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="learn-fun-shell text-center">
          <p className="text-lg font-bold text-ink">Nothing in this lane yet</p>
          <p className="mt-2 text-sm text-muted">
            {scope === "mine"
              ? "Share a challenge from Practice and it’ll land here."
              : "Try another filter, or build one in Practice."}
          </p>
          <Link href="/practice" className="learn-fun-cta mt-5 inline-flex">
            Open practice
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4">
          {filtered.map((row) => (
            <li key={row.card.id} className="min-w-0">
              <ToolCardView
                card={row.card}
                rating="upvote"
                funStyle
                myVote={row.myVote}
                saved={row.saved}
                clarifications={row.clarifications}
                canClarify={row.canClarify}
                canEditCode={row.canEdit}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
