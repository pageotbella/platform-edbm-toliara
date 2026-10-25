import { api, del, get, patch, post } from "@/lib/api";
import type { DocumentList, OpportunityMedia, RecentDocument, StaffDocument } from "@/types";

export type DocumentFilters = {
  q?: string;
  opportunityId?: string;
  visibility?: "public" | "prive";
  page?: number;
  pageSize?: number;
};

export type DocumentUpdate = { id: string; name?: string; type?: string; isPublic?: boolean };

export type UploadInput = {
  file: File;
  opportunityId: string;
  kind: "image" | "document";
  name?: string;
  type?: string;
  isPublic?: boolean;
};

export const documentsApi = {
  list: (filters: DocumentFilters) => get<DocumentList>("/documents", filters),
  recent: () => get<RecentDocument[]>("/documents/recent"),
  update: ({ id, ...data }: DocumentUpdate) => patch(`/documents/${id}`, data),
  remove: ({ id }: { id: string }) => del(`/documents/${id}`),
  // Galerie d'images
  updateMedia: ({ id, title }: { id: string; title: string }) => patch(`/media/${id}`, { title }),
  setCover: ({ id }: { id: string }) => post(`/media/${id}/cover`),
  removeMedia: ({ id }: { id: string }) => del(`/media/${id}`),
  // Téléversement (multipart) : vérification d'extension, de taille et de contenu côté serveur
  upload: ({ file, ...fields }: UploadInput) => {
    const form = new FormData();
    form.append("file", file);
    for (const [k, v] of Object.entries(fields)) if (v !== undefined) form.append(k, String(v));
    return api.post<OpportunityMedia | StaffDocument>("/upload", form).then((r) => r.data);
  },
};
