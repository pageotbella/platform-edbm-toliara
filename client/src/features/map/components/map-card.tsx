import L from "leaflet";
import { X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-leaflet";
import { cn } from "@/lib/utils";

type Side = "top" | "bottom" | "right" | "left";
type Placement = { x: number; y: number; side: Side; arrow: number; maxHeight: number };

const MARGIN = 8; // écart minimal avec les bords de la carte
const ORDER: Side[] = ["top", "bottom", "right", "left"];

/**
 * Choisit le côté du repère où la carte tient entièrement (au-dessus, en dessous, à droite, à gauche),
 * sinon celui qui offre le plus de place, puis la recadre dans les limites de la carte.
 */
function computePlacement(p: L.Point, w: number, h: number, size: L.Point, gap: number): Placement {
  const W = size.x, H = size.y;
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, Math.max(min, max)));
  const origin: Record<Side, { x: number; y: number }> = {
    top: { x: p.x - w / 2, y: p.y - gap - h },
    bottom: { x: p.x - w / 2, y: p.y + gap },
    right: { x: p.x + gap, y: p.y - h / 2 },
    left: { x: p.x - gap - w, y: p.y - h / 2 },
  };
  const room: Record<Side, number> = {
    top: (p.y - gap - MARGIN) / h,
    bottom: (H - p.y - gap - MARGIN) / h,
    right: (W - p.x - gap - MARGIN) / w,
    left: (p.x - gap - MARGIN) / w,
  };
  const fitsAcross = (s: Side) => (s === "top" || s === "bottom" ? w <= W - 2 * MARGIN : h <= H - 2 * MARGIN);
  const side = ORDER.find((s) => room[s] >= 1 && fitsAcross(s)) ?? ORDER.reduce((a, b) => (room[b] > room[a] ? b : a));
  const x = clamp(origin[side].x, MARGIN, W - w - MARGIN);
  const y = clamp(origin[side].y, MARGIN, H - h - MARGIN);
  const vertical = side === "top" || side === "bottom";
  // La flèche reste pointée sur le repère même quand la carte est décalée pour tenir dans le cadre
  const arrow = vertical ? clamp(p.x - x, 16, w - 16) : clamp(p.y - y, 16, h - 16);
  return { x, y, side, arrow, maxHeight: H - 2 * MARGIN };
}

const ARROW: Record<Side, string> = {
  top: "bottom-[-6px] -translate-x-1/2 border-r border-b",
  bottom: "top-[-6px] -translate-x-1/2 border-l border-t",
  right: "left-[-6px] -translate-y-1/2 border-l border-b",
  left: "right-[-6px] -translate-y-1/2 border-r border-t",
};

/**
 * Fiche ancrée sur un point de la carte, toujours entièrement visible : elle remplace la bulle Leaflet,
 * qui s'ouvre toujours au-dessus du repère et sortait du cadre (la carte, bornée à la province,
 * ne peut pas défiler pour la dégager).
 */
export function MapCard({ latlng, gap, label, onClose, children }: {
  latlng: L.LatLngExpression;
  /** Distance entre le centre du repère et la carte (rayon du repère + marge) */
  gap: number;
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const map = useMap();
  const ref = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [lat, lng] = (() => { const l = L.latLng(latlng); return [l.lat, l.lng]; })();

  const place = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const size = map.getSize();
    const p = map.latLngToContainerPoint([lat, lng]);
    // Repère sorti du cadre (déplacement de la carte) : la fiche se ferme
    if (p.x < 0 || p.y < 0 || p.x > size.x || p.y > size.y) return onClose();
    setPlacement(computePlacement(p, el.offsetWidth, el.offsetHeight, size, gap));
  }, [map, lat, lng, gap, onClose]);

  useLayoutEffect(place, [place]);

  useEffect(() => {
    const el = ref.current!;
    // Les clics et la molette dans la fiche ne déplacent ni ne zooment la carte
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
    const observer = new ResizeObserver(place);
    observer.observe(el);
    map.on("move resize", place);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      observer.disconnect();
      map.off("move resize", place);
      document.removeEventListener("keydown", onKey);
    };
  }, [map, place, onClose]);

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      className="absolute z-[1000] flex flex-col rounded-xl border bg-white p-4 pr-3 text-slate-900 shadow-overlay"
      style={{
        left: placement?.x ?? 0,
        top: placement?.y ?? 0,
        maxHeight: placement?.maxHeight,
        visibility: placement ? "visible" : "hidden",
      }}
    >
      {placement && (
        <span
          aria-hidden
          className={cn("absolute size-3 rotate-45 border-slate-200 bg-white", ARROW[placement.side])}
          style={placement.side === "top" || placement.side === "bottom" ? { left: placement.arrow } : { top: placement.arrow }}
        />
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        <X className="size-4" />
      </button>
      <div className="relative min-h-0 flex-1 overflow-y-auto pr-6">{children}</div>
    </div>,
    map.getContainer(),
  );
}
