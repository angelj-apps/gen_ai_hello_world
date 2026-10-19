"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteCardClarification,
  updateCardClarification,
} from "@/app/actions/clarify-tool";
import type { ToolCardClarification } from "@/lib/supabase/types";

type Props = {
  row: ToolCardClarification;
  editable: boolean;
};

const SAVE_DELAY_MS = 650;

export function ClarificationBlock({ row, editable }: Props) {
  const router = useRouter();
  const [pendingDelete, startDelete] = useTransition();
  const [, startSave] = useTransition();
  const [question, setQuestion] = useState(row.question_text);
  const [answer, setAnswer] = useState(row.answer_text);
  const [status, setStatus] = useState<
    "idle" | "pending" | "saving" | "saved" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const lastSavedRef = useRef({
    question: row.question_text,
    answer: row.answer_text,
  });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuestion(row.question_text);
    setAnswer(row.answer_text);
    lastSavedRef.current = {
      question: row.question_text,
      answer: row.answer_text,
    };
    setStatus("idle");
    setStatusMessage(null);
  }, [row.id, row.question_text, row.answer_text]);

  useEffect(() => {
    if (!editable) return;

    const unchanged =
      question === lastSavedRef.current.question &&
      answer === lastSavedRef.current.answer;

    if (unchanged) {
      setStatus((s) => (s === "pending" ? "idle" : s));
      return;
    }

    if (!question.trim() || !answer.trim()) {
      setStatus("pending");
      return;
    }

    setStatus("pending");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      startSave(async () => {
        setStatus("saving");
        setStatusMessage(null);
        const result = await updateCardClarification(
          row.id,
          question,
          answer,
        );
        if (result.error) {
          setStatus("error");
          setStatusMessage(result.error);
          return;
        }
        lastSavedRef.current = { question, answer };
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1500);
      });
    }, SAVE_DELAY_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [question, answer, editable, row.id]);

  function remove() {
    if (!window.confirm("Delete this follow-up?")) return;
    setStatusMessage(null);
    startDelete(async () => {
      const result = await deleteCardClarification(row.id);
      if (result.error) {
        setStatus("error");
        setStatusMessage(result.error);
        return;
      }
      router.refresh();
    });
  }

  const statusLabel =
    status === "pending"
      ? "Unsaved…"
      : status === "saving"
        ? "Saving…"
        : status === "saved"
          ? "Saved"
          : status === "error"
            ? statusMessage
            : editable
              ? "Click to edit — saves automatically"
              : null;

  if (!editable) {
    return (
      <div className="border border-line bg-surface px-3 py-3">
        <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
          You asked
        </p>
        <p className="mt-1 text-sm text-ink">{row.question_text}</p>
        <p className="mt-2 font-mono text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
          Clarification
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
          {row.answer_text}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-line bg-surface px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        {statusLabel ? (
          <p
            className={`font-mono text-[11px] ${
              status === "error" ? "text-danger" : "text-muted"
            }`}
          >
            {statusLabel}
          </p>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={pendingDelete}
          onClick={remove}
          className="text-xs text-danger underline underline-offset-2 disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-mono text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
          You asked
        </span>
        <textarea
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="clarify-scroll w-full border border-line bg-surface-raised px-2 py-1.5 text-sm text-ink outline-none ring-accent focus:ring-2"
          aria-label="Follow-up question"
        />
      </label>

      <label className="mt-3 flex flex-col gap-1 text-sm">
        <span className="font-mono text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
          Clarification
        </span>
        <textarea
          rows={4}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="clarify-scroll w-full border border-line bg-surface-raised px-2 py-1.5 text-sm text-ink outline-none ring-accent focus:ring-2"
          aria-label="Clarification answer"
        />
      </label>
    </div>
  );
}
