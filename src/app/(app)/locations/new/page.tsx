import { LOCATION_STATUSES } from "@/lib/types";
import { createLocationAction } from "../actions";

export default function NewLocationPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-charcoal">Add Location</h1>
      <form
        action={createLocationAction}
        className="bg-white border border-stone-200 rounded-lg p-5 space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Store #</label>
            <input
              name="store_number"
              required
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Ownership</label>
            <select
              name="ownership"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="Franchise">Franchise</option>
              <option value="Corporate">Corporate</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-stone-500 mb-1">Name</label>
            <input
              name="name"
              required
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Status</label>
            <select
              name="status"
              defaultValue="Open"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            >
              {LOCATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-stone-500 mb-1">Address</label>
            <input
              name="address"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">City</label>
            <input
              name="city"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Province</label>
            <input
              name="province"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Postal Code</label>
            <input
              name="postal_code"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Phone</label>
            <input
              name="phone"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-stone-500 mb-1">Site Contact</label>
            <input
              name="contact_name"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          className="rounded-md bg-hotsauce px-4 py-2 text-sm font-medium text-white hover:bg-hickory"
        >
          Create Location
        </button>
      </form>
    </div>
  );
}
