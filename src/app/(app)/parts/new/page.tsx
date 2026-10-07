import BackLink from "@/components/BackLink";
import { createPartAction } from "../actions";

export default function NewPartPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <BackLink fallbackHref="/parts" label="Back to parts" />
        <h1 className="text-2xl font-semibold text-charcoal mt-1">Add Part</h1>
      </div>
      <form action={createPartAction} className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Part Number</label>
          <input
            name="part_number"
            required
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Description</label>
          <input
            name="description"
            required
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-hotsauce px-4 py-2 text-sm font-medium text-white hover:bg-hickory"
        >
          Add Part
        </button>
      </form>
    </div>
  );
}
