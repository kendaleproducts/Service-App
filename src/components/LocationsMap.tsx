"use client";

import { useState, useMemo } from "react";
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from "@react-google-maps/api";

export interface MapLocation {
  id: number;
  store_number: string;
  name: string;
  city: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
}

export interface MapVendor {
  id: number;
  name: string;
  city: string | null;
  province: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
}

type Selection =
  | { type: "location"; data: MapLocation }
  | { type: "vendor"; data: MapVendor };

const CANADA_CENTER = { lat: 56.1304, lng: -106.3468 };
const MAP_CONTAINER_STYLE = { width: "100%", height: "420px" };
const MAP_OPTIONS = { streetViewControl: false, mapTypeControl: false, fullscreenControl: false };

export default function LocationsMap(props: { locations: MapLocation[]; vendors: MapVendor[] }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="bg-white border border-stone-200 rounded-lg p-6 text-sm text-stone-500">
        Map unavailable — set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable it.
      </div>
    );
  }

  return <LoadedMap apiKey={apiKey} {...props} />;
}

function LoadedMap({
  apiKey,
  locations,
  vendors,
}: {
  apiKey: string;
  locations: MapLocation[];
  vendors: MapVendor[];
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: "kendale-google-map-script",
  });

  const [showStores, setShowStores] = useState(true);
  const [showVendors, setShowVendors] = useState(vendors.length > 0 && locations.length === 0);
  const [selected, setSelected] = useState<Selection | null>(null);

  const center = useMemo(() => {
    const first = locations[0] ?? vendors[0];
    return first ? { lat: first.latitude, lng: first.longitude } : CANADA_CENTER;
  }, [locations, vendors]);

  if (loadError) {
    return (
      <div className="bg-white border border-stone-200 rounded-lg p-6 text-sm text-hickory">
        Could not load Google Maps. Check that the API key is valid and the Maps JavaScript API
        is enabled.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-white border border-stone-200 rounded-lg p-6 text-sm text-stone-500 h-[420px] flex items-center justify-center">
        Loading map…
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-b border-stone-200 text-sm">
        <label className="flex items-center gap-2 text-stone-700">
          <input
            type="checkbox"
            checked={showStores}
            onChange={(e) => setShowStores(e.target.checked)}
          />
          Stores ({locations.length})
        </label>
        <label className="flex items-center gap-2 text-stone-700">
          <input
            type="checkbox"
            checked={showVendors}
            onChange={(e) => setShowVendors(e.target.checked)}
          />
          Vendors ({vendors.length})
        </label>
      </div>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={locations.length + vendors.length > 0 ? 4 : 3}
        options={MAP_OPTIONS}
      >
        {showStores &&
          locations.map((loc) => (
            <MarkerF
              key={`loc-${loc.id}`}
              position={{ lat: loc.latitude, lng: loc.longitude }}
              icon={{
                path: 0, // google.maps.SymbolPath.CIRCLE
                fillColor: "#D5522F",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 1,
                scale: 6,
              }}
              onClick={() => setSelected({ type: "location", data: loc })}
            />
          ))}
        {showVendors &&
          vendors.map((v) => (
            <MarkerF
              key={`vendor-${v.id}`}
              position={{ lat: v.latitude, lng: v.longitude }}
              icon={{
                path: 0, // google.maps.SymbolPath.CIRCLE
                fillColor: "#1D1B1B",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 1,
                scale: 6,
              }}
              onClick={() => setSelected({ type: "vendor", data: v })}
            />
          ))}

        {selected?.type === "location" && (
          <InfoWindowF
            position={{ lat: selected.data.latitude, lng: selected.data.longitude }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="text-sm min-w-[160px]">
              <p className="font-medium text-charcoal">
                #{selected.data.store_number} {selected.data.name}
              </p>
              <p className="text-stone-600">
                {selected.data.city}
                {selected.data.city && selected.data.province ? ", " : ""}
                {selected.data.province}
              </p>
              <div className="mt-2 flex flex-col gap-1">
                <a href={`/locations/${selected.data.id}`} className="text-hotsauce hover:underline">
                  View location
                </a>
                <a
                  href={`/service-requests/new?locationId=${selected.data.id}`}
                  className="text-hotsauce hover:underline"
                >
                  New service request
                </a>
              </div>
            </div>
          </InfoWindowF>
        )}

        {selected?.type === "vendor" && (
          <InfoWindowF
            position={{ lat: selected.data.latitude, lng: selected.data.longitude }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="text-sm min-w-[160px]">
              <p className="font-medium text-charcoal">{selected.data.name}</p>
              <p className="text-stone-600">
                {selected.data.city}
                {selected.data.city && selected.data.province ? ", " : ""}
                {selected.data.province}
              </p>
              {selected.data.phone && <p className="text-stone-600">{selected.data.phone}</p>}
              <a
                href={`/service-companies/${selected.data.id}`}
                className="text-hotsauce hover:underline mt-2 inline-block"
              >
                View vendor
              </a>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}
