"use client";

import { useState } from "react";
import { EditableToolCode } from "@/components/EditableToolCode";
import type { ToolCard, ToolCardClarification } from "@/lib/supabase/types";
import { CardClarifyForm } from "@/components/CardClarifyForm";
import { ClarificationBlock } from "@/components/ClarificationBlock";
import { VoteButtons } from "@/components/VoteButtons";
import { SaveButton } from "@/components/SaveButton";

type Props = {
  card: ToolCard;
  myVote?: number | null;
  saved?: boolean;
  showActions?: boolean;
  /** When true, code and deep detail stay hidden until the learner asks. */
  syntaxCollapsed?: boolean;
  clarifications?: ToolCardClarification[];
  canClarify?: boolean;
  canEditCode?: boolean;
};

export function ToolCardView({
  card,
  myVote = null,
  saved = false,
  showActions = true,
  syntaxCollapsed = false,
  clarifications = [],
  canClarify = false,
  canEditCode = false,
}: Props) {
  const [showSyntax, setShowSyntax] = useState(!syntaxCollapsed);

  const showClarifySection = showSyntax && canClarify;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-medium tracking-wide uppercase">
              {card.difficulty}
            </span>
            {card.tags?.length ? (
              <span>· {card.tags.slice(0, 4).join(" · ")}</span>
            ) : null}
            <span className="tabular-nums">· score {card.score}</span>
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {card.title}
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">{card.what_it_does}</p>
          {card.goal ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {card.goal}
            </p>
          ) : null}
        </div>
        {showActions ? (
          <div className="flex flex-col items-end gap-2">
            <VoteButtons
              toolCardId={card.id}
              score={card.score}
              myVote={myVote}
            />
            <SaveButton toolCardId={card.id} initiallySaved={saved} />
          </div>
        ) : null}
      </div>

      {!showSyntax ? (
        <button
          type="button"
          onClick={() => setShowSyntax(true)}
          className="mt-4 rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Show syntax
        </button>
      ) : (
        <>
          {card.learner_attempt?.trim() ? (
            <div className="mt-4 rounded-xl border border-dashed border-zinc-300 px-3 py-2 dark:border-zinc-700">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Your attempt
              </p>
              <pre className="mt-1 whitespace-pre-wrap font-mono text-sm text-zinc-600 dark:text-zinc-400">
                {card.learner_attempt.trim()}
              </pre>
            </div>
          ) : null}

          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Code
              </p>
              {syntaxCollapsed ? (
                <button
                  type="button"
                  onClick={() => setShowSyntax(false)}
                  className="text-xs text-zinc-500 underline underline-offset-2"
                >
                  Hide
                </button>
              ) : null}
            </div>
            <EditableToolCode
              toolCardId={card.id}
              initialCode={card.code}
              editable={canEditCode}
            />
          </div>

          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="font-medium text-zinc-700 dark:text-zinc-300">
                Example
              </dt>
              <dd className="mt-1 text-zinc-600 dark:text-zinc-400">
                In: {card.example_input}
                <br />
                Out: {card.example_output}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700 dark:text-zinc-300">
                Why it works
              </dt>
              <dd className="mt-1 text-zinc-600 dark:text-zinc-400">
                {card.explanation}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-700 dark:text-zinc-300">
                When to use
              </dt>
              <dd className="mt-1 text-zinc-600 dark:text-zinc-400">
                {card.when_to_use}
              </dd>
            </div>
            <div className="rounded-xl border border-dashed border-zinc-300 px-3 py-2 dark:border-zinc-700">
              <dt className="font-medium text-zinc-700 dark:text-zinc-300">
                Try changing
              </dt>
              <dd className="mt-1 text-zinc-600 dark:text-zinc-400">
                {card.try_changing}
              </dd>
            </div>
          </dl>

          {clarifications.length > 0 ? (
            <div className="mt-4 grid gap-3">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Follow-ups
              </p>
              {clarifications.map((row) => (
                <ClarificationBlock
                  key={row.id}
                  row={row}
                  editable={canClarify}
                />
              ))}
            </div>
          ) : null}

          {showClarifySection ? <CardClarifyForm toolCardId={card.id} /> : null}

          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
            AI-generated — review before trusting.
          </p>
        </>
      )}
    </article>
  );
}
