import { get, patch, post, put } from "@/lib/api";
import type { ManagedSector, OpportunityCardData, Sector, SectorSummary } from "@/types";

export type SectorInput = { id?: string; name: string; description?: string };

export const sectorsApi = {
  list: () => get<Sector[]>("/sectors"),
  summary: () => get<SectorSummary[]>("/sectors/summary"),
  bySlug: (slug: string) => get<{ sector: Sector; items: OpportunityCardData[] }>(`/sectors/${slug}`),
  // Gestion (agents avec permission, administrateurs)
  manage: () => get<ManagedSector[]>("/sectors/manage"),
  save: ({ id, ...data }: SectorInput) => (id ? put<Sector>(`/sectors/${id}`, data) : post<Sector>("/sectors", data)),
  setActive: ({ id, isActive }: { id: string; isActive: boolean }) => patch(`/sectors/${id}/active`, { isActive }),
};
