"use client";

import { useState, useTransition } from "react";
import { geocodeLocationsAction } from "./geocode-actions";

export default function GeocodeButton({ missingCount }: { missingCount: number }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (missingCount === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await geocodeLocationsAction();
            setMessage(result.message);
          });
        }}
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
      >
        {isPending ? "Geocoding…" : `Geocode ${missingCount} Location(s) for Map`}
      </button>
      {message && <span className="text-sm text-stone-500">{message}</span>}
    </div>
  );
}
