import { listLocationsMissingCoordinates, updateLocation } from "./data";

export interface GeocodeResult {
  lat: number;
  lng: number;
}

export async function geocodeAddress(fullAddress: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    fullAddress
  )}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status: string;
    results?: { geometry: { location: { lat: number; lng: number } } }[];
  };
  if (data.status !== "OK" || !data.results?.[0]) return null;
  const loc = data.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

export interface GeocodeBatchResult {
  ok: boolean;
  geocoded: number;
  failed: number;
  message: string;
  errors: string[];
}

const BATCH_SIZE = 10;

export async function geocodeAllMissingLocations(): Promise<GeocodeBatchResult> {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return {
      ok: false,
      geocoded: 0,
      failed: 0,
      message:
        "GOOGLE_MAPS_API_KEY is not set. Add it to your environment variables and try again.",
      errors: [],
    };
  }

  const locations = listLocationsMissingCoordinates();
  if (locations.length === 0) {
    return {
      ok: true,
      geocoded: 0,
      failed: 0,
      message: "All locations already have coordinates.",
      errors: [],
    };
  }

  let geocoded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    const batch = locations.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (loc) => {
        const fullAddress = [loc.address, loc.city, loc.province, loc.postal_code, "Canada"]
          .filter(Boolean)
          .join(", ");
        try {
          const result = await geocodeAddress(fullAddress);
          if (result) {
            updateLocation(loc.id, { latitude: result.lat, longitude: result.lng });
            geocoded += 1;
          } else {
            failed += 1;
            errors.push(`#${loc.store_number} ${loc.name}: no match found`);
          }
        } catch (err) {
          failed += 1;
          errors.push(
            `#${loc.store_number} ${loc.name}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      })
    );
  }

  return {
    ok: true,
    geocoded,
    failed,
    message: `Geocoded ${geocoded} location(s)${failed > 0 ? `, ${failed} failed` : ""}.`,
    errors: errors.slice(0, 15),
  };
}
