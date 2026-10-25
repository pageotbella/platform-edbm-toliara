import { useQuery } from "@tanstack/react-query";
import type { RequestStatus } from "@/config/constants";
import { type ApiMutationOptions, type QueryOptions, useApiMutation } from "@/lib/query";
import type { InterestRequestRow, MyRequestDetail, StaffRequestDetail, StaffRequestList } from "@/types";
import { interestRequestsApi, type StaffRequestFilters } from "./api";

// ── Investisseur ──────────────────────────────────────────────

export const useMyRequests = (input?: { status?: RequestStatus }, options?: QueryOptions<InterestRequestRow[]>) =>
  useQuery({
    queryKey: ["interest-requests", "mine", input?.status ?? null],
    queryFn: () => interestRequestsApi.mine(input?.status),
    ...options,
  });

export const useMyRequest = (input: { id: string }, options?: QueryOptions<MyRequestDetail>) =>
  useQuery({
    queryKey: ["interest-requests", "mine", "detail", input.id],
    queryFn: () => interestRequestsApi.mineById(input.id),
    retry: false,
    ...options,
  });

// ── Espace EDBM ───────────────────────────────────────────────

export const useStaffRequests = (input?: StaffRequestFilters, options?: QueryOptions<StaffRequestList>) =>
  useQuery({
    queryKey: ["interest-requests", "staff", input ?? {}],
    queryFn: () => interestRequestsApi.staffList(input ?? {}),
    ...options,
  });

export const useStaffRequest = (input: { id: string }, options?: QueryOptions<StaffRequestDetail>) =>
  useQuery({
    queryKey: ["interest-requests", "staff", "detail", input.id],
    queryFn: () => interestRequestsApi.staffById(input.id),
    ...options,
  });

// Une demande modifie aussi les compteurs (menu, tableaux de bord, notifications)
const AFFECTED = [["interest-requests"], ["staff"], ["stats"], ["notifications"]];

export const useCreateInterestRequest = (options?: ApiMutationOptions<typeof interestRequestsApi.create>) =>
  useApiMutation(interestRequestsApi.create, AFFECTED, options);

export const useTakeRequest = (options?: ApiMutationOptions<typeof interestRequestsApi.take>) =>
  useApiMutation(interestRequestsApi.take, AFFECTED, options);

export const useProcessRequest = (options?: ApiMutationOptions<typeof interestRequestsApi.process>) =>
  useApiMutation(interestRequestsApi.process, AFFECTED, options);
