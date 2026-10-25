import { del, get, post, put } from "@/lib/api";
import type { Commune, District, ManagedRegion, OpportunityCardData, Region, RegionSummary, RegionTree } from "@/types";

export type RegionDetail = {
  region: Region;
  districts: (District & { communes: Commune[]; count: number })[];
  sectors: { name: string; count: number }[];
  items: OpportunityCardData[];
};

export type GeoLevel = "region" | "district" | "commune";

export const regionsApi = {
  // Arborescence publique Région → District → Commune (formulaires)
  tree: () => get<RegionTree[]>("/regions"),
  summary: () => get<RegionSummary[]>("/regions/summary"),
  detail: (id: string) => get<RegionDetail>(`/regions/${id}`),
  // Gestion (agents avec permission, administrateurs)
  manage: () => get<ManagedRegion[]>("/regions/manage"),
  saveRegion: ({ id, ...data }: { id?: string; name: string; code?: string }) =>
    id ? put<Region>(`/regions/${id}`, data) : post<Region>("/regions", data),
  saveDistrict: ({ id, regionId, name }: { id?: string; regionId: string; name: string }) =>
    id ? put<District>(`/districts/${id}`, { name }) : post<District>(`/regions/${regionId}/districts`, { name }),
  saveCommune: ({ id, districtId, name }: { id?: string; districtId: string; name: string }) =>
    id ? put<Commune>(`/communes/${id}`, { name }) : post<Commune>(`/districts/${districtId}/communes`, { name }),
  remove: ({ level, id }: { level: GeoLevel; id: string }) =>
    del(`/${{ region: "regions", district: "districts", commune: "communes" }[level]}/${id}`),
};
