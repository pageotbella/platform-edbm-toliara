import { z } from "zod";

// Dates reçues en ISO dans la query string
export const auditFiltersSchema = z.object({
  q: z.string().trim().optional(),
  entity: z.string().optional(),
  userId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type AuditFilters = z.infer<typeof auditFiltersSchema>;

export const auditListQuerySchema = auditFiltersSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type AuditListQuery = z.infer<typeof auditListQuerySchema>;
