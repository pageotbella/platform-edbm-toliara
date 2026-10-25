import { BarChart3, Eye, Heart, Layers, Send, Table2, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/page-header";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { Panel } from "@/components/common/panel";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/config/constants";
import { formatAmount, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useStatsOverview } from "@/features/stats/hooks";
import { HBarChart, MonthlyAreaChart } from "./charts";
import { spaceLabel } from "@/components/layouts/nav-config";

const PERIODS = [6, 12, 24] as const;

// Statistiques (section 27)
export function StatsView({ base = "/edbm" }: { base?: string }) {
  const [months, setMonths] = useState<(typeof PERIODS)[number]>(12);
  const { data: s } = useStatsOverview({ months });
  if (!s) return <PageSkeleton />;
  const requestRows = (Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[]).map((k) => ({ name: REQUEST_STATUS_LABELS[k], n: s.requests.byStatus[k] ?? 0 }));
  const periodTotal = s.monthly.reduce((t, m) => t + m.n, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: spaceLabel(base), href: base }, { label: "Statistiques" }]}
        title="Statistiques de la plateforme"
        description="Opportunités, consultations, favoris et demandes d'intérêt."
        actions={
          <div className="flex rounded-md border bg-white p-0.5" role="group" aria-label="Période">
            {PERIODS.map((p) => (
              <button key={p} type="button" onClick={() => setMonths(p)} aria-pressed={months === p}
                className={cn("rounded px-3 py-1.5 text-sm transition", months === p ? "bg-surface-low font-semibold text-primary" : "text-muted-foreground")}>
                {p} mois
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Opportunités" value={s.opportunities.total} icon={Layers} hint={`${s.opportunities.publiee} publiée(s)`} />
        <KpiCard label="Volume publié" value={formatAmount(s.totals.investment)} icon={TrendingUp} accent="ochre" />
        <KpiCard label="Consultations" value={formatNumber(s.totals.views)} icon={Eye} accent="secondary" hint={`${formatNumber(s.totals.views30)} sur 30 jours`} />
        <KpiCard label="Favoris" value={formatNumber(s.totals.favorites)} icon={Heart} />
        <KpiCard label="Demandes d'intérêt" value={s.requests.total} icon={Send} accent="secondary" hint={`${periodTotal} sur ${months} mois`} />
      </div>

      <Panel title="Évolution des demandes d'intérêt" icon={TrendingUp} description={`Demandes reçues par mois — ${months} derniers mois`}>
        <MonthlyAreaChart data={s.monthly} label="Demandes" className="h-72" />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Opportunités par secteur" icon={BarChart3}><HBarChart data={s.bySector} label="Opportunités" /></Panel>
        <Panel title="Opportunités par région" icon={BarChart3}><HBarChart data={s.byRegion} label="Opportunités" /></Panel>
        <Panel title="Secteurs les plus consultés" icon={Eye}><HBarChart data={s.sectorViews} label="Consultations" /></Panel>
        <Panel title="Demandes par statut" icon={Send}><HBarChart data={requestRows} label="Demandes" /></Panel>
      </div>

      <Panel title="Opportunités les plus consultées" icon={Table2} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="label-caps border-b bg-muted/50 text-left text-muted-foreground">
                <th className="px-5 py-3">#</th><th className="px-3 py-3">Opportunité</th><th className="px-3 py-3">Secteur</th>
                <th className="px-3 py-3 text-right">Consultations</th><th className="px-5 py-3 text-right">Demandes</th>
              </tr>
            </thead>
            <tbody>
              {s.topViewed.map((t, i) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="px-5 py-3 font-bold text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-3"><Link to={`${base}/opportunites/${t.id}`} className="font-semibold hover:text-primary">{t.title}</Link></td>
                  <td className="px-3 py-3 text-xs">{t.sector}</td>
                  <td className="tabular px-3 py-3 text-right font-bold">{formatNumber(t.views)}</td>
                  <td className="tabular px-5 py-3 text-right">{t.requests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
