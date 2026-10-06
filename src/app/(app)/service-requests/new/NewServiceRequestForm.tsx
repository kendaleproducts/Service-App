"use client";

import { useMemo, useState } from "react";
import { haversineKm } from "@/lib/geo";
import { SERVICE_REQUEST_PRIORITIES } from "@/lib/types";

interface LocationOption {
  id: number;
  store_number: string;
  name: string;
  city: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface CompanyOption {
  id: number;
  name: string;
  city: string | null;
  province: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default function NewServiceRequestForm({
  action,
  locations,
  companies,
  preselectedLocationId,
}: {
  action: (formData: FormData) => Promise<void>;
  locations: LocationOption[];
  companies: CompanyOption[];
  preselectedLocationId?: number;
}) {
  const [locationId, setLocationId] = useState(
    preselectedLocationId ? String(preselectedLocationId) : ""
  );
  const [companyId, setCompanyId] = useState("");
  const [showOtherPicker, setShowOtherPicker] = useState(false);

  const nearestCompanies = useMemo(() => {
    const location = locations.find((l) => String(l.id) === locationId);
    if (!location || location.latitude == null || location.longitude == null) return [];
    return companies
      .filter((c) => c.latitude != null && c.longitude != null)
      .map((c) => ({
        ...c,
        distanceKm: haversineKm(
          location.latitude as number,
          location.longitude as number,
          c.latitude as number,
          c.longitude as number
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
  }, [locationId, locations, companies]);

  const hasQuickPicks = nearestCompanies.length > 0;
  const quickPickIds = new Set(nearestCompanies.map((c) => String(c.id)));
  const useOtherPicker = showOtherPicker || !hasQuickPicks;

  function pickCompany(id: string) {
    setCompanyId(id);
    setShowOtherPicker(false);
  }

  return (
    <form action={action} className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Location</label>
        <select
          name="location_id"
          required
          value={locationId}
          onChange={(e) => {
            setLocationId(e.target.value);
            setCompanyId("");
            setShowOtherPicker(false);
          }}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a location...
          </option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              #{l.store_number} — {l.name} ({l.city}, {l.province})
            </option>
          ))}
        </select>
      </div>

      {locationId && (
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Assign Service Company
          </label>

          {!hasQuickPicks && (
            <p className="text-xs text-stone-500 mb-2">
              This location isn&apos;t geocoded yet, so nearby service companies can&apos;t be
              suggested. Use the Geocode button on the Locations page to enable this, or pick one
              below.
            </p>
          )}

          {hasQuickPicks && !useOtherPicker && (
            <div className="space-y-2">
              {nearestCompanies.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCompany(String(c.id))}
                  className={`w-full flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    companyId === String(c.id)
                      ? "border-hotsauce bg-hotsauce/5"
                      : "border-stone-300 bg-white hover:bg-stone-50"
                  }`}
                >
                  <span>
                    <span className="font-medium text-charcoal">{c.name}</span>
                    <span className="text-stone-500">
                      {" "}
                      — {c.city}
                      {c.city && c.province ? ", " : ""}
                      {c.province}
                    </span>
                  </span>
                  <span className="shrink-0 flex items-center gap-2">
                    <span className="text-xs text-stone-500">{c.distanceKm.toFixed(1)} km</span>
                    {companyId === String(c.id) && (
                      <span className="text-xs font-medium text-hotsauce">Selected</span>
                    )}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowOtherPicker(true)}
                className="w-full rounded-md border border-dashed border-stone-300 px-3 py-2 text-left text-sm text-stone-500 hover:bg-stone-50"
              >
                Other service company...
              </button>
            </div>
          )}

          {useOtherPicker && (
            <div className="space-y-2">
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.city ? ` (${c.city}${c.province ? ", " + c.province : ""})` : ""}
                  </option>
                ))}
              </select>
              {hasQuickPicks && (
                <button
                  type="button"
                  onClick={() => {
                    setShowOtherPicker(false);
                    if (!quickPickIds.has(companyId)) setCompanyId("");
                  }}
                  className="text-xs text-stone-500 hover:text-hotsauce"
                >
                  ← Back to suggested companies
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <input type="hidden" name="service_company_id" value={companyId} />

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">
          Equipment (make/model, optional)
        </label>
        <input
          name="equipment_description"
          placeholder="e.g. Frymaster FPH155 fryer"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">
          Issue Description
        </label>
        <textarea
          name="issue_description"
          required
          rows={4}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Priority</label>
          <select
            name="priority"
            defaultValue="Normal"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            {SERVICE_REQUEST_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Reported By</label>
          <input
            name="reported_by"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Scheduled Date (optional)
          </label>
          <input
            name="scheduled_at"
            type="date"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        className="rounded-md bg-hotsauce px-4 py-2 text-sm font-medium text-white hover:bg-hickory"
      >
        Create Service Request
      </button>
    </form>
  );
}
