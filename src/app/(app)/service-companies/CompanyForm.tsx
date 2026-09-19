import type { ServiceCompany } from "@/lib/types";

export default function CompanyForm({
  action,
  company,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  company?: ServiceCompany;
  submitLabel: string;
}) {
  return (
    <form action={action} className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-stone-500 mb-1">Company Name</label>
          <input
            name="name"
            required
            defaultValue={company?.name}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Contact Name</label>
          <input
            name="contact_name"
            defaultValue={company?.contact_name ?? ""}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Phone</label>
          <input
            name="phone"
            defaultValue={company?.phone ?? ""}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={company?.email ?? ""}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Coverage Area
          </label>
          <input
            name="coverage_area"
            placeholder="e.g. Alberta, BC Lower Mainland"
            defaultValue={company?.coverage_area ?? ""}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-stone-500 mb-1">Address</label>
          <input
            name="address"
            defaultValue={company?.address ?? ""}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">City</label>
          <input
            name="city"
            defaultValue={company?.city ?? ""}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Province</label>
          <input
            name="province"
            defaultValue={company?.province ?? ""}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Postal Code</label>
          <input
            name="postal_code"
            defaultValue={company?.postal_code ?? ""}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-stone-500 mb-1">Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={company?.notes ?? ""}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        className="rounded-md bg-hotsauce px-4 py-2 text-sm font-medium text-white hover:bg-hickory"
      >
        {submitLabel}
      </button>
    </form>
  );
}
