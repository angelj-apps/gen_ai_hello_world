"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { generateToolCard } from "@/app/actions/generate-tool";
import { MiniPythonTerminal } from "@/components/MiniPythonTerminal";
import type { Concept } from "@/lib/concepts";
import {
  discoveryAttempted,
  getDiscoveryExercise,
  type DiscoveryExercise,
} from "@/lib/discovery-exercises";

type Step = "horizon" | "discovery" | "attempt" | "revealing";

type Props = {
  horizon: Concept[];
  learnedCount: number;
  /** Auto-start this skill (e.g. from Next skill CTA). */
  startConceptId?: string | null;
};

function StepDots({ active }: { active: "pick" | "try" | "learn" }) {
  const steps = [
    { id: "pick" as const, label: "Pick" },
    { id: "try" as const, label: "Try" },
    { id: "learn" as const, label: "Learn" },
  ];
  const activeIdx = steps.findIndex((s) => s.id === active);

  return (
    <ol className="flex flex-wrap items-center gap-2">
      {steps.map((step, i) => {
        const done = i < activeIdx;
        const current = i === activeIdx;
        return (
          <li key={step.id} className="flex items-center gap-2">
            {i > 0 ? (
              <span
                className={`h-1 w-5 rounded-full ${
                  done || current ? "bg-accent" : "bg-line"
                }`}
                aria-hidden
              />
            ) : null}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.08em] uppercase ${
                current
                  ? "bg-accent text-surface-raised"
                  : done
                    ? "bg-accent-soft text-accent"
                    : "bg-surface text-muted"
              }`}
            >
              <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                  current
                    ? "bg-surface-raised/20"
                    : done
                      ? "bg-accent text-surface-raised"
                      : "bg-line text-muted"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function AttemptFirstLearn({
  horizon,
  learnedCount,
  startConceptId = null,
}: Props) {
  const [step, setStep] = useState<Step>("horizon");
  const [selected, setSelected] = useState<Concept | null>(null);
  const [discovery, setDiscovery] = useState<DiscoveryExercise | null>(null);
  const [howQuestion, setHowQuestion] = useState("");
  const [attempt, setAttempt] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const progressPct = Math.min(100, Math.round((learnedCount / 12) * 100));

  function resetToHorizon() {
    setStep("horizon");
    setSelected(null);
    setDiscovery(null);
    setAttempt("");
    setError(null);
  }

  function pickConcept(concept: Concept) {
    const exercise = getDiscoveryExercise(concept.id);
    setSelected(concept);
    setHowQuestion(concept.howPrompt);
    setError(null);
    if (exercise) {
      setDiscovery(exercise);
      setAttempt(exercise.starterCode);
      setStep("discovery");
      return;
    }
    setDiscovery(null);
    setAttempt("");
    setStep("attempt");
  }

  useEffect(() => {
    if (!startConceptId) return;
    const concept = horizon.find((c) => c.id === startConceptId);
    if (concept) pickConcept(concept);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- kick off once per start id
  }, [startConceptId]);

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
    setDiscovery(null);
    setAttempt("");
    setError(null);
    setStep("attempt");
  }

  function continueFromDiscovery() {
    if (!discovery) return;
    if (!discoveryAttempted(discovery.starterCode, attempt)) {
      setError(
        discovery.starterCode.trim()
          ? "Try changing the starter code to solve the discovery question first."
          : "Write a short attempt at the discovery question first.",
      );
      return;
    }
    setError(null);
    revealSyntax();
  }

  function revealSyntax() {
    setError(null);
    setStep("revealing");
    startTransition(async () => {
      const formData = new FormData();
      if (selected) formData.set("conceptId", selected.id);
      formData.set("howQuestion", howQuestion.trim());
      formData.set("attempt", attempt);
      if (discovery) formData.set("discoveryPrompt", discovery.prompt);
      const result = await generateToolCard(formData);
      if (result?.error) {
        setError(result.error);
        setStep(discovery ? "discovery" : "attempt");
      }
    });
  }

  if (horizon.length === 0 && step === "horizon") {
    return (
      <div className="learn-fun-shell text-center">
        <p className="text-2xl font-bold tracking-tight text-ink">
          You cleared this stretch!
        </p>
        <p className="mt-2 text-muted">
          Nice work — {learnedCount} skill
          {learnedCount === 1 ? "" : "s"} in your toolkit. Keep the streak going.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/practice" className="learn-fun-cta">
            Practice now
          </Link>
          <Link
            href="/toolkit"
            className="inline-flex items-center justify-center rounded-[14px] border-2 border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink"
          >
            Open toolkit
          </Link>
        </div>
      </div>
    );
  }

  const discoveryReady =
    discovery != null && discoveryAttempted(discovery.starterCode, attempt);

  const activeStep =
    step === "horizon" ? "pick" : step === "revealing" ? "learn" : "try";

  return (
    <div className="learn-fun-shell flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <StepDots active={activeStep} />
          <p className="font-mono text-[11px] font-semibold tracking-[0.1em] text-accent uppercase">
            {learnedCount} XP · skills earned
          </p>
        </div>
        <div
          className="learn-fun-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          aria-label="Learning progress"
        >
          <span style={{ width: `${Math.max(progressPct, learnedCount > 0 ? 8 : 0)}%` }} />
        </div>
      </div>

      {step === "horizon" ? (
        <>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              What do you want to unlock?
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              Tap a skill, try it yourself, then unlock the syntax — little wins
              stack fast.
            </p>
          </div>

          <ul className="grid gap-2.5">
            {horizon.map((concept, i) => (
              <li key={concept.id}>
                <button
                  type="button"
                  onClick={() => pickConcept(concept)}
                  className="learn-fun-skill flex w-full items-start gap-3"
                >
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-bold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold leading-snug text-ink">
                      {concept.label}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] text-muted">
                      {concept.hintSyntax}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 rounded-[14px] border-2 border-dashed border-line bg-surface/80 px-4 py-4">
            <label className="text-sm font-bold text-ink">
              Or invent your own quest
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={howQuestion}
                onChange={(e) => setHowQuestion(e.target.value)}
                placeholder="How do I count names in a list?"
                className="min-w-0 flex-1 rounded-xl border-2 border-line bg-surface-raised px-3 py-2.5 text-sm text-ink outline-none ring-accent focus:border-accent focus:ring-2"
              />
              <button
                type="button"
                onClick={useCustomHow}
                className="rounded-xl border-2 border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink transition hover:border-accent hover:text-accent"
              >
                Start
              </button>
            </div>
            {error && step === "horizon" ? (
              <p className="text-sm font-medium text-danger">{error}</p>
            ) : null}
          </div>
        </>
      ) : null}

      {(step === "discovery" || (step === "revealing" && discovery)) &&
      discovery ? (
        <div className="studio-fade-up flex flex-col gap-5">
          <button
            type="button"
            disabled={pending}
            onClick={resetToHorizon}
            className="w-fit text-sm font-semibold text-muted underline underline-offset-2 transition hover:text-accent disabled:opacity-50"
          >
            ← Back to skills
          </button>

          <div>
            <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-accent uppercase">
              Challenge
              {selected ? ` · ${selected.label}` : ""}
            </p>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-ink">
              {discovery.prompt}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Give it a real try — the syntax unlocks after you attempt.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-ink">Your attempt</span>
            <MiniPythonTerminal
              value={attempt}
              onChange={setAttempt}
              disabled={pending}
              placeholder="# Write your discovery attempt…"
            />
          </div>

          {error ? (
            <p className="text-sm font-medium text-danger">{error}</p>
          ) : null}

          <button
            type="button"
            disabled={pending || !discoveryReady}
            onClick={continueFromDiscovery}
            className="learn-fun-cta w-fit"
          >
            {pending ? "Unlocking…" : "I tried — unlock syntax"}
          </button>
          {!discoveryReady && !pending ? (
            <p className="text-sm text-muted">
              Tweak the code to answer the challenge, then hit unlock.
            </p>
          ) : null}
        </div>
      ) : null}

      {step === "attempt" || (step === "revealing" && !discovery) ? (
        <div className="studio-fade-up flex flex-col gap-5">
          <button
            type="button"
            disabled={pending}
            onClick={resetToHorizon}
            className="w-fit text-sm font-semibold text-muted underline underline-offset-2 transition hover:text-accent disabled:opacity-50"
          >
            ← Back to skills
          </button>

          <div>
            <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-accent uppercase">
              Your quest
            </p>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-ink">
              {howQuestion}
            </h2>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-ink">
              Attempt first (optional)
            </span>
            <MiniPythonTerminal
              value={attempt}
              onChange={setAttempt}
              disabled={pending}
              placeholder="# Guess the Python, or leave blank…"
            />
          </div>

          <p className="text-sm text-muted">
            Custom quests can skip discovery. Unlock when you&apos;re ready.
          </p>

          {error ? (
            <p className="text-sm font-medium text-danger">{error}</p>
          ) : null}

          <button
            type="button"
            disabled={pending}
            onClick={revealSyntax}
            className="learn-fun-cta w-fit"
          >
            {pending ? "Unlocking…" : "Show me the syntax"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
