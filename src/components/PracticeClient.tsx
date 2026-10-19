"use client";

import { useRef, useState, useTransition } from "react";
import {
  createPracticeFromSkills,
  sharePracticeToExplore,
  submitPracticeAnswer,
} from "@/app/actions/practice";
import {
  MiniPythonTerminal,
  type MiniPythonTerminalHandle,
} from "@/components/MiniPythonTerminal";

export type PracticeSkillOption = {
  conceptId: string;
  label: string;
  skillPoints: number;
};

type Session = {
  attemptId: string;
  prompt: string;
  hint: string;
  sampleSolution: string;
  explanation: string;
  conceptIds: string[];
  skills: { id: string; title: string; what_it_does: string; code: string }[];
};

type Props = {
  skills: PracticeSkillOption[];
};

function briefPracticeHint(session: Session): {
  text: string;
  syntax: string[];
} {
  const raw = session.hint.trim();
  const first =
    raw.split(/(?<=[.!?])\s+/).find((part) => part.trim())?.trim() || raw;
  const text =
    first.length > 140 ? `${first.slice(0, 137).trimEnd()}…` : first;
  const syntax = session.skills
    .filter((t) => t.code.trim())
    .map((t) => {
      const line = t.code
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l && !l.startsWith("#"));
      return line ? `${t.title}: ${line}` : "";
    })
    .filter(Boolean)
    .slice(0, 3);
  return { text, syntax };
}

export function PracticeClient({ skills }: Props) {
  const terminalRef = useRef<MiniPythonTerminalHandle>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [grade, setGrade] = useState<{
    outcome: string;
    feedback: string;
    pointsAwarded: number;
  } | null>(null);
  const [sharedCardId, setSharedCardId] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const pickPct = Math.min(100, Math.round((selected.length / 4) * 100));
  const correct = grade?.outcome === "correct";

  function toggleSkill(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id].slice(0, 4),
    );
  }

  function backToPick() {
    setSession(null);
    setGrade(null);
    setShowHint(false);
    setAnswer("");
    setError(null);
    setSharedCardId(null);
    setShareNote(null);
  }

  function start() {
    setError(null);
    setGrade(null);
    setShowHint(false);
    setAnswer("");
    setSharedCardId(null);
    setShareNote(null);
    startTransition(async () => {
      const result = await createPracticeFromSkills(selected);
      if (result.error || !result.data) {
        setError(result.error ?? "Could not start practice.");
        setSession(null);
        return;
      }
      setSession(result.data);
    });
  }

  function shareChallenge() {
    if (!session || !grade || sharing || sharedCardId) return;
    setError(null);
    setShareNote(null);
    setSharing(true);
    startTransition(async () => {
      const result = await sharePracticeToExplore(session.attemptId);
      setSharing(false);
      if (result.error || !result.cardId) {
        setError(result.error ?? "Could not share to Explore.");
        return;
      }
      setSharedCardId(result.cardId);
      setShareNote("Saved to your toolkit and published on Explore.");
      try {
        const url = `${window.location.origin}/?card=${encodeURIComponent(result.cardId)}`;
        await navigator.clipboard.writeText(url);
        setShareNote("Saved · published on Explore · link copied");
      } catch {
        // Clipboard may be blocked; publish still succeeded.
      }
    });
  }

  function checkAnswer() {
    if (!session) return;
    setError(null);
    startTransition(async () => {
      let code = answer;
      let runOutput = "";
      let runError: string | null = null;

      try {
        const ran = await terminalRef.current?.runForGrade();
        if (ran) {
          code = ran.code;
          runOutput = ran.output;
          runError = ran.error;
          setAnswer(ran.code);
        }
      } catch (err) {
        runError = err instanceof Error ? err.message : "Could not run code.";
      }

      if (!code.trim()) {
        setError("Write some Python in the terminal first.");
        return;
      }

      const result = await submitPracticeAnswer(
        session.attemptId,
        code,
        session.conceptIds,
        runOutput,
        runError,
      );
      if (result.error || !result.grade) {
        setError(result.error ?? "Could not grade attempt.");
        return;
      }
      setGrade(result.grade);
    });
  }

  if (!session) {
    return (
      <div className="learn-fun-shell flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="font-mono text-[11px] font-semibold tracking-[0.1em] text-accent uppercase">
              Pick · up to 4 skills
            </p>
            <p className="font-mono text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">
              {selected.length}/4 chosen
            </p>
          </div>
          <div
            className="learn-fun-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={selected.length}
            aria-label="Skills selected for practice"
          >
            <span
              style={{
                width: `${Math.max(pickPct, selected.length > 0 ? 8 : 0)}%`,
              }}
            />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            What do you want to practice?
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">
            Tap skills from your toolkit, then start a short challenge — earn a
            skillpoint when you get it right.
          </p>
        </div>

        <ul className="grid gap-2.5 sm:grid-cols-2">
          {skills.map((skill, i) => {
            const on = selected.includes(skill.conceptId);
            return (
              <li key={skill.conceptId}>
                <button
                  type="button"
                  onClick={() => toggleSkill(skill.conceptId)}
                  aria-pressed={on}
                  data-on={on ? "true" : "false"}
                  className="learn-fun-skill flex w-full items-start gap-3"
                >
                  <span
                    className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                      on
                        ? "bg-accent text-surface-raised"
                        : "bg-accent-soft text-accent"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold leading-snug text-ink">
                      {skill.label}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] text-muted tabular-nums">
                      {skill.skillPoints} pts
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {error ? (
          <p className="text-sm font-medium text-danger">{error}</p>
        ) : null}

        <button
          type="button"
          disabled={pending || selected.length === 0}
          onClick={start}
          className="learn-fun-cta w-fit"
        >
          {pending ? "Building challenge…" : "Start challenge"}
        </button>
      </div>
    );
  }

  const hint = briefPracticeHint(session);

  return (
    <div className="learn-fun-shell flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={backToPick}
            className="text-sm font-semibold text-muted underline underline-offset-2 transition hover:text-accent disabled:opacity-50"
          >
            ← Change skills
          </button>
          <p className="font-mono text-[11px] font-semibold tracking-[0.1em] text-accent uppercase">
            {grade
              ? correct
                ? "Cleared"
                : "Try again"
              : `Solve · ${session.skills.length} skill${session.skills.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div
          className="learn-fun-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={grade ? (correct ? 100 : 55) : 40}
          aria-label="Practice challenge progress"
        >
          <span style={{ width: grade ? (correct ? "100%" : "55%") : "40%" }} />
        </div>
      </div>

      <div className="studio-fade-up flex flex-col gap-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Your challenge
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {session.skills.map((t) => (
              <li
                key={t.id}
                className="rounded-full border-2 border-line bg-surface px-3 py-1 text-xs font-bold text-ink"
              >
                {t.title}
              </li>
            ))}
          </ul>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-muted">
            {session.prompt}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-ink">Your attempt</span>
          <MiniPythonTerminal
            ref={terminalRef}
            value={answer}
            onChange={setAnswer}
            placeholder="Write Python, Run it, then Check…"
          />
        </div>

        <div className="lt-practice-actions flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="rounded-[14px] border-2 border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink transition hover:border-accent hover:text-accent"
          >
            {showHint ? "Hide hint" : "Show hint"}
          </button>
          <button
            type="button"
            disabled={pending || !answer.trim()}
            onClick={checkAnswer}
            className="learn-fun-cta"
          >
            {pending ? "Checking…" : "Check answer"}
          </button>
          <button
            type="button"
            disabled={!grade || sharing || Boolean(sharedCardId)}
            onClick={shareChallenge}
            className="lt-share-btn ml-auto"
            title={!grade ? "Check your answer before sharing" : undefined}
          >
            <svg
              className="lt-share-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M3.4 11.2 20.1 3.6c.7-.3 1.4.4 1.1 1.1l-7.6 16.7c-.3.7-1.3.6-1.5-.2l-1.7-6.3-6.3-1.7c-.8-.2-.9-1.2-.2-1.5Z" />
            </svg>
            <span>
              {sharedCardId
                ? "Shared on Explore"
                : sharing
                  ? "Sharing…"
                  : !grade
                    ? "Check first"
                    : "Share to Explore"}
            </span>
          </button>
        </div>
        {shareNote ? (
          <p className="text-right text-sm font-medium text-accent">{shareNote}</p>
        ) : null}

        {showHint ? (
          <div className="rounded-[14px] border-2 border-line bg-surface px-4 py-3">
            <p className="text-sm text-muted">{hint.text}</p>
            {hint.syntax.length > 0 ? (
              <ul className="mt-2 grid gap-1">
                {hint.syntax.map((line) => (
                  <li
                    key={line}
                    className="font-mono text-[12px] font-medium text-ink"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p className="text-sm font-medium text-danger">{error}</p>
        ) : null}

        {grade ? (
          <div
            className={`grid gap-3 rounded-[14px] border-2 px-4 py-4 ${
              correct
                ? "border-accent bg-accent-soft"
                : "border-line bg-surface"
            }`}
          >
            <p className="text-lg font-bold tracking-tight text-ink">
              {correct ? "Nice — you got it!" : "Not quite yet"}
              {correct && grade.pointsAwarded > 0
                ? ` · +${grade.pointsAwarded} skillpoint${grade.pointsAwarded === 1 ? "" : "s"}`
                : ""}
            </p>
            <p className="text-sm text-muted">{grade.feedback}</p>
            <div>
              <p className="text-sm font-bold text-ink">Sample solution</p>
              <pre className="mt-2 overflow-x-auto rounded-[12px] border-2 border-line bg-code-bg p-4 font-mono text-sm text-code-ink">
                {session.sampleSolution}
              </pre>
            </div>
            <p className="text-sm text-muted">{session.explanation}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                disabled={pending}
                onClick={start}
                className="learn-fun-cta"
              >
                {pending ? "Building…" : "Another challenge"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={backToPick}
                className="rounded-[14px] border-2 border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink transition hover:border-accent hover:text-accent"
              >
                Pick different skills
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
