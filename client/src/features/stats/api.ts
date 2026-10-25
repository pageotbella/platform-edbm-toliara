import { get } from "@/lib/api";
import type { AdminStats, InvestorDashboard, StatsOverview } from "@/types";

export const statsApi = {
  // Agents et administrateurs (sections 20 et 27)
  overview: (months: number) => get<StatsOverview>("/stats/overview", { months }),
  // Administrateur (section 21)
  admin: () => get<AdminStats>("/stats/admin"),
  // Investisseur (section 19)
  investor: () => get<InvestorDashboard>("/stats/investor"),
};
