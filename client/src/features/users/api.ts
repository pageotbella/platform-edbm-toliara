import { get, patch, post, put } from "@/lib/api";
import type { Role } from "@/config/constants";
import type { AgentPermissions, Permissions, StaffMe, UserList } from "@/types";
import type { UserCreateInput, UserUpdateInput } from "./schemas";

export type UserFilters = { q?: string; role?: Role; status?: "actif" | "desactive"; page?: number; pageSize?: number };

export const usersApi = {
  // Agent ou administrateur connecté : permissions et compteur de nouvelles demandes
  staffMe: () => get<StaffMe>("/staff/me"),
  // Administration des comptes (section 22)
  list: (filters: UserFilters) => get<UserList>("/users", filters),
  create: (data: UserCreateInput) => post<{ id: string; emailSent: boolean }>("/users", data),
  resendInvite: (id: string) => post(`/users/${id}/invite`),
  update: ({ id, ...data }: UserUpdateInput) => put(`/users/${id}`, data),
  setStatus: ({ id, status }: { id: string; status: "actif" | "desactive" }) => patch(`/users/${id}/status`, { status }),
  resetPassword: ({ id, password }: { id: string; password: string }) => post(`/users/${id}/password`, { password }),
  // Rôles et permissions (section 7)
  agents: () => get<AgentPermissions[]>("/permissions/agents"),
  setPermissions: ({ userId, ...perms }: Permissions & { userId: string }) => put(`/permissions/${userId}`, perms),
};
