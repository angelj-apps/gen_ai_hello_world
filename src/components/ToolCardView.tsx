"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { updateToolCardFields } from "@/app/actions/update-tool-card";
import { EditableToolCode } from "@/components/EditableToolCode";
import type { ToolCard, ToolCardClarification } from "@/lib/supabase/types";
import { CardClarifyForm } from "@/components/CardClarifyForm";
import { ClarificationBlock } from "@/components/ClarificationBlock";
import { MasteryStars } from "@/components/MasteryStars";
import { VoteButtons } from "@/components/VoteButtons";
import { SaveButton } from "@/components/SaveButton";
import { EXPLORE_META_TAGS } from "@/lib/concepts";

export type NextSkillLink = {
  id: string;
  label: string;
};

type Props = {
  card: ToolCard;
  myVote?: number | null;
  saved?: boolean;
  showActions?: boolean;
  /**
   * mastery = personal progress stars (Learn / Toolkit).
   * upvote = community helpfulness on Explore.
   */
  rating?: "mastery" | "upvote";
  /** When true, code and deep detail stay hidden until the learner asks. */
  syntaxCollapsed?: boolean;
  clarifications?: ToolCardClarification[];
  canClarify?: boolean;
  canEditCode?: boolean;
  /** Learn-page quest chrome (matches AttemptFirstLearn fun shell). */
  funStyle?: boolean;
  /** Show Learn “up next / practice” footer (off on Explore). */
  showQuestFooter?: boolean;
  /** Suggested next unlearned skill that follows this one. */
  nextSkill?: NextSkillLink | null;
};

const SAVE_DELAY_MS = 650;

const fieldClass =
  "w-full rounded-lg border-2 border-transparent bg-transparent px-0 py-0 outline-none transition focus:border-accent focus:bg-surface focus:px-2 focus:py-1.5";

function exampleTextFromCard(card: ToolCard) {
  const input = (card.example_input ?? "").trim();
  const output = (card.example_output ?? "").trim();
  return input || output;
}

function normalizeDraft(draft: {
  title: string;
  what_it_does: string;
  explanation: string;
  example_input: string;
}) {
  return {
    title: draft.title.replace(/\s+/g, " ").trim(),
    what_it_does: draft.what_it_does.trim(),
    explanation: draft.explanation.trim(),
    example_input: draft.example_input.trim(),
  };
}

export function ToolCardView({
  card,
  myVote = null,
  saved = false,
  showActions = true,
  rating = "mastery",
  syntaxCollapsed = false,
  clarifications = [],
  canClarify = false,
  canEditCode = false,
  funStyle = false,
  showQuestFooter = false,
  nextSkill = null,
}: Props) {
  const [showSyntax, setShowSyntax] = useState(!syntaxCollapsed);
  const [title, setTitle] = useState(card.title);
  const [promptText, setPromptText] = useState(card.what_it_does);
  const [explanation, setExplanation] = useState(card.explanation);
  const [exampleText, setExampleText] = useState(() =>
    exampleTextFromCard(card),
  );
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "pending" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSavedRef = useRef(
    normalizeDraft({
      title: card.title,
      what_it_does: card.what_it_does,
      explanation: card.explanation,
      example_input: exampleTextFromCard(card),
    }),
  );
  const draftRef = useRef({
    title,
    what_it_does: promptText,
    explanation,
    example_input: exampleText,
  });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const [, startTransition] = useTransition();

  draftRef.current = {
    title,
    what_it_does: promptText,
    explanation,
    example_input: exampleText,
  };

  const showClarifySection = showSyntax && canClarify;
  const sectionTags = (card.tags ?? []).filter(
    (t) => !EXPLORE_META_TAGS.has(t.toLowerCase()),
  );
  const isPractice = Boolean(card.tags?.includes("practice"));

  const shell = funStyle
    ? "learn-fun-shell overflow-hidden !p-0"
    : "border border-line bg-surface";

  function isDirtyDraft(
    draft: {
      title: string;
      what_it_does: string;
      explanation: string;
      example_input: string;
    } = draftRef.current,
  ) {
    const next = normalizeDraft(draft);
    const prev = lastSavedRef.current;
    return (
      next.title !== prev.title ||
      next.what_it_does !== prev.what_it_does ||
      next.explanation !== prev.explanation ||
      next.example_input !== prev.example_input
    );
  }

  function schedulePersist(immediate = false) {
    if (!canEditCode) return;
    if (!isDirtyDraft()) {
      setSaveStatus((s) => (s === "pending" ? "idle" : s));
      return;
    }

    setSaveStatus("pending");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    const run = () => {
      if (savingRef.current) {
        saveTimerRef.current = setTimeout(run, 100);
        return;
      }

      startTransition(async () => {
        savingRef.current = true;
        setSaveStatus("saving");
        setSaveError(null);

        try {
          // Write latest draft until clean. Never push server values back into
          // the inputs — that fights the caret while the user is typing.
          for (;;) {
            const live = draftRef.current;
            if (!isDirtyDraft(live)) break;

            const snapshot = {
              ...normalizeDraft(live),
              example_output: "",
            };
            const result = await updateToolCardFields(card.id, snapshot);
            if (result.error) {
              setSaveStatus("error");
              setSaveError(result.error);
              return;
            }

            const saved = result.card ?? {
              title: snapshot.title,
              what_it_does: snapshot.what_it_does,
              explanation: snapshot.explanation,
              example_input: snapshot.example_input,
              example_output: "",
            };
            lastSavedRef.current = {
              title: saved.title,
              what_it_does: saved.what_it_does,
              explanation: saved.explanation,
              example_input: saved.example_input || saved.example_output || "",
            };
          }

          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 1500);
        } finally {
          savingRef.current = false;
        }
      });
    };

    if (immediate) run();
    else saveTimerRef.current = setTimeout(run, SAVE_DELAY_MS);
  }

  useEffect(() => {
    if (!canEditCode) return;
    schedulePersist(false);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [canEditCode, card.id, title, promptText, explanation, exampleText]);

  useEffect(() => {
    if (!canEditCode) return;

    function flushIfNeeded() {
      if (!isDirtyDraft()) return;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      schedulePersist(true);
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") flushIfNeeded();
    }

    window.addEventListener("beforeunload", flushIfNeeded);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", flushIfNeeded);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [canEditCode, card.id]);

  const saveLabel =
    saveStatus === "pending"
      ? "Unsaved…"
      : saveStatus === "saving"
        ? "Saving…"
        : saveStatus === "saved"
          ? "Saved"
          : saveStatus === "error"
            ? saveError
            : canEditCode
              ? "Click a field to edit — saves automatically"
              : null;

  return (
    <article className={shell}>
      <div
        className={`group flex cursor-pointer flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between ${
          funStyle ? "sm:p-6" : ""
        }`}
        role="button"
        tabIndex={0}
        aria-expanded={showSyntax}
        onClick={() => setShowSyntax((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShowSyntax((v) => !v);
          }
        }}
      >
        <div className="min-w-0 flex-1">
          {isPractice ? (
            <p className="mb-1 font-mono text-[11px] font-semibold tracking-[0.1em] text-accent uppercase">
              Practice challenge
            </p>
          ) : null}
          {canEditCode ? (
            <textarea
              value={title}
              onChange={(e) =>
                setTitle(e.target.value.replace(/\n/g, " ").slice(0, 44))
              }
              onBlur={() => schedulePersist(true)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              aria-label="Title"
              rows={1}
              maxLength={44}
              className={`lt-title-field ${fieldClass} resize-none break-words text-balance ${
                funStyle
                  ? "text-2xl font-bold tracking-tight text-ink sm:text-3xl"
                  : "text-xl font-semibold tracking-tight text-ink"
              }`}
            />
          ) : (
            <h2
              className={
                funStyle
                  ? "text-2xl font-bold tracking-tight text-balance break-words text-ink sm:text-3xl"
                  : "text-xl font-semibold tracking-tight text-balance break-words text-ink"
              }
            >
              {title}
            </h2>
          )}
          {sectionTags.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {sectionTags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-line bg-surface-raised px-2.5 py-0.5 text-[11px] font-bold text-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {showActions ? (
          <div
            className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {rating === "upvote" ? (
              <VoteButtons
                toolCardId={card.id}
                score={card.score}
                myVote={myVote}
              />
            ) : (
              <MasteryStars toolCardId={card.id} />
            )}
            <SaveButton toolCardId={card.id} initiallySaved={saved} />
          </div>
        ) : null}
      </div>

      {showSyntax ? (
        <div
          className={
            funStyle
              ? "border-t-2 border-line bg-surface/60 px-5 py-5 sm:px-6 sm:py-6"
              : "border-t border-line px-5 py-4"
          }
        >
          <div className="studio-fade-up flex flex-col gap-5">
            {isPractice ? (
              canEditCode ? (
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onBlur={() => schedulePersist(true)}
                  rows={4}
                  aria-label="Challenge"
                  className={`${fieldClass} resize-y whitespace-pre-wrap text-[15px] leading-7 text-muted`}
                />
              ) : (
                <p className="whitespace-pre-wrap text-[15px] leading-7 text-muted">
                  {promptText}
                </p>
              )
            ) : null}

            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-accent uppercase">
                Syntax
              </p>
              {syntaxCollapsed ? (
                <button
                  type="button"
                  onClick={() => setShowSyntax(false)}
                  className="text-xs font-semibold text-muted underline underline-offset-2 hover:text-accent"
                >
                  Hide
                </button>
              ) : null}
            </div>

            {card.learner_attempt?.trim() ? (
              <div
                className={
                  funStyle
                    ? "rounded-xl border-2 border-dashed border-line bg-surface px-4 py-3"
                    : "border border-dashed border-line px-3 py-2"
                }
              >
                <p className="text-sm font-bold text-ink">Your attempt</p>
                <pre className="mt-1 whitespace-pre-wrap font-mono text-sm text-muted">
                  {card.learner_attempt.trim()}
                </pre>
              </div>
            ) : null}

            <div>
              <p className="mb-1.5 text-sm font-bold text-ink">Python</p>
              <EditableToolCode
                toolCardId={card.id}
                initialCode={card.code}
                editable={canEditCode}
              />
            </div>

            <dl className="grid gap-4 text-sm sm:grid-cols-1">
              <div
                className={
                  funStyle
                    ? "rounded-xl border-2 border-line bg-surface px-4 py-3"
                    : ""
                }
              >
                <dt className="font-bold text-ink">Example</dt>
                <dd className="lt-example-dd mt-1 font-mono text-xs leading-5 text-muted">
                  {canEditCode ? (
                    <textarea
                      value={exampleText}
                      onChange={(e) => setExampleText(e.target.value)}
                      onBlur={() => schedulePersist(true)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      rows={3}
                      aria-label="Example"
                      placeholder="e.g. input → output"
                      className={`lt-example-field ${fieldClass} resize-y border-line bg-surface px-2 py-1.5`}
                    />
                  ) : (
                    exampleText || "—"
                  )}
                </dd>
              </div>
              <div
                className={
                  funStyle
                    ? "rounded-xl border-2 border-line bg-surface px-4 py-3"
                    : ""
                }
              >
                <dt className="font-bold text-ink">Why it works</dt>
                <dd className="mt-1 leading-6 text-muted">
                  {canEditCode ? (
                    <textarea
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      onBlur={() => schedulePersist(true)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      rows={3}
                      aria-label="Why it works"
                      className={`${fieldClass} resize-y leading-6`}
                    />
                  ) : (
                    explanation
                  )}
                </dd>
              </div>
            </dl>

            {canEditCode && saveLabel ? (
              <p
                className={`font-mono text-[11px] ${
                  saveStatus === "error" ? "text-danger" : "text-muted"
                }`}
              >
                {saveLabel}
              </p>
            ) : null}

            {clarifications.length > 0 ? (
              <div className="grid gap-3 border-t border-line pt-4">
                <p className="text-sm font-bold text-ink">Follow-ups</p>
                {clarifications.map((row) => (
                  <ClarificationBlock
                    key={row.id}
                    row={row}
                    editable={canClarify}
                  />
                ))}
              </div>
            ) : null}

            {showClarifySection ? (
              <CardClarifyForm toolCardId={card.id} />
            ) : null}

            <p className="font-mono text-[11px] text-muted">
              AI-generated — review before trusting.
            </p>

            {showQuestFooter && nextSkill ? (
              <div className="flex flex-col gap-2 border-t-2 border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-[11px] font-bold tracking-[0.1em] text-accent uppercase">
                    Up next
                  </p>
                  <p className="mt-1 text-sm font-bold text-ink">
                    {nextSkill.label}
                  </p>
                </div>
                <Link
                  href={`/?start=${encodeURIComponent(nextSkill.id)}#learn`}
                  className="learn-fun-cta w-fit"
                >
                  Next skill →
                </Link>
              </div>
            ) : null}

            {showQuestFooter && !nextSkill ? (
              <div className="flex flex-col gap-2 border-t-2 border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-muted">
                  You&apos;re caught up on suggested follow-ups.
                </p>
                <Link href="/practice" className="learn-fun-cta w-fit">
                  Practice instead →
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
