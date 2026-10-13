"use client";

import { useState, useTransition } from "react";
import { generateToolCard } from "@/app/actions/generate-tool";
import type { Concept } from "@/lib/concepts";

type Step = "horizon" | "attempt" | "revealing";

type Props = {
  horizon: Concept[];
  learnedCount: number;
};

export function AttemptFirstLearn({ horizon, learnedCount }: Props) {
  const [step, setStep] = useState<Step>("horizon");
  const [selected, setSelected] = useState<Concept | null>(null);
  const [howQuestion, setHowQuestion] = useState("");
  const [attempt, setAttempt] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pickConcept(concept: Concept) {
    setSelected(concept);
    setHowQuestion(concept.howPrompt);
    setAttempt("");
    setError(null);
    setStep("attempt");
  }

  function useCustomHow() {
    const q = howQuestion.trim();
    if (!q) {
      setError("Write your How do I …? question first.");
      return;
    }
    const normalized = q.toLowerCase().startsWith("how do i")
      ? q
      : `How do I ${q.replace(/\?$/, "")}?`;
    setHowQuestion(normalized);
    setSelected(null);
    setAttempt("");
    setError(null);
    setStep("attempt");
  }

  function needSyntax() {
    setError(null);
    setStep("revealing");
    startTransition(async () => {
      const formData = new FormData();
      if (selected) formData.set("conceptId", selected.id);
      formData.set("howQuestion", howQuestion.trim());
      formData.set("attempt", attempt);
      const result = await generateToolCard(formData);
      if (result?.error) {
        setError(result.error);
        setStep("attempt");
      }
    });
  }

  if (horizon.length === 0 && step === "horizon") {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 px-5 py-8 text-center dark:border-zinc-700">
        <p className="text-zinc-700 dark:text-zinc-300">
          You’ve worked through this beginner neighborhood. Keep practicing from
          your library, or explore community cards.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Learned {learnedCount} concepts so far.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {step === "horizon" ? (
        <>
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Things you can learn to do in Python
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              A small related set — pick one to own as your question. No code
              yet.
              {learnedCount > 0 ? (
                <span className="text-zinc-500">
                  {" "}
                  · {learnedCount} learned
                </span>
              ) : null}
            </p>
          </div>

          <ul className="grid gap-2">
            {horizon.map((concept) => (
              <li key={concept.id}>
                <button
                  type="button"
                  onClick={() => pickConcept(concept)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
                >
                  {concept.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Or write your own: How do I …?
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={howQuestion}
                onChange={(e) => setHowQuestion(e.target.value)}
                placeholder="count how many names are in a list"
                className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
              <button
                type="button"
                onClick={useCustomHow}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
              >
                Use this question
              </button>
            </div>
          </div>
        </>
      ) : null}

      {step === "attempt" || step === "revealing" ? (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setStep("horizon");
              setSelected(null);
              setError(null);
            }}
            className="w-fit text-sm text-zinc-500 underline underline-offset-2 disabled:opacity-50"
          >
            ← Back to choices
          </button>

          <div>
            <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Your question
            </p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              {howQuestion}
            </h2>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Attempt first (optional)
            </span>
            <textarea
              rows={4}
              value={attempt}
              disabled={pending}
              onChange={(e) => setAttempt(e.target.value)}
              placeholder="Guess the Python, or leave blank if you don’t know yet…"
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-950 outline-none ring-zinc-400 focus:ring-2 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Stay with your attempt as long as you want. Open syntax only when
            you don’t know or don’t remember it.
          </p>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}

          <button
            type="button"
            disabled={pending}
            onClick={needSyntax}
            className="inline-flex w-fit items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {pending
              ? "Opening syntax…"
              : "I don’t know / don’t remember — show syntax"}
          </button>
        </>
      ) : null}
    </div>
  );
}
