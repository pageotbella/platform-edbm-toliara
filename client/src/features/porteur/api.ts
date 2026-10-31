import { del, get, post, put } from "@/lib/api";
import type { PorteurProject, PorteurProjectRow } from "@/types";
import type { ProjectOutput } from "./schemas";

// Espace porteur de projet. Photos et documents : documentsApi (/upload, /media, /documents),
// ouverts au porteur pour ses propres projets.
export const porteurApi = {
  list: () => get<PorteurProjectRow[]>("/porteur/projets"),
  byId: (id: string) => get<PorteurProject>(`/porteur/projets/${id}`),
  create: (data: ProjectOutput) => post<{ id: string }>("/porteur/projets", data),
  update: ({ id, data }: { id: string; data: ProjectOutput }) => put(`/porteur/projets/${id}`, data),
  submit: (id: string) => post(`/porteur/projets/${id}/soumettre`),
  remove: (id: string) => del(`/porteur/projets/${id}`),
};
