import { useQuery } from "@tanstack/react-query";
import { type ApiMutationOptions, type QueryOptions, useApiMutation } from "@/lib/query";
import type { PartnerProject } from "@/types";
import { partnerProjectsApi } from "./api";

export const usePartnerProjects = (options?: QueryOptions<PartnerProject[]>) =>
  useQuery({ queryKey: ["partner-projects", "list"], queryFn: partnerProjectsApi.list, ...options });

export const useManagedPartnerProjects = (options?: QueryOptions<PartnerProject[]>) =>
  useQuery({ queryKey: ["partner-projects", "manage"], queryFn: partnerProjectsApi.manage, ...options });

const AFFECTED = [["partner-projects"]];

export const useSavePartnerProject = (options?: ApiMutationOptions<typeof partnerProjectsApi.save>) =>
  useApiMutation(partnerProjectsApi.save, AFFECTED, options);

export const useSetPartnerProjectPublished = (options?: ApiMutationOptions<typeof partnerProjectsApi.setPublished>) =>
  useApiMutation(partnerProjectsApi.setPublished, AFFECTED, options);

export const useRemovePartnerProject = (options?: ApiMutationOptions<typeof partnerProjectsApi.remove>) =>
  useApiMutation(partnerProjectsApi.remove, AFFECTED, options);
