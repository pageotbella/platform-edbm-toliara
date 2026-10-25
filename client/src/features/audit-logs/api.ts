import { get } from "@/lib/api";
import type { AuditList, AuditRow } from "@/types";

export type AuditFilters = { q?: string; entity?: string; userId?: string; from?: string; to?: string };

export const auditLogsApi = {
  list: (filters: AuditFilters & { page?: number; pageSize?: number }) => get<AuditList>("/audit-logs", filters),
  // Export CSV : 2 000 lignes maximum, mêmes filtres que la liste
  export: (filters: AuditFilters) => get<AuditRow[]>("/audit-logs/export", filters),
};
