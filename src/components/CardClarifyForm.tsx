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
    <div className="border-t border-line pt-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="sr-only">Follow-up question</span>
        <textarea
          rows={2}
          value={question}
          disabled={pending}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a follow-up…"
          className="border border-line bg-surface px-3 py-2 text-sm text-ink outline-none ring-accent focus:ring-2 disabled:opacity-60"
        />
      </label>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || !question.trim()}
          onClick={() => submit("custom", question)}
          className="bg-ink px-3 py-1.5 text-xs font-medium text-surface-raised transition hover:bg-accent disabled:opacity-50"
        >
          {pending ? "…" : "Ask"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("simpler")}
          className="border border-line bg-surface px-3 py-1.5 text-xs text-ink transition hover:border-accent disabled:opacity-50"
        >
          Simpler
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("example")}
          className="border border-line bg-surface px-3 py-1.5 text-xs text-ink transition hover:border-accent disabled:opacity-50"
        >
          Example
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
