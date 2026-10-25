import { useQuery } from "@tanstack/react-query";
import { type ApiMutationOptions, type QueryOptions, useApiMutation } from "@/lib/query";
import type { ManagedRegion, RegionTree } from "@/types";
import { regionsApi } from "./api";

// Arborescence publique (formulaires)
export const useRegions = (options?: QueryOptions<RegionTree[]>) =>
  useQuery({ queryKey: ["regions", "tree"], queryFn: regionsApi.tree, ...options });

export const useRegionsSummary = () => useQuery({ queryKey: ["regions", "summary"], queryFn: regionsApi.summary });

export const useRegion = (id: string) =>
  useQuery({ queryKey: ["regions", "detail", id], queryFn: () => regionsApi.detail(id), retry: false });

// Arborescence de gestion, avec le nombre d'opportunités à chaque niveau
export const useManagedRegions = (options?: QueryOptions<ManagedRegion[]>) =>
  useQuery({ queryKey: ["regions", "manage"], queryFn: regionsApi.manage, ...options });

// La géographie alimente aussi le catalogue (filtres)
const AFFECTED = [["regions"], ["opportunities"]];

export const useSaveRegion = (options?: ApiMutationOptions<typeof regionsApi.saveRegion>) =>
  useApiMutation(regionsApi.saveRegion, AFFECTED, options);

export const useSaveDistrict = (options?: ApiMutationOptions<typeof regionsApi.saveDistrict>) =>
  useApiMutation(regionsApi.saveDistrict, AFFECTED, options);

export const useSaveCommune = (options?: ApiMutationOptions<typeof regionsApi.saveCommune>) =>
  useApiMutation(regionsApi.saveCommune, AFFECTED, options);

export const useRemoveGeo = (options?: ApiMutationOptions<typeof regionsApi.remove>) =>
  useApiMutation(regionsApi.remove, AFFECTED, options);
