"use client";

export default function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
    >
      {label}
    </button>
  );
}
