import L from "leaflet";
import { PROVINCE_BBOX } from "./province-geo";

/**
 * Emprise de l'ancienne province de Toliara (Sud-Ouest) : régions Atsimo-Andrefana, Menabe, Androy et Anosy.
 * Les cartes de la plateforme sont cadrées et limitées à cette zone.
 */
const [west, south, east, north] = PROVINCE_BBOX;
export const PROVINCE_BOUNDS = L.latLngBounds([south, west], [north, east]);

/** Emprise de la province, étendue si des points se trouvent en dehors (ils restent ainsi accessibles). */
export function areaFor(coords: [number, number][]) {
  const bounds = L.latLngBounds(PROVINCE_BOUNDS.getSouthWest(), PROVINCE_BOUNDS.getNorthEast());
  for (const c of coords) bounds.extend(c);
  return bounds;
}
