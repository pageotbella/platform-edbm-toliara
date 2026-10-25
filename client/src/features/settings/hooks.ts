import { useQuery } from "@tanstack/react-query";
import { DEFAULT_CONTACT } from "@/config/constants";
import { type ApiMutationOptions, type QueryOptions, useApiMutation } from "@/lib/query";
import type { ContactSettings } from "@/types";
import { settingsApi } from "./api";

export const useContactSettings = (options?: QueryOptions<ContactSettings & { updatedAt: string | null }>) =>
  useQuery({ queryKey: ["settings", "contact"], queryFn: settingsApi.contact, staleTime: 10 * 60_000, ...options });

// Coordonnées de l'EDBM pour l'en-tête et le pied de page : valeurs par défaut pendant le chargement
export function useContact(): ContactSettings {
  const { data } = useContactSettings();
  return { ...DEFAULT_CONTACT, ...data };
}

export const useUpdateContact = (options?: ApiMutationOptions<typeof settingsApi.updateContact>) =>
  useApiMutation(settingsApi.updateContact, [["settings"]], options);

export const useSendContactMessage = (options?: ApiMutationOptions<typeof settingsApi.sendMessage>) =>
  useApiMutation(settingsApi.sendMessage, [], options);
