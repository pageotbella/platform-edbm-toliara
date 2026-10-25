import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { type ApiMutationOptions, type QueryOptions, useApiMutation } from "@/lib/query";
import type { FavoriteRow } from "@/types";
import { favoritesApi } from "./api";

export const useFavoriteList = (options?: QueryOptions<FavoriteRow[]>) =>
  useQuery({ queryKey: ["favorites", "list"], queryFn: favoritesApi.list, ...options });

// Session + identifiants favoris : seuls les investisseurs ont des favoris
export function useFavorites() {
  const { data: session } = useSession();
  const isInvestor = session?.user.role === "investisseur";
  const { data: ids } = useQuery({ queryKey: ["favorites", "ids"], queryFn: favoritesApi.ids, enabled: isInvestor });
  return { session, isInvestor, ids: new Set(ids ?? []) };
}

export const useToggleFavorite = (options?: ApiMutationOptions<typeof favoritesApi.toggle>) =>
  useApiMutation(favoritesApi.toggle, [["favorites"], ["stats", "investor"]], {
    onSuccess: ({ favorited }) => toast.success(favorited ? "Ajouté à vos favoris" : "Retiré de vos favoris"),
    onError: (e) => toast.error(e.message),
    ...options,
  });
