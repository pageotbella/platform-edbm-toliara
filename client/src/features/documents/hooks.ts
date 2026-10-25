import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { type ApiMutationOptions, type QueryOptions, useApiMutation } from "@/lib/query";
import type { DocumentList, RecentDocument } from "@/types";
import { documentsApi, type DocumentFilters } from "./api";

export const useDocuments = (input: DocumentFilters, options?: QueryOptions<DocumentList>) =>
  useQuery({
    queryKey: ["documents", "list", input],
    queryFn: () => documentsApi.list(input),
    placeholderData: keepPreviousData,
    ...options,
  });

export const useRecentDocuments = (options?: QueryOptions<RecentDocument[]>) =>
  useQuery({ queryKey: ["documents", "recent"], queryFn: documentsApi.recent, ...options });

// Documents et médias apparaissent aussi sur les fiches et dans le portefeuille
const AFFECTED = [["documents"], ["opportunities"]];

export const useUpdateDocument = (options?: ApiMutationOptions<typeof documentsApi.update>) =>
  useApiMutation(documentsApi.update, AFFECTED, options);

export const useDeleteDocument = (options?: ApiMutationOptions<typeof documentsApi.remove>) =>
  useApiMutation(documentsApi.remove, AFFECTED, options);

export const useUpdateMedia = (options?: ApiMutationOptions<typeof documentsApi.updateMedia>) =>
  useApiMutation(documentsApi.updateMedia, AFFECTED, options);

export const useSetCover = (options?: ApiMutationOptions<typeof documentsApi.setCover>) =>
  useApiMutation(documentsApi.setCover, AFFECTED, options);

export const useDeleteMedia = (options?: ApiMutationOptions<typeof documentsApi.removeMedia>) =>
  useApiMutation(documentsApi.removeMedia, AFFECTED, options);

export const useUpload = (options?: ApiMutationOptions<typeof documentsApi.upload>) =>
  useApiMutation(documentsApi.upload, AFFECTED, options);
