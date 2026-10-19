"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useTransition,
} from "react";
import { PythonCodeEditor } from "@/components/PythonCodeEditor";
import { ensurePyodide, runPython } from "@/lib/pyodide-runner";

export type MiniPythonTerminalHandle = {
  runForGrade: () => Promise<{
    code: string;
    output: string;
    error: string | null;
  }>;
};

type Props = {
  /** Uncontrolled seed (tool cards). Ignored when `value` is set. */
  seedCode?: string;
  /** Controlled code (practice). */
  value?: string;
  onChange?: (code: string) => void;
  /** Optional button to reload seedCode into the editor. */
  resetLabel?: string;
  placeholder?: string;
  /** Block all interaction (e.g. while submitting). */
  disabled?: boolean;
  /** Show code but prevent edits; Run still works. */
  readOnly?: boolean;
  /** Hide Run / output — editor chrome only. */
  editorOnly?: boolean;
};

export const MiniPythonTerminal = forwardRef<MiniPythonTerminalHandle, Props>(
  function MiniPythonTerminal(
    {
      seedCode = "",
      value,
      onChange,
      resetLabel,
      placeholder = 'print("hello")',
      disabled = false,
      readOnly = false,
      editorOnly = false,
    },
    ref,
  ) {
    const controlled = value !== undefined;
    const [localCode, setLocalCode] = useState(seedCode);
    const code = controlled ? value : localCode;
    const codeRef = useRef(code);
    codeRef.current = code;

    const [ready, setReady] = useState(false);
    const readyRef = useRef(false);
    const [loadingRuntime, setLoadingRuntime] = useState(false);
    const [output, setOutput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [running, startRun] = useTransition();

    useEffect(() => {
      if (controlled) return;
      setLocalCode((prev) => (prev.trim() ? prev : seedCode));
    }, [seedCode, controlled]);

    useEffect(() => {
      let cancelled = false;
      setLoadingRuntime(true);
      ensurePyodide()
        .then(() => {
          if (!cancelled) {
            setReady(true);
            readyRef.current = true;
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(
              err instanceof Error
                ? err.message
                : "Could not start Python runtime.",
            );
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingRuntime(false);
        });
      return () => {
        cancelled = true;
      };
    }, []);

    function setCode(next: string) {
      codeRef.current = next;
      if (controlled) onChange?.(next);
      else setLocalCode(next);
    }

    async function execute(current: string) {
      if (!readyRef.current) {
        await ensurePyodide();
        setReady(true);
        readyRef.current = true;
      }
      const result = await runPython(current);
      const chunks: string[] = [];
      if (result.stdout) chunks.push(result.stdout);
      if (result.stderr) chunks.push(result.stderr);
      const text = chunks.join("\n").trimEnd();
      const display = text || (result.error ? "" : "(no output)");
      setOutput(display);
      setError(result.error);
      return { code: current, output: text, error: result.error };
    }

    useImperativeHandle(ref, () => ({
      runForGrade: () => execute(codeRef.current),
    }));

    function run() {
      setError(null);
      setOutput("");
      startRun(async () => {
        try {
          setLoadingRuntime(!ready);
          await execute(code);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Run failed.");
        } finally {
          setLoadingRuntime(false);
        }
      });
    }

    return (
      <div className="flex flex-col gap-2 border border-line bg-code-bg p-3">
        {loadingRuntime && !ready ? (
          <p className="font-mono text-xs text-code-ink/70">Loading Python…</p>
        ) : null}

        <PythonCodeEditor
          value={code}
          onChange={setCode}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          minHeight={`${Math.min(12, Math.max(5, code.split("\n").length + 1)) * 1.5}rem`}
        />

        {!editorOnly ? (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={
                  disabled ||
                  running ||
                  (!ready && loadingRuntime) ||
                  !code.trim()
                }
                onClick={run}
                className="bg-accent px-3 py-1.5 text-xs font-medium text-surface-raised transition hover:opacity-90 disabled:opacity-50"
              >
                {running ? "Running…" : "Run"}
              </button>
              {resetLabel && seedCode.trim() && !controlled && !readOnly ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setCode(seedCode)}
                  className="border border-line/50 px-3 py-1.5 font-mono text-[11px] text-code-ink/80 transition hover:border-accent hover:text-code-ink disabled:opacity-50"
                >
                  {resetLabel}
                </button>
              ) : null}
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setOutput("");
                  setError(null);
                }}
                className="border border-line/50 px-3 py-1.5 font-mono text-[11px] text-code-ink/80 transition hover:border-accent hover:text-code-ink disabled:opacity-50"
              >
                Clear output
              </button>
            </div>

            {error ? (
              <pre className="whitespace-pre-wrap font-mono text-xs text-red-300">
                {error}
              </pre>
            ) : null}

            <pre className="min-h-[4.5rem] max-h-48 overflow-auto whitespace-pre-wrap border border-line/30 bg-black/30 px-3 py-2 font-mono text-xs leading-5 text-code-ink">
              {output || " "}
            </pre>
          </>
        ) : null}
      </div>
    );
  },
);
