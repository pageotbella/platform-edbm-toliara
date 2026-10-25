import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { type ApiMutationOptions, type QueryOptions, useApiMutation } from "@/lib/query";
import type { AgentPermissions, StaffMe, UserList } from "@/types";
import { usersApi, type UserFilters } from "./api";

// Agent ou administrateur connecté : permissions « selon permission » et nouvelles demandes
export function useStaffMe(options?: QueryOptions<StaffMe>) {
  const { data: session } = useSession();
  const isStaff = session?.user.role === "agent" || session?.user.role === "admin";
  return useQuery({
    queryKey: ["staff", "me"],
    queryFn: usersApi.staffMe,
    refetchInterval: 60_000,
    ...options,
    enabled: isStaff && (options?.enabled ?? true),
  });
}

export const useUsers = (input: UserFilters, options?: QueryOptions<UserList>) =>
  useQuery({
    queryKey: ["users", "list", input],
    queryFn: () => usersApi.list(input),
    placeholderData: keepPreviousData,
    ...options,
  });

export const useAgents = (options?: QueryOptions<AgentPermissions[]>) =>
  useQuery({ queryKey: ["users", "agents"], queryFn: usersApi.agents, ...options });

const AFFECTED = [["users"], ["stats"]];

export const useCreateUser = (options?: ApiMutationOptions<typeof usersApi.create>) =>
  useApiMutation(usersApi.create, AFFECTED, options);

export const useUpdateUser = (options?: ApiMutationOptions<typeof usersApi.update>) =>
  useApiMutation(usersApi.update, AFFECTED, options);

export const useSetUserStatus = (options?: ApiMutationOptions<typeof usersApi.setStatus>) =>
  useApiMutation(usersApi.setStatus, AFFECTED, options);

// Renvoie le lien « Définir mon mot de passe » par e-mail
export const useResendInvite = (options?: ApiMutationOptions<typeof usersApi.resendInvite>) =>
  useApiMutation(usersApi.resendInvite, [], options);

export const useResetPassword = (options?: ApiMutationOptions<typeof usersApi.resetPassword>) =>
  useApiMutation(usersApi.resetPassword, [], options);

export const useSetPermissions = (options?: ApiMutationOptions<typeof usersApi.setPermissions>) =>
  useApiMutation(usersApi.setPermissions, AFFECTED, options);
