import { z } from "zod";
import { opportunityStatusValues } from "@/db/schema";

// Portefeuille de l'espace EDBM (même règles que staffListSchema côté client)
export const staffListQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(opportunityStatusValues).optional(),
  sectorId: z.uuid().optional(),
  regionId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});
export type StaffListQuery = z.infer<typeof staffListQuerySchema>;
