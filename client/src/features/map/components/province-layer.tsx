import type { MultiPolygon, Polygon as GeoPolygon, Position } from "geojson";
import { Pane, Polygon, Tooltip } from "react-leaflet";
import { PROVINCE_OUTLINE, PROVINCE_REGIONS } from "./province-geo";

const toLatLng = (ring: Position[]) => ring.map(([lng, lat]) => [lat!, lng!] as [number, number]);
const polygonsOf = (g: GeoPolygon | MultiPolygon) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);

// Masque : un rectangle couvrant le monde, percé de la forme de la province
const WORLD: [number, number][] = [[-89, -179], [-89, 179], [89, 179], [89, -179]];
const MASK = [WORLD, ...polygonsOf(PROVINCE_OUTLINE).map((p) => toLatLng(p[0]!))];

// Une teinte par région, comme sur la carte de référence de la province
const REGION_COLORS: Record<string, string> = {
  Menabe: "#d97706",
  "Atsimo-Andrefana": "#7a3f7a",
  Androy: "#0f766e",
  Anosy: "#0369a1",
};

/** Grise tout ce qui est hors de la province et dessine les contours des quatre régions. */
export function ProvinceLayer() {
  return (
    <>
      {/* Sous les marqueurs, au-dessus du fond de carte */}
      <Pane name="province" style={{ zIndex: 350 }}>
        <Polygon
          positions={MASK}
          interactive={false}
          pathOptions={{ stroke: false, fillColor: "#e2e8f0", fillOpacity: 0.82 }}
        />
        {PROVINCE_REGIONS.map((r) => (
          <Polygon
            key={r.name}
            positions={polygonsOf(r.geometry).map((p) => p.map(toLatLng))}
            pathOptions={{ color: REGION_COLORS[r.name] ?? "#7a3f7a", weight: 1.5, opacity: 0.9, fillOpacity: 0.06 }}
          >
            <Tooltip sticky>{r.name}</Tooltip>
          </Polygon>
        ))}
      </Pane>
      <Pane name="province-outline" style={{ zIndex: 360, pointerEvents: "none" }}>
        <Polygon
          positions={polygonsOf(PROVINCE_OUTLINE).map((p) => p.map(toLatLng))}
          interactive={false}
          pathOptions={{ color: "#4a2858", weight: 2.5, fill: false }}
        />
      </Pane>
    </>
  );
}
