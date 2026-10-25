import { del, get, patch, post, put } from "@/lib/api";
import type {
  FilterOptions, KeyFigures, MapData, OpportunityCardData, OpportunityDetail, OpportunityList, OpportunityOption,
  PendingOpportunity, StaffOpportunity, StaffOpportunityList,
} from "@/types";
import type { OpportunityStatus } from "@/config/constants";
import type { OpportunityFilters, OpportunityInput, StaffListInput } from "./schemas";

export const opportunitiesApi = {
  // Catalogue public (opportunités publiées uniquement)
  list: (filters: OpportunityFilters) => get<OpportunityList>("/opportunities", filters),
  mapPoints: (filters: Partial<OpportunityFilters>) => get<OpportunityCardData[]>("/opportunities/map-points", filters),
  map: () => get<MapData>("/opportunities/map"),
  filterOptions: () => get<FilterOptions>("/opportunities/filter-options"),
  featured: (limit: number) => get<OpportunityCardData[]>("/opportunities/featured", { limit }),
  keyFigures: () => get<KeyFigures>("/opportunities/key-figures"),
  detail: (slug: string) => get<OpportunityDetail>(`/opportunities/${slug}`),
  trackView: ({ id }: { id: string }) => post(`/opportunities/${id}/views`),

  // Espace EDBM : tous statuts
  staffList: (input: StaffListInput) => get<StaffOpportunityList>("/staff/opportunities", input),
  staffById: (id: string) => get<StaffOpportunity>(`/staff/opportunities/${id}`),
  pending: () => get<PendingOpportunity[]>("/staff/opportunities/pending"),
  options: () => get<OpportunityOption[]>("/staff/opportunities/options"),
  create: (data: OpportunityInput) => post<{ id: string; reference: string | null }>("/staff/opportunities", data),
  update: ({ id, data }: { id: string; data: OpportunityInput }) => put(`/staff/opportunities/${id}`, data),
  changeStatus: ({ id, status }: { id: string; status: OpportunityStatus }) =>
    patch<{ id: string; status: OpportunityStatus }>(`/staff/opportunities/${id}/status`, { status }),
  remove: ({ id }: { id: string }) => del(`/staff/opportunities/${id}`),
};
