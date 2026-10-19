"use client";

import { indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { indentUnit } from "@codemirror/language";
import { EditorView, keymap, placeholder as placeholderExt } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";

type Props = {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  minHeight?: string;
  ariaLabel?: string;
};

/** Shared Python editor: syntax colors + Enter/Tab indent behavior. */
export function PythonCodeEditor({
  value,
  onChange,
  placeholder = "# Python",
  disabled = false,
  readOnly = false,
  minHeight = "8.5rem",
  ariaLabel = "Python code",
}: Props) {
  const extensions = useMemo(
    () => [
      python(),
      indentUnit.of("    "),
      keymap.of([indentWithTab]),
      placeholderExt(placeholder),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": {
          fontSize: "0.875rem",
          backgroundColor: "transparent",
        },
        ".cm-content": {
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          padding: "0.5rem 0",
          caretColor: "#e8efeb",
        },
        ".cm-gutters": {
          backgroundColor: "transparent",
          border: "none",
          color: "#6b7a74",
        },
        ".cm-activeLineGutter": {
          backgroundColor: "transparent",
        },
        ".cm-activeLine": {
          backgroundColor: "rgba(255,255,255,0.04)",
        },
        "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
          backgroundColor: "rgba(15, 118, 110, 0.35)",
        },
        ".cm-cursor, .cm-dropCursor": {
          borderLeftColor: "#e8efeb",
        },
        ".cm-placeholder": {
          color: "rgba(232, 239, 235, 0.35)",
          fontStyle: "normal",
        },
      }),
    ],
    [placeholder],
  );

  return (
    <div
      className="overflow-hidden border border-line/40 bg-code-bg ring-accent focus-within:ring-2"
      aria-label={ariaLabel}
    >
      <CodeMirror
        value={value}
        height="auto"
        minHeight={minHeight}
        theme={oneDark}
        extensions={extensions}
        editable={!disabled && !readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: false,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightSelectionMatches: false,
        }}
        onChange={(next) => {
          if (!disabled && !readOnly) onChange?.(next);
        }}
        className={disabled ? "opacity-60" : undefined}
      />
    </div>
  );
}
