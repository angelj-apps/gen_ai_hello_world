"use client";

import { useState, useTransition } from "react";
import {
  createPracticeSession,
  submitPracticeAnswer,
} from "@/app/actions/practice";

type Session = {
  attemptId: string;
  prompt: string;
  hint: string;
  sampleSolution: string;
  explanation: string;
  tools: { id: string; title: string; code: string; what_it_does: string }[];
};

export function PracticeClient() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showToolCode, setShowToolCode] = useState(false);

  function start() {
    setError(null);
    setRevealed(false);
    setShowHint(false);
    setShowToolCode(false);
    setAnswer("");
    startTransition(async () => {
      const result = await createPracticeSession();
      if (result.error || !result.data) {
        setError(result.error ?? "Could not start practice.");
        setSession(null);
        return;
      }
      setSession(result.data);
    });
  }

  function submit() {
    if (!session) return;
    setError(null);
    startTransition(async () => {
      const result = await submitPracticeAnswer(session.attemptId, answer);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRevealed(true);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        disabled={pending}
        onClick={start}
        className="inline-flex w-fit items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {pending && !session
          ? "Building practice…"
          : session
            ? "New practice task"
            : "Start practice"}
      </button>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {session ? (
        <div className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Tools for this task (roles first)
            </p>
            <ul className="mt-2 grid gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              {session.tools.map((t) => (
                <li
                  key={t.id}
                  className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700"
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {t.title}
                  </p>
                  <p className="mt-0.5">{t.what_it_does}</p>
                  {showToolCode ? (
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs text-zinc-100">
                      {t.code}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setShowToolCode((v) => !v)}
              className="mt-2 text-sm text-zinc-500 underline underline-offset-2"
            >
              {showToolCode
                ? "Hide tool syntax"
                : "I need the tool syntax"}
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Your task
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
              {session.prompt}
            </p>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Your attempt
            </span>
            <textarea
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write a few lines of Python or describe your approach…"
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-950 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              {showHint ? "Hide hint" : "Show hint"}
            </button>
            <button
              type="button"
              disabled={pending || !answer.trim()}
              onClick={submit}
              className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950"
            >
              {pending ? "Saving…" : "I need the sample solution"}
            </button>
          </div>

          {showHint ? (
            <p className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {session.hint}
            </p>
          ) : null}

          {revealed ? (
            <div className="grid gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Sample solution
                </p>
                <pre className="mt-2 overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-sm text-zinc-100">
                  {session.sampleSolution}
                </pre>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {session.explanation}
              </p>
              <p className="text-xs text-zinc-500">
                AI-generated practice — review before trusting.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
