import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleMarker, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { formatAmount } from "@/lib/format";
import { MapCard } from "./map-card";
import { SafeMapContainer } from "./map-container";
import { areaFor, PROVINCE_BOUNDS } from "./province";
import { ProvinceLayer } from "./province-layer";
import { sectorColor } from "./sector-colors";

export type MapPoint = {
  id: string;
  slug: string;
  title: string;
  sector: string;
  sectorSlug: string;
  region: string;
  district: string | null;
  estimatedInvestment: number | null;
  currency: string;
  latitude: number | null;
  longitude: number | null;
};


// Recadre la carte quand la liste des points change (filtres)
function FitBounds({ points, maxZoom = 9 }: { points: MapPoint[]; maxZoom?: number }) {
  const map = useMap();
  const key = points.map((p) => p.id).join(",");
  useEffect(() => {
    const coords = points.filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => [p.latitude!, p.longitude!] as [number, number]);
    if (coords.length) map.fitBounds(L.latLngBounds(coords), { padding: [40, 40], maxZoom });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

// ---------- Regroupement des projets proches (clusters) ----------
// Plusieurs projets d'une même zone se superposent à petite échelle : on les regroupe en une pastille
// numérotée, recalculée à chaque zoom. Au clic, une fiche (MapCard) liste les projets du groupe.

const CLUSTER_RADIUS_PX = 38;

type Located = MapPoint & { latitude: number; longitude: number };
type Cluster = { key: string; lat: number; lng: number; points: Located[] };

function buildClusters(map: L.Map, zoom: number, points: Located[]): Cluster[] {
  const clusters: (Cluster & { px: L.Point })[] = [];
  for (const p of points) {
    const px = map.project([p.latitude, p.longitude], zoom);
    const near = clusters.find((c) => c.px.distanceTo(px) < CLUSTER_RADIUS_PX);
    if (near) near.points.push(p);
    else clusters.push({ key: p.id, lat: p.latitude, lng: p.longitude, points: [p], px });
  }
  // Centre du groupe = moyenne des coordonnées
  return clusters.map((c) => ({
    key: c.key,
    points: c.points,
    lat: c.points.reduce((s, p) => s + p.latitude, 0) / c.points.length,
    lng: c.points.reduce((s, p) => s + p.longitude, 0) / c.points.length,
  }));
}

const clusterSize = (count: number) => (count < 5 ? 36 : count < 10 ? 42 : 48);
const POINT_RADIUS = 8;
const clusterId = (c: Cluster) => c.points.map((p) => p.id).join("-");

function clusterIcon(count: number, selected: boolean) {
  const size = clusterSize(count);
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#7a3f7a;color:#fff;border:3px solid #fff;`
      + `box-shadow:0 0 0 ${selected ? 5 : 4}px ${selected ? "rgba(217,119,6,.55)" : "rgba(122,63,122,.28)"};`
      + `display:flex;align-items:center;justify-content:center;font:700 13px/1 var(--font-jakarta),system-ui,sans-serif"`
      + ` aria-label="${count} opportunités">${count}</div>`,
  });
}

function PointPopup({ p }: { p: MapPoint }) {
  const color = sectorColor(p.sectorSlug);
  return (
    <div className="min-w-48 space-y-1 font-sans">
      <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color }}>{p.sector}</p>
      <p className="text-sm leading-snug font-semibold">{p.title}</p>
      <p className="text-xs text-slate-500">{[p.district, p.region].filter(Boolean).join(", ")}</p>
      <p className="text-sm font-bold">{formatAmount(p.estimatedInvestment, p.currency)}</p>
      <Link to={`/opportunites/${p.slug}`} className="text-xs font-semibold text-primary underline">
        Voir le projet →
      </Link>
    </div>
  );
}

function ClusterPopup({ cluster, onClose }: { cluster: Cluster; onClose: () => void }) {
  const map = useMap();
  const bounds = L.latLngBounds(cluster.points.map((p) => [p.latitude, p.longitude] as [number, number]));
  // Projets au même endroit (ou presque) : zoomer ne les séparerait pas, la liste suffit
  const canZoom = bounds.getNorthEast().distanceTo(bounds.getSouthWest()) > 300;
  const regions = [...new Set(cluster.points.map((p) => p.district ?? p.region))];
  return (
    <div className="w-64 font-sans">
      <p className="text-sm font-semibold">{cluster.points.length} opportunités dans cette zone</p>
      <p className="mb-2 truncate text-xs text-slate-500">{regions.join(", ")}</p>
      <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
        {cluster.points.map((p) => (
          <li key={p.id}>
            <Link to={`/opportunites/${p.slug}`} className="flex items-start gap-2 rounded px-1.5 py-1.5 text-slate-900 no-underline hover:bg-slate-100">
              <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: sectorColor(p.sectorSlug) }} />
              <span className="min-w-0 flex-1">
                <span className="block text-xs leading-snug font-semibold">{p.title}</span>
                <span className="block text-[11px] text-slate-500">{p.sector} · {formatAmount(p.estimatedInvestment, p.currency)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {canZoom && (
        <button
          type="button"
          onClick={() => { onClose(); map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 }); }}
          className="mt-2 w-full rounded bg-primary px-2 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
        >
          Zoomer sur la zone
        </button>
      )}
    </div>
  );
}

function ClusterLayer({ points, selectedId, onSelect }: {
  points: Located[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  // Groupe ou projet dont la fiche est ouverte (identifié par ses projets)
  const [openId, setOpenId] = useState<string | null>(null);
  const close = useCallback(() => setOpenId(null), []);
  useMapEvents({ zoomstart: close, click: close, zoomend: () => setZoom(map.getZoom()) });
  const clusters = useMemo(() => buildClusters(map, zoom, points), [map, zoom, points]);
  // Fiche fermée d'office si le groupe n'existe plus (filtres, nouveau regroupement)
  const open = openId ? clusters.find((c) => clusterId(c) === openId) : undefined;

  const markers = clusters.map((c) => {
    if (c.points.length === 1) {
      const p = c.points[0]!;
      const selected = p.id === selectedId;
      return (
        <CircleMarker
          key={p.id}
          center={[p.latitude, p.longitude]}
          radius={selected ? 11 : POINT_RADIUS}
          pathOptions={{ color: "#fff", weight: 2, fillColor: sectorColor(p.sectorSlug), fillOpacity: 0.95 }}
          bubblingMouseEvents={false}
          eventHandlers={{ click: () => { onSelect?.(p.id); setOpenId(clusterId(c)); } }}
        />
      );
    }
    const selected = c.points.some((p) => p.id === selectedId);
    return (
      <Marker
        key={`cluster-${c.points.map((p) => p.id).join("-")}`}
        position={[c.lat, c.lng]}
        icon={clusterIcon(c.points.length, selected)}
        keyboard
        title={`${c.points.length} opportunités`}
        eventHandlers={{ click: () => setOpenId(clusterId(c)) }}
      />
    );
  });

  return (
    <>
      {markers}
      {open && (
        <MapCard
          key={clusterId(open)}
          latlng={[open.lat, open.lng]}
          gap={(open.points.length > 1 ? clusterSize(open.points.length) / 2 + 4 : POINT_RADIUS + 3) + 8}
          label={open.points.length > 1 ? `${open.points.length} opportunités dans cette zone` : open.points[0]!.title}
          onClose={close}
        >
          {open.points.length > 1 ? <ClusterPopup cluster={open} onClose={close} /> : <PointPopup p={open.points[0]!} />}
        </MapCard>
      )}
    </>
  );
}

export default function OpportunityMap({
  points, selectedId, onSelect, className = "h-[520px]", interactive = true, maxZoom,
}: {
  points: MapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
  interactive?: boolean;
  maxZoom?: number;
}) {
  const located = useMemo(
    () => points.filter((p): p is Located => p.latitude != null && p.longitude != null),
    [points],
  );
  // Carte limitée à la province de Toliara (étendue si un projet se trouve en dehors)
  const area = useMemo(() => areaFor(located.map((p) => [p.latitude, p.longitude])), [located]);
  return (
    <SafeMapContainer
      center={PROVINCE_BOUNDS.getCenter()}
      zoom={6}
      area={area}
      options={{ scrollWheelZoom: interactive, dragging: interactive }}
      className={`z-0 w-full rounded-lg ${className}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ProvinceLayer />
      <FitBounds points={points} maxZoom={maxZoom} />
      <ClusterLayer points={located} selectedId={selectedId} onSelect={onSelect} />
    </SafeMapContainer>
  );
}
