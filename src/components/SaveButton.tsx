"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleSaveTool } from "@/app/actions/save-tool";

type Props = {
  toolCardId: string;
  initiallySaved: boolean;
};

export function SaveButton({ toolCardId, initiallySaved }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleSaveTool(toolCardId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(result.saved);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={toggle}
        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
          saved
            ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
            : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        }`}
      >
        {saved ? "Saved" : "Save"}
      </button>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
