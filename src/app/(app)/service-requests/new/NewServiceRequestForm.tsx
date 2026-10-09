"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { haversineKm } from "@/lib/geo";
import Link from "next/link";
import { SERVICE_REQUEST_PRIORITIES } from "@/lib/types";
import type { Equipment, LocationServiceHistory, Part } from "@/lib/types";
import LocationPickerMap from "@/components/LocationPickerMap";
import PartsField from "../PartsField";

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
  getEquipmentForLocation,
  getLocationHistory,
  locations,
  companies,
  parts,
  preselectedLocationId,
}: {
  action: (formData: FormData) => Promise<void>;
  getEquipmentForLocation: (locationId: number) => Promise<Equipment[]>;
  getLocationHistory: (locationId: number) => Promise<LocationServiceHistory>;
  locations: LocationOption[];
  companies: CompanyOption[];
  parts: Part[];
  preselectedLocationId?: number;
}) {
  const [locationId, setLocationId] = useState(
    preselectedLocationId ? String(preselectedLocationId) : ""
  );
  const [companyId, setCompanyId] = useState("");
  const [showOtherPicker, setShowOtherPicker] = useState(false);

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [equipmentId, setEquipmentId] = useState("");
  const [showNewEquipment, setShowNewEquipment] = useState(false);
  const [newSerial, setNewSerial] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newYear, setNewYear] = useState("");
  const [isLoadingEquipment, startEquipmentTransition] = useTransition();
  const thisYear = new Date().getFullYear();

  const [history, setHistory] = useState<LocationServiceHistory | null>(null);

  useEffect(() => {
    if (!locationId) return;
    startEquipmentTransition(async () => {
      const [list, hist] = await Promise.all([
        getEquipmentForLocation(Number(locationId)),
        getLocationHistory(Number(locationId)),
      ]);
      setEquipmentList(list);
      setHistory(hist);
    });
  }, [locationId, getEquipmentForLocation, getLocationHistory]);

  const openTicketForUnit =
    equipmentId && history
      ? history.open.find((r) => String(r.equipment_id) === equipmentId)
      : undefined;

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

  function pickEquipment(id: string) {
    setEquipmentId(id);
    setShowNewEquipment(false);
  }

  function selectLocation(id: string) {
    setLocationId(id);
    setCompanyId("");
    setShowOtherPicker(false);
    setEquipmentId("");
    setShowNewEquipment(false);
    setNewSerial("");
    setNewDescription("");
    setNewYear("");
    setEquipmentList([]);
    setHistory(null);
  }

  return (
    <form action={action} className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Location</label>
        <select
          name="location_id"
          required
          value={locationId}
          onChange={(e) => selectLocation(e.target.value)}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a location...
          </option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              #{l.store_number} — {l.name}
              {l.city || l.province
                ? ` (${[l.city, l.province].filter(Boolean).join(", ")})`
                : ""}
            </option>
          ))}
        </select>
      </div>

      <LocationPickerMap
        locations={locations}
        selectedLocationId={locationId}
        onSelect={selectLocation}
      />

      {locationId && history && (history.open.length > 0 || history.recent.length > 0) && (
        <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
          <div className="px-4 py-2 border-b border-stone-200 text-xs font-medium text-stone-500">
            History at this location
          </div>
          {history.open.length > 0 && (
            <div className="px-4 py-3 bg-hotsauce/5 border-b border-stone-200">
              <p className="text-sm font-medium text-hickory">
                {history.open.length} open ticket(s) — check these before creating another
              </p>
              <ul className="mt-2 space-y-1">
                {history.open.map((r) => (
                  <li key={r.id} className="text-sm">
                    <Link
                      href={`/service-requests/${r.id}`}
                      target="_blank"
                      className="font-medium text-charcoal hover:underline"
                    >
                      #{r.id} · {r.issue_description}
                    </Link>
                    <span className="text-xs text-stone-500">
                      {" "}
                      — {r.status}
                      {r.equipment_serial_number ? ` · ${r.equipment_serial_number}` : ""} ·{" "}
                      {new Date(r.reported_at).toLocaleDateString()}
                      {r.visit_count ? ` · ${r.visit_count} visit(s)` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {history.recent.length > 0 && (
            <ul className="divide-y divide-stone-100">
              {history.recent.map((r) => (
                <li key={r.id} className="px-4 py-2 text-sm">
                  <Link
                    href={`/service-requests/${r.id}`}
                    target="_blank"
                    className="text-charcoal hover:underline"
                  >
                    {r.issue_description}
                  </Link>
                  <span className="text-xs text-stone-500">
                    {" "}
                    — {r.status}
                    {r.equipment_serial_number ? ` · ${r.equipment_serial_number}` : ""} ·{" "}
                    {new Date(r.reported_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {locationId && (
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Equipment Being Serviced
          </label>
          {openTicketForUnit && (
            <p className="mb-2 rounded-md border border-hotsauce/40 bg-hotsauce/5 px-3 py-2 text-sm text-hickory">
              This machine already has open ticket{" "}
              <Link
                href={`/service-requests/${openTicketForUnit.id}`}
                target="_blank"
                className="font-medium underline"
              >
                #{openTicketForUnit.id}
              </Link>
              . If this is the same problem, log a visit there instead of opening a new request.
            </p>
          )}

          {isLoadingEquipment && (
            <p className="text-xs text-stone-500">Loading equipment on file...</p>
          )}

          {!isLoadingEquipment && equipmentList.length > 0 && !showNewEquipment && (
            <div className="space-y-2">
              {equipmentList.map((eq) => (
                <button
                  key={eq.id}
                  type="button"
                  onClick={() => pickEquipment(String(eq.id))}
                  className={`w-full flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    equipmentId === String(eq.id)
                      ? "border-hotsauce bg-hotsauce/5"
                      : "border-stone-300 bg-white hover:bg-stone-50"
                  }`}
                >
                  <span>
                    <span className="font-medium text-charcoal">{eq.serial_number}</span>
                    {eq.description && (
                      <span className="text-stone-500"> — {eq.description}</span>
                    )}
                  </span>
                  {equipmentId === String(eq.id) && (
                    <span className="text-xs font-medium text-hotsauce shrink-0">Selected</span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShowNewEquipment(true);
                  setEquipmentId("");
                }}
                className="w-full rounded-md border border-dashed border-stone-300 px-3 py-2 text-left text-sm text-stone-500 hover:bg-stone-50"
              >
                + Add new machine
              </button>
            </div>
          )}

          {!isLoadingEquipment && (showNewEquipment || equipmentList.length === 0) && (
            <div className="space-y-2">
              {equipmentList.length === 0 && (
                <p className="text-xs text-stone-500">
                  No equipment on file for this location yet. Add the machine being serviced below
                  — it will be saved to this location for future requests.
                </p>
              )}
              <input
                name="new_serial_number"
                required
                placeholder="Serial number"
                value={newSerial}
                onChange={(e) => setNewSerial(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
              <input
                name="equipment_description"
                required
                placeholder="Make/model (e.g. Frymaster FPH155 fryer)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
              <input
                name="installed_year"
                type="number"
                required
                min={1980}
                max={thisYear}
                step={1}
                placeholder={`Installed year (e.g. ${thisYear - 5})`}
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
              {equipmentList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowNewEquipment(false);
                    setNewSerial("");
                    setNewDescription("");
                    setNewYear("");
                  }}
                  className="text-xs text-stone-500 hover:text-hotsauce"
                >
                  ← Back to equipment on file
                </button>
              )}
            </div>
          )}

          <input type="hidden" name="equipment_id" value={equipmentId} />
        </div>
      )}

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
                required
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Select a service company...
                </option>
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

          <input type="hidden" name="service_company_id" value={companyId} />
        </div>
      )}

      <PartsField parts={parts} />

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
            required
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
            required
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Scheduled Date
          </label>
          <input
            name="scheduled_at"
            type="date"
            required
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        className="rounded-md bg-hotsauce px-4 py-2 text-sm font-medium text-white hover:bg-hickory"
      >
        Add Service Request
      </button>
    </form>
  );
}
