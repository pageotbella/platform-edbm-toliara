import { z } from "zod";
import { DOCUMENT_TYPES } from "@/config/constants";

// Champs multipart (toujours des chaînes)
export const uploadBodySchema = z.object({
  opportunityId: z.uuid("Opportunité invalide"),
  kind: z.enum(["image", "document"]).default("document"),
  name: z.string().trim().max(200).optional(),
  type: z.string().trim().optional(),
  isPublic: z.stringbool().default(true),
});
export type UploadBody = z.infer<typeof uploadBodySchema>;

export const fileParamsSchema = z.object({ key: z.array(z.string()).min(1) });
export const idParamsSchema = z.object({ id: z.uuid() });

export const listQuerySchema = z.object({
  q: z.string().trim().optional(),
  opportunityId: z.uuid().optional(),
  visibility: z.enum(["public", "prive"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(15),
});
export type DocumentListQuery = z.infer<typeof listQuerySchema>;

export const documentUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  type: z.enum(DOCUMENT_TYPES).optional(),
  isPublic: z.boolean().optional(),
});

export const mediaUpdateSchema = z.object({ title: z.string().trim().max(160) });
