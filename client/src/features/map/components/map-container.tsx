import { createLeafletContext, LeafletContext, type LeafletContextInterface } from "@react-leaflet/core";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";

/**
 * Remplace le `MapContainer` de react-leaflet 5.0.0, qui détruit la carte au nettoyage de son effet
 * sans jamais la recréer : en Strict Mode (dev) ou avec <Activity> (navigation Next 16), les couches
 * s'attachent alors à une carte supprimée (« Cannot read properties of undefined (reading 'appendChild') »).
 * Ici, la carte Leaflet est créée à chaque exécution de l'effet et détruite à chaque nettoyage.
 *
 * `area` (facultatif) limite la carte à une zone : cadrage initial, dézoom minimal et déplacement bornés.
 */
export function SafeMapContainer({
  center, zoom, area, options, className, children,
}: {
  center: L.LatLngExpression;
  zoom: number;
  area?: L.LatLngBounds;
  options?: L.MapOptions;
  className?: string;
  children?: React.ReactNode;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<LeafletContextInterface | null>(null);

  useEffect(() => {
    const node = nodeRef.current!;
    // Zoom fractionnaire : la zone remplit le cadre au lieu de s'arrêter au niveau entier inférieur
    const map = new L.Map(node, area ? { zoomSnap: 0.25, zoomDelta: 0.5, maxBoundsViscosity: 1, ...options } : options);
    let onResize: (() => void) | undefined;
    if (area) {
      // Le dézoom minimal montre toute la zone ; on ne peut pas faire glisser la carte au-delà
      const lockToArea = () => {
        map.setMinZoom(map.getBoundsZoom(area));
        map.setMaxBounds(area.pad(0.05));
      };
      map.fitBounds(area);
      lockToArea();
      onResize = lockToArea;
      map.on("resize", onResize);
    } else {
      map.setView(center, zoom);
    }
    // Le cadre peut changer de taille sans redimensionnement de la fenêtre (grille, chargement)
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(node);
    setContext(createLeafletContext(map));
    return () => {
      observer.disconnect();
      if (onResize) map.off("resize", onResize);
      setContext(null);
      map.remove();
    };
    // Options lues à la création seulement, comme le MapContainer d'origine
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={nodeRef} className={className}>
      {context && <LeafletContext value={context}>{children}</LeafletContext>}
    </div>
  );
}
