"use client";

import { useState } from "react";
import type { Part } from "@/lib/types";

export default function ShipmentItemsField({ parts }: { parts: Part[] }) {
  const [rows, setRows] = useState([0]);
  const [nextKey, setNextKey] = useState(1);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-stone-500">Parts</label>
      {rows.map((key) => (
        <div key={key} className="flex gap-2">
          <select
            name="part_id"
            required
            defaultValue=""
            className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select a part...
            </option>
            {parts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.part_number} — {p.description} ({p.quantity_on_hand} on hand)
              </option>
            ))}
          </select>
          <input
            name="quantity"
            type="number"
            min={1}
            defaultValue={1}
            required
            className="w-24 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => setRows((r) => r.filter((k) => k !== key))}
              className="text-sm text-stone-400 hover:text-hickory px-2"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          setRows((r) => [...r, nextKey]);
          setNextKey((k) => k + 1);
        }}
        className="text-sm text-stone-600 hover:text-hotsauce"
      >
        + Add another part
      </button>
    </div>
  );
}
