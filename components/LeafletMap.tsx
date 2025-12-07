"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix marker icons (Leaflet bug)
delete (L.Icon.Default.prototype as any)["_getIconUrl"];
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LeafletMapProps {
  onSelect: (coords: string) => void; // REQUIRED
  latLong?: string;                   // OPTIONAL
}

function ChangeView({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, 17, { animate: true });
  }, [coords]);
  return null;
}

function LocationPicker({
  onSelect,
  setMarkerPos,
}: {
  onSelect: (coords: string) => void;
  setMarkerPos: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      setMarkerPos([lat, lng]);
      onSelect(`${lat},${lng}`);
    },
  });

  return null;
}

export default function LeafletMap({ onSelect, latLong }: LeafletMapProps) {
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);

  // When parent updates latLong (Mapbox autocomplete)
  useEffect(() => {
    if (latLong) {
      const [lat, lng] = latLong.split(",").map(Number);
      setMarkerPos([lat, lng]);
    }
  }, [latLong]);

  return (
    <MapContainer
      center={markerPos || [10.3157, 123.8854]} // Cebu default
      zoom={13}
      style={{
        height: "300px",
        width: "100%",
        borderRadius: "10px",
      }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {markerPos && <Marker position={markerPos} />}
      {markerPos && <ChangeView coords={markerPos} />}

      <LocationPicker onSelect={onSelect} setMarkerPos={setMarkerPos} />
    </MapContainer>
  );
}
