"use client";

import { useEffect, useState } from "react";
import { ToolCardView } from "@/components/ToolCardView";
import type { ToolCard, ToolCardClarification } from "@/lib/supabase/types";

export type ToolkitTile = {
  /** Stable key for the grid (concept id or saved:cardId). */
  id: string;
  /** Curriculum concept id when this tile is a learned skill. */
  conceptId?: string;
  label: string;
  subtitle: string;
  card: ToolCard | null;
  myVote: number | null;
  saved: boolean;
  clarifications: ToolCardClarification[];
  canClarify: boolean;
  canEditCode: boolean;
};

type Props = {
  tiles: ToolkitTile[];
};

export function ToolkitGrid({ tiles }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = tiles.find((t) => t.id === openId) ?? null;

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash.startsWith("skill-")) return;
    const conceptId = hash.slice("skill-".length);
    const match = tiles.find(
      (t) => t.conceptId === conceptId || t.id === `skill:${conceptId}`,
    );
    if (match) setOpenId(match.id);
  }, [tiles]);

  return (
    <div className="grid gap-8 min-[900px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col gap-3">
        <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-accent uppercase">
          Skills
        </p>
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {tiles.map((tile) => {
            const selected = openId === tile.id;
            const anchor =
              tile.conceptId != null ? `skill-${tile.conceptId}` : undefined;
            return (
              <li key={tile.id} id={anchor}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenId((id) => (id === tile.id ? null : tile.id))
                  }
                  className={`skill-option flex h-full w-full flex-col items-start gap-1 border px-3 py-2.5 text-left transition ${
                    selected
                      ? "border-accent bg-accent-soft text-ink"
                      : "border-line bg-surface text-ink hover:border-accent"
                  }`}
                >
                  <span className="text-sm font-semibold leading-snug">
                    {tile.label}
                  </span>
                  <span className="font-mono text-[11px] text-muted">
                    {tile.subtitle}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="min-w-0">
        {open?.card ? (
          <div className="studio-fade-up flex flex-col gap-3">
            <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-accent uppercase">
              Tool sheet
            </p>
            <ToolCardView
              card={open.card}
              myVote={open.myVote}
              saved={open.saved}
              syntaxCollapsed={false}
              clarifications={open.clarifications}
              canClarify={open.canClarify}
              canEditCode={open.canEditCode}
            />
          </div>
        ) : open ? (
          <p className="text-sm text-muted">
            Skill unlocked — no linked card yet. Learn again from the home page
            to attach one.
          </p>
        ) : (
          <p className="text-sm text-muted">
            Select a skill to open its tool sheet beside the shelf.
          </p>
        )}
      </div>
    </div>
  );
}
