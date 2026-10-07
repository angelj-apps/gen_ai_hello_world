"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitVote } from "@/app/actions/vote";

type Props = {
  generationId: string;
  score: number;
  myVote: number | null;
};

export function VoteButtons({ generationId, score, myVote }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function vote(value: 1 | -1) {
    setError(null);
    startTransition(async () => {
      const result = await submitVote(generationId, value);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => vote(1)}
          aria-label="Upvote"
          className={`rounded-lg border px-2.5 py-1 text-sm transition disabled:opacity-50 ${
            myVote === 1
              ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          }`}
        >
          ▲
        </button>
        <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
          {score}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => vote(-1)}
          aria-label="Downvote"
          className={`rounded-lg border px-2.5 py-1 text-sm transition disabled:opacity-50 ${
            myVote === -1
              ? "border-rose-500 bg-rose-50 text-rose-800 dark:border-rose-400 dark:bg-rose-950 dark:text-rose-200"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          }`}
        >
          ▼
        </button>
      </div>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
