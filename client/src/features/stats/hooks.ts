import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { QueryOptions } from "@/lib/query";
import type { AdminStats, InvestorDashboard, StatsOverview } from "@/types";
import { statsApi } from "./api";

export const useStatsOverview = (input?: { months?: number }, options?: QueryOptions<StatsOverview>) =>
  useQuery({
    queryKey: ["stats", "overview", input?.months ?? 12],
    queryFn: () => statsApi.overview(input?.months ?? 12),
    placeholderData: keepPreviousData,
    ...options,
  });

export const useAdminStats = (options?: QueryOptions<AdminStats>) =>
  useQuery({ queryKey: ["stats", "admin"], queryFn: statsApi.admin, ...options });

export const useInvestorDashboard = (options?: QueryOptions<InvestorDashboard>) =>
  useQuery({ queryKey: ["stats", "investor"], queryFn: statsApi.investor, ...options });
