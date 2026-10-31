import { del, get, patch, post, put } from "@/lib/api";
import type { PartnerProject } from "@/types";
import type { PartnerProjectOutput } from "./schemas";

export const partnerProjectsApi = {
  list: () => get<PartnerProject[]>("/partner-projects"),
  // Gestion (agents et administrateurs)
  manage: () => get<PartnerProject[]>("/partner-projects/manage"),
  save: ({ id, ...data }: PartnerProjectOutput & { id?: string }) =>
    id ? put<PartnerProject>(`/partner-projects/${id}`, data) : post<PartnerProject>("/partner-projects", data),
  setPublished: ({ id, isPublished }: { id: string; isPublished: boolean }) => patch(`/partner-projects/${id}/published`, { isPublished }),
  remove: (id: string) => del(`/partner-projects/${id}`),
};
