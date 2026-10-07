"use client";

import { useState } from "react";
import type { Part } from "@/lib/types";

interface PartRow {
  key: number;
  part_id: string;
  quantity: number;
}

export default function PartsField({
  parts,
  initialItems = [],
}: {
  parts: Part[];
  initialItems?: { part_id: number; quantity: number }[];
}) {
  const [rows, setRows] = useState<PartRow[]>(
    initialItems.map((item, i) => ({
      key: i,
      part_id: String(item.part_id),
      quantity: item.quantity,
    }))
  );
  const [nextKey, setNextKey] = useState(initialItems.length);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-stone-500">Parts Needed</label>
      {rows.map((row) => (
        <div key={row.key} className="flex gap-2">
          <select
            name="part_id"
            defaultValue={row.part_id}
            className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select a part...
            </option>
            {parts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.part_number} — {p.description}
              </option>
            ))}
          </select>
          <input
            name="quantity"
            type="number"
            min={1}
            defaultValue={row.quantity}
            className="w-24 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
            className="text-sm text-stone-400 hover:text-hickory px-2"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          setRows((r) => [...r, { key: nextKey, part_id: "", quantity: 1 }]);
          setNextKey((k) => k + 1);
        }}
        className="text-sm text-stone-600 hover:text-hotsauce"
      >
        + Add a part
      </button>
    </div>
  );
}
