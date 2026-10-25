import { get, put } from "@/lib/api";
import type { Profile } from "@/types";
import type { ProfileUpdateInput } from "./profile-schemas";

// Profil de l'utilisateur connecté (tous rôles)
export const profileApi = {
  get: () => get<Profile>("/profile"),
  update: (data: ProfileUpdateInput) => put("/profile", data),
};
