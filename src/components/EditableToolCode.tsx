"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateToolCardCode } from "@/app/actions/update-tool-code";
import { MiniPythonTerminal } from "@/components/MiniPythonTerminal";

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
    <div className="mt-1">
      <MiniPythonTerminal
        value={code}
        onChange={editable ? setCode : undefined}
        readOnly={!editable}
        placeholder="# Python"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
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
          onClick={copyCode}
          className="border border-line bg-surface px-2.5 py-1 font-mono text-[11px] font-medium text-ink transition hover:border-accent hover:text-accent"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
