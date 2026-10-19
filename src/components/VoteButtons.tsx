"use client";

import { useState, useTransition } from "react";
import { submitToolVote } from "@/app/actions/vote";

type Props = {
  toolCardId: string;
  score: number;
  myVote: number | null;
};

/** Community upvote on Explore — separate from personal mastery stars. */
export function VoteButtons({ toolCardId, score, myVote }: Props) {
  const [pending, startTransition] = useTransition();
  const [localScore, setLocalScore] = useState(score);
  const [localVote, setLocalVote] = useState(myVote);
  const [error, setError] = useState<string | null>(null);

  function vote(value: 1 | -1) {
    const prevVote = localVote;
    const prevScore = localScore;
    const nextVote = prevVote === value ? null : value;
    let nextScore = prevScore;
    if (prevVote === value) nextScore -= value;
    else if (prevVote == null) nextScore += value;
    else nextScore += value - prevVote;

    setLocalVote(nextVote);
    setLocalScore(nextScore);
    setError(null);

    startTransition(async () => {
      const result = await submitToolVote(toolCardId, value);
      if (result.error) {
        setLocalVote(prevVote);
        setLocalScore(prevScore);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => vote(1)}
          aria-pressed={localVote === 1}
          aria-label="Upvote — this challenge helped"
          className={`rounded-md px-2 py-1 text-sm font-bold transition ${
            localVote === 1
              ? "bg-accent-soft text-accent"
              : "text-muted hover:bg-surface-raised hover:text-ink"
          }`}
        >
          ▲
        </button>
        <span
          className="min-w-[1.5rem] text-center font-mono text-sm font-bold text-ink tabular-nums"
          title="Helpfulness score"
        >
          {localScore}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => vote(-1)}
          aria-pressed={localVote === -1}
          aria-label="Downvote — this challenge was confusing"
          className={`rounded-md px-2 py-1 text-sm font-bold transition ${
            localVote === -1
              ? "bg-red-50 text-danger"
              : "text-muted hover:bg-surface-raised hover:text-ink"
          }`}
        >
          ▼
        </button>
      </div>
      {error ? (
        <p className="max-w-[10rem] text-right text-[11px] text-danger">{error}</p>
      ) : null}
    </div>
  );
}
