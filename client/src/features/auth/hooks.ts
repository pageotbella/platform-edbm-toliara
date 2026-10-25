import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { signOut } from "@/lib/auth-client";
import { type ApiMutationOptions, type QueryOptions, useApiMutation } from "@/lib/query";
import type { Profile } from "@/types";
import { profileApi } from "./api";

export const useProfile = (options?: QueryOptions<Profile>) =>
  useQuery({ queryKey: ["profile"], queryFn: profileApi.get, ...options });

export const useUpdateProfile = (options?: ApiMutationOptions<typeof profileApi.update>) =>
  useApiMutation(profileApi.update, [["profile"]], options);

// Déconnexion : vide le cache des données de l'utilisateur et revient à l'accueil
export function useSignOut() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return async () => {
    await signOut();
    qc.clear();
    navigate("/", { replace: true });
  };
}
