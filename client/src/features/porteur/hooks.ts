import { useQuery } from "@tanstack/react-query";
import { type ApiMutationOptions, type QueryOptions, useApiMutation } from "@/lib/query";
import type { PorteurProject, PorteurProjectRow } from "@/types";
import { porteurApi } from "./api";

export const useMyProjects = (options?: QueryOptions<PorteurProjectRow[]>) =>
  useQuery({ queryKey: ["porteur", "projects"], queryFn: porteurApi.list, ...options });

export const useMyProject = ({ id }: { id: string }, options?: QueryOptions<PorteurProject>) =>
  useQuery({ queryKey: ["porteur", "project", id], queryFn: () => porteurApi.byId(id), ...options });

const AFFECTED = [["porteur"], ["notifications"]];

export const useCreateProject = (options?: ApiMutationOptions<typeof porteurApi.create>) =>
  useApiMutation(porteurApi.create, AFFECTED, options);

export const useUpdateProject = (options?: ApiMutationOptions<typeof porteurApi.update>) =>
  useApiMutation(porteurApi.update, AFFECTED, options);

export const useSubmitProject = (options?: ApiMutationOptions<typeof porteurApi.submit>) =>
  useApiMutation(porteurApi.submit, AFFECTED, options);

export const useDeleteProject = (options?: ApiMutationOptions<typeof porteurApi.remove>) =>
  useApiMutation(porteurApi.remove, AFFECTED, options);
