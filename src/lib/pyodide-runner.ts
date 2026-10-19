/** Browser-only Python via Pyodide (CDN). Singleton — load once per tab. */

const PYODIDE_VERSION = "0.27.7";
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const SCRIPT_URL = `${INDEX_URL}pyodide.js`;

const RUN_TIMEOUT_MS = 4000;

type PyodideLike = {
  setStdout: (opts: { raw: (charCode: number) => void }) => void;
  setStderr: (opts: { raw: (charCode: number) => void }) => void;
  runPythonAsync: (code: string) => Promise<unknown>;
};

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideLike>;
  }
}

let loadPromise: Promise<PyodideLike> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-pyodide="1"]`,
    );
    if (existing) {
      if (window.loadPyodide) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Could not load Pyodide script.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.pyodide = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Pyodide script."));
    document.head.appendChild(script);
  });
}

export function ensurePyodide(): Promise<PyodideLike> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Python terminal only runs in the browser."));
  }
  if (!loadPromise) {
    loadPromise = (async () => {
      await loadScript(SCRIPT_URL);
      if (!window.loadPyodide) {
        throw new Error("Pyodide failed to initialize.");
      }
      return window.loadPyodide({ indexURL: INDEX_URL });
    })().catch((err) => {
      loadPromise = null;
      throw err;
    });
  }
  return loadPromise;
}

export type PythonRunResult = {
  stdout: string;
  stderr: string;
  error: string | null;
  timedOut: boolean;
};

export async function runPython(code: string): Promise<PythonRunResult> {
  const pyodide = await ensurePyodide();

  let stdout = "";
  let stderr = "";

  // Use `raw` (not `batched`): batched strips the trailing newline from each
  // print(), so multiple prints were glued onto one line in the UI.
  pyodide.setStdout({
    raw: (charCode) => {
      stdout += String.fromCharCode(charCode);
    },
  });
  pyodide.setStderr({
    raw: (charCode) => {
      stderr += String.fromCharCode(charCode);
    },
  });

  let timedOut = false;
  let error: string | null = null;

  const run = pyodide.runPythonAsync(code).then(
    () => undefined,
    (err: unknown) => {
      error = err instanceof Error ? err.message : String(err);
    },
  );

  const timeout = new Promise<"timeout">((resolve) => {
    setTimeout(() => resolve("timeout"), RUN_TIMEOUT_MS);
  });

  const winner = await Promise.race([run.then(() => "done" as const), timeout]);
  if (winner === "timeout") {
    timedOut = true;
    error =
      error ??
      `Timed out after ${RUN_TIMEOUT_MS / 1000}s. Keep snippets short (no infinite loops).`;
  } else {
    await run;
  }

  return { stdout, stderr, error, timedOut };
}

export function isPyodideReady(): boolean {
  return loadPromise !== null;
}
