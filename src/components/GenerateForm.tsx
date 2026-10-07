"use client";

import { useState, useTransition } from "react";
import { generateCaption } from "@/app/actions/generate";
import { VIBE_MAX_CHARS } from "@/lib/prompts";
import type { Spot } from "@/lib/supabase/types";

type Props = {
  spots: Spot[];
};

export function GenerateForm({ spots }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [vibe, setVibe] = useState("");

  return (
    <form
      className="flex flex-col gap-5"
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await generateCaption(formData);
          if (result?.error) {
            setError(result.error);
          }
        });
      }}
    >
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Spot</span>
        <select
          name="spotId"
          required
          defaultValue=""
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        >
          <option value="" disabled>
            Pick a spot (NYC or Boston)
          </option>
          {spots.map((spot) => (
            <option key={spot.id} value={spot.id}>
              {spot.name} — {spot.neighborhood}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="flex items-center justify-between gap-3 font-medium text-zinc-700 dark:text-zinc-300">
          <span>What just happened? (optional)</span>
          <span className="font-normal text-zinc-500 tabular-nums dark:text-zinc-400">
            {vibe.length}/{VIBE_MAX_CHARS}
          </span>
        </span>
        <textarea
          name="vibe"
          rows={2}
          maxLength={VIBE_MAX_CHARS}
          value={vibe}
          onChange={(event) => setVibe(event.target.value.slice(0, VIBE_MAX_CHARS))}
          placeholder="e.g. order wrong + I said thank you anyway"
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {pending ? "Generating…" : "Generate caption"}
      </button>
    </form>
  );
}
