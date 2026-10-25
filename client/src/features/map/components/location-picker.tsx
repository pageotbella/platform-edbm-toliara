import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { SafeMapContainer } from "./map-container";

type Point = { lat: number; lng: number } | null;

function ClickHandler({ onChange }: { onChange: (p: { lat: number; lng: number }) => void }) {
  useMapEvents({ click: (e) => onChange({ lat: +e.latlng.lat.toFixed(5), lng: +e.latlng.lng.toFixed(5) }) });
  return null;
}

function FollowPoint({ value }: { value: Point }) {
  const map = useMap();
  const lat = value?.lat;
  const lng = value?.lng;
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng], Math.max(map.getZoom(), 8));
  }, [map, lat, lng]);
  return null;
}

// Choix des coordonnées d'une opportunité par clic sur la carte (étape 2 du formulaire)
export default function LocationPicker({
  value, onChange, className = "h-72",
}: {
  value: Point;
  onChange: (p: { lat: number; lng: number }) => void;
  className?: string;
}) {
  return (
    <SafeMapContainer center={value ? [value.lat, value.lng] : [-23.35, 43.67]} zoom={value ? 9 : 6} className={`z-0 w-full cursor-crosshair rounded-lg ${className}`}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onChange={onChange} />
      <FollowPoint value={value} />
      {value && (
        <CircleMarker center={[value.lat, value.lng]} radius={10} pathOptions={{ color: "#fff", weight: 3, fillColor: "#7a3f7a", fillOpacity: 1 }} />
      )}
    </SafeMapContainer>
  );
}
