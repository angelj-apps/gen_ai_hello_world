"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { askCardClarification } from "@/app/actions/clarify-tool";
import type { ClarificationKind } from "@/lib/supabase/types";

type Props = {
  toolCardId: string;
};

export function CardClarifyForm({ toolCardId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");

  function submit(kind: ClarificationKind, custom?: string) {
    setError(null);
    startTransition(async () => {
      const result = await askCardClarification(
        toolCardId,
        kind,
        kind === "custom" ? custom : undefined,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      if (kind === "custom") setQuestion("");
      router.refresh();
    });
  }

  return (
    <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Still confused?
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Ask a follow-up — new notes stack below; the card above stays as-is.
      </p>

      <label className="mt-3 flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">
          What&apos;s still unclear?
        </span>
        <textarea
          rows={2}
          value={question}
          disabled={pending}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. what does hiding the built-in mean?"
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none ring-zinc-400 focus:ring-2 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || !question.trim()}
          onClick={() => submit("custom", question)}
          className="rounded-xl bg-zinc-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950"
        >
          {pending ? "Thinking…" : "Ask"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("simpler")}
          className="rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-800 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200"
        >
          Say it simpler
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("example")}
          className="rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-800 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200"
        >
          Another example
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
