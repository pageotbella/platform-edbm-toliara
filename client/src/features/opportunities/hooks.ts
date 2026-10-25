import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { type ApiMutationOptions, type QueryOptions, useApiMutation } from "@/lib/query";
import type {
  FilterOptions, MapData, OpportunityCardData, OpportunityDetail, OpportunityList, OpportunityOption,
  PendingOpportunity, StaffOpportunity, StaffOpportunityList,
} from "@/types";
import { opportunitiesApi } from "./api";
import type { OpportunityFilters, StaffListInput } from "./schemas";

// ── Public ────────────────────────────────────────────────────

export const useOpportunities = (filters: OpportunityFilters, options?: QueryOptions<OpportunityList>) =>
  useQuery({
    queryKey: ["opportunities", "list", filters],
    queryFn: () => opportunitiesApi.list(filters),
    placeholderData: keepPreviousData,
    ...options,
  });

export const useMapPoints = (filters: Partial<OpportunityFilters>, options?: QueryOptions<OpportunityCardData[]>) =>
  useQuery({ queryKey: ["opportunities", "map-points", filters], queryFn: () => opportunitiesApi.mapPoints(filters), ...options });

export const useMapData = (options?: QueryOptions<MapData>) =>
  useQuery({ queryKey: ["opportunities", "map"], queryFn: opportunitiesApi.map, ...options });

export const useFilterOptions = (options?: QueryOptions<FilterOptions>) =>
  useQuery({ queryKey: ["opportunities", "filter-options"], queryFn: opportunitiesApi.filterOptions, ...options });

export const useFeaturedOpportunities = (limit = 3) =>
  useQuery({ queryKey: ["opportunities", "featured", limit], queryFn: () => opportunitiesApi.featured(limit) });

export const useKeyFigures = () => useQuery({ queryKey: ["opportunities", "key-figures"], queryFn: opportunitiesApi.keyFigures });

export const useOpportunity = (slug: string, options?: QueryOptions<OpportunityDetail>) =>
  useQuery({ queryKey: ["opportunities", "detail", slug], queryFn: () => opportunitiesApi.detail(slug), retry: false, ...options });

// Statistique de consultation : n'invalide rien
export const useTrackView = (options?: ApiMutationOptions<typeof opportunitiesApi.trackView>) =>
  useApiMutation(opportunitiesApi.trackView, [], options);

// ── Espace EDBM ───────────────────────────────────────────────

export const useStaffOpportunities = (input: StaffListInput, options?: QueryOptions<StaffOpportunityList>) =>
  useQuery({
    queryKey: ["opportunities", "staff", "list", input],
    queryFn: () => opportunitiesApi.staffList(input),
    placeholderData: keepPreviousData,
    ...options,
  });

export const useStaffOpportunity = (input: { id: string }, options?: QueryOptions<StaffOpportunity>) =>
  useQuery({ queryKey: ["opportunities", "staff", "detail", input.id], queryFn: () => opportunitiesApi.staffById(input.id), ...options });

export const usePendingOpportunities = (options?: QueryOptions<PendingOpportunity[]>) =>
  useQuery({ queryKey: ["opportunities", "staff", "pending"], queryFn: opportunitiesApi.pending, ...options });

export const useOpportunityOptions = (options?: QueryOptions<OpportunityOption[]>) =>
  useQuery({ queryKey: ["opportunities", "staff", "options"], queryFn: opportunitiesApi.options, ...options });

// Toute modification peut changer le catalogue public, le portefeuille, les statistiques et les compteurs
const AFFECTED = [["opportunities"], ["stats"], ["staff"]];

export const useCreateOpportunity = (options?: ApiMutationOptions<typeof opportunitiesApi.create>) =>
  useApiMutation(opportunitiesApi.create, AFFECTED, options);

export const useUpdateOpportunity = (options?: ApiMutationOptions<typeof opportunitiesApi.update>) =>
  useApiMutation(opportunitiesApi.update, AFFECTED, options);

export const useChangeOpportunityStatus = (options?: ApiMutationOptions<typeof opportunitiesApi.changeStatus>) =>
  useApiMutation(opportunitiesApi.changeStatus, AFFECTED, options);

export const useDeleteOpportunity = (options?: ApiMutationOptions<typeof opportunitiesApi.remove>) =>
  useApiMutation(opportunitiesApi.remove, AFFECTED, options);
