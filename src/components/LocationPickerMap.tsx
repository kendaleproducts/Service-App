"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from "@react-google-maps/api";

export interface PickableLocation {
  id: number;
  store_number: string;
  name: string;
  city: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
}

const CANADA_CENTER = { lat: 56.1304, lng: -106.3468 };
const MAP_CONTAINER_STYLE = { width: "100%", height: "320px" };
const MAP_OPTIONS = { streetViewControl: false, mapTypeControl: false, fullscreenControl: false };

export default function LocationPickerMap(props: {
  locations: PickableLocation[];
  selectedLocationId: string;
  onSelect: (id: string) => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="bg-white border border-stone-200 rounded-lg p-6 text-sm text-stone-500">
        Map unavailable — set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable it.
      </div>
    );
  }

  return <LoadedPickerMap apiKey={apiKey} {...props} />;
}

function LoadedPickerMap({
  apiKey,
  locations,
  selectedLocationId,
  onSelect,
}: {
  apiKey: string;
  locations: PickableLocation[];
  selectedLocationId: string;
  onSelect: (id: string) => void;
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: "kendale-google-map-script",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const geocoded = locations.filter((l) => l.latitude != null && l.longitude != null);
  const selected = geocoded.find((l) => String(l.id) === selectedLocationId) ?? null;
  const infoTarget = geocoded.find((l) => l.id === hoveredId) ?? selected;

  const center = geocoded[0] ? { lat: geocoded[0].latitude!, lng: geocoded[0].longitude! } : CANADA_CENTER;

  useEffect(() => {
    if (selected && mapRef.current) {
      mapRef.current.panTo({ lat: selected.latitude!, lng: selected.longitude! });
    }
  }, [selected]);

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
      <div className="bg-white border border-stone-200 rounded-lg p-6 text-sm text-stone-500 h-[320px] flex items-center justify-center">
        Loading map…
      </div>
    );
  }

  if (geocoded.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-lg p-6 text-sm text-stone-500">
        No geocoded locations to show on the map yet. Use the Geocode button on the Locations
        page to enable this.
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-stone-200 text-xs text-stone-500">
        Click a pin to select that location
      </div>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={geocoded.length > 0 ? 4 : 3}
        options={MAP_OPTIONS}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {geocoded.map((loc) => {
          const isSelected = String(loc.id) === selectedLocationId;
          return (
            <MarkerF
              key={loc.id}
              position={{ lat: loc.latitude!, lng: loc.longitude! }}
              icon={{
                url: "/brand/mary-browns-mark.png",
                scaledSize: new google.maps.Size(isSelected ? 40 : 28, isSelected ? 40 : 28),
                anchor: new google.maps.Point(isSelected ? 20 : 14, isSelected ? 20 : 14),
              }}
              onClick={() => onSelect(String(loc.id))}
              onMouseOver={() => setHoveredId(loc.id)}
              onMouseOut={() => setHoveredId(null)}
            />
          );
        })}

        {infoTarget && (
          <InfoWindowF
            position={{ lat: infoTarget.latitude!, lng: infoTarget.longitude! }}
            onCloseClick={() => setHoveredId(null)}
          >
            <div className="text-sm min-w-[140px]">
              <p className="font-medium text-charcoal">
                #{infoTarget.store_number} {infoTarget.name}
              </p>
              <p className="text-stone-600">
                {infoTarget.city}
                {infoTarget.city && infoTarget.province ? ", " : ""}
                {infoTarget.province}
              </p>
              {String(infoTarget.id) === selectedLocationId && (
                <p className="text-hotsauce font-medium mt-1">Selected</p>
              )}
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}
