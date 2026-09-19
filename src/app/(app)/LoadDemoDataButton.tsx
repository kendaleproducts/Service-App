"use client";

import { useState, useTransition } from "react";
import { loadDemoDataAction } from "./demo-actions";

export default function LoadDemoDataButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await loadDemoDataAction();
            setMessage(result.message);
          });
        }}
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
      >
        {isPending ? "Loading…" : "Load Demo Data"}
      </button>
      {message && <span className="text-sm text-stone-500">{message}</span>}
    </div>
  );
}
