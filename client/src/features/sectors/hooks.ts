import { useQuery } from "@tanstack/react-query";
import { type ApiMutationOptions, type QueryOptions, useApiMutation } from "@/lib/query";
import type { ManagedSector, Sector } from "@/types";
import { sectorsApi } from "./api";

export const useSectors = (options?: QueryOptions<Sector[]>) =>
  useQuery({ queryKey: ["sectors", "list"], queryFn: sectorsApi.list, ...options });

export const useSectorsSummary = () => useQuery({ queryKey: ["sectors", "summary"], queryFn: sectorsApi.summary });

export const useSector = (slug: string) =>
  useQuery({ queryKey: ["sectors", "detail", slug], queryFn: () => sectorsApi.bySlug(slug), retry: false });

export const useManagedSectors = (options?: QueryOptions<ManagedSector[]>) =>
  useQuery({ queryKey: ["sectors", "manage"], queryFn: sectorsApi.manage, ...options });

// Les secteurs alimentent aussi le catalogue (filtres, cartes)
const AFFECTED = [["sectors"], ["opportunities"]];

export const useSaveSector = (options?: ApiMutationOptions<typeof sectorsApi.save>) =>
  useApiMutation(sectorsApi.save, AFFECTED, options);

export const useSetSectorActive = (options?: ApiMutationOptions<typeof sectorsApi.setActive>) =>
  useApiMutation(sectorsApi.setActive, AFFECTED, options);
