"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateToolCardCode } from "@/app/actions/update-tool-code";

type Props = {
  toolCardId: string;
  initialCode: string;
  editable: boolean;
};

const SAVE_DELAY_MS = 650;

export function EditableToolCode({
  toolCardId,
  initialCode,
  editable,
}: Props) {
  const [code, setCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "pending" | "saving" | "saved" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const lastSavedRef = useRef(initialCode);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setCode(initialCode);
    lastSavedRef.current = initialCode;
    setStatus("idle");
    setStatusMessage(null);
  }, [initialCode, toolCardId]);

  useEffect(() => {
    if (!editable) return;
    if (code === lastSavedRef.current) {
      setStatus((s) => (s === "pending" ? "idle" : s));
      return;
    }

    setStatus("pending");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      startTransition(async () => {
        setStatus("saving");
        setStatusMessage(null);
        const result = await updateToolCardCode(toolCardId, code);
        if (result.error) {
          setStatus("error");
          setStatusMessage(result.error);
          return;
        }
        lastSavedRef.current = code;
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1500);
      });
    }, SAVE_DELAY_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [code, editable, toolCardId]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
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

  return (
    <div className="mt-2">
      {editable ? (
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          rows={Math.min(16, Math.max(4, code.split("\n").length + 1))}
          className="w-full resize-y overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-950 p-4 font-mono text-sm leading-6 text-zinc-100 outline-none ring-zinc-500 focus:ring-2 dark:bg-black"
          aria-label="Tool card code"
        />
      ) : (
        <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-sm leading-6 text-zinc-100 dark:bg-black">
          {code}
        </pre>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {statusLabel ? (
          <p
            className={`text-xs ${
              status === "error"
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {statusLabel}
          </p>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={copyCode}
          className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
