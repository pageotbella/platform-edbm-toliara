import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { QueryOptions } from "@/lib/query";
import type { AuditList } from "@/types";
import { auditLogsApi, type AuditFilters } from "./api";

export const useAuditLogs = (
  input: AuditFilters & { page?: number; pageSize?: number },
  options?: QueryOptions<AuditList>,
) =>
  useQuery({
    queryKey: ["audit-logs", "list", input],
    queryFn: () => auditLogsApi.list(input),
    placeholderData: keepPreviousData,
    ...options,
  });
