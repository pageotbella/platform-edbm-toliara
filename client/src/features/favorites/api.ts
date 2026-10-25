import { get, post } from "@/lib/api";
import type { FavoriteRow } from "@/types";

export const favoritesApi = {
  list: () => get<FavoriteRow[]>("/favorites"),
  // Identifiants seuls, pour l'état des boutons cœur
  ids: () => get<string[]>("/favorites/ids"),
  toggle: ({ opportunityId }: { opportunityId: string }) =>
    post<{ favorited: boolean }>("/favorites/toggle", { opportunityId }),
};
