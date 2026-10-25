import { get, patch, post } from "@/lib/api";
import type { RequestStatus } from "@/config/constants";
import type { InterestRequestRow, MyRequestDetail, StaffRequestDetail, StaffRequestList } from "@/types";
import type { InterestRequestInput } from "./schemas";

export type StaffRequestFilters = { q?: string; status?: RequestStatus; opportunityId?: string; mine?: boolean };
export type ProcessInput = { id: string; status?: RequestStatus; edbmResponse?: string; internalNote?: string };

export const interestRequestsApi = {
  create: (data: InterestRequestInput) => post<{ id: string }>("/interest-requests", data),
  // Investisseur : ses propres demandes (sans les champs internes)
  mine: (status?: RequestStatus) => get<InterestRequestRow[]>("/interest-requests/mine", { status }),
  mineById: (id: string) => get<MyRequestDetail>(`/interest-requests/mine/${id}`),
  // Espace EDBM : traitement
  staffList: (filters: StaffRequestFilters) => get<StaffRequestList>("/interest-requests", filters),
  staffById: (id: string) => get<StaffRequestDetail>(`/interest-requests/${id}`),
  take: ({ id }: { id: string }) => post(`/interest-requests/${id}/take`),
  process: ({ id, ...data }: ProcessInput) => patch(`/interest-requests/${id}`, data),
};
