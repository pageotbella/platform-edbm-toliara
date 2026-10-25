import {
  AlertTriangle, ArrowRight, BadgeCheck, CircleDashed, Download, Eye, FilePlus2, FileText, FolderKanban, Hourglass,
  Inbox, PenLine, Send, TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/page-header";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { Panel, PanelLink } from "@/components/common/panel";
import { StatusBadge } from "@/components/common/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { fileUrl, formatAmount, formatNumber, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useStatsOverview } from "@/features/stats/hooks";
import { usePendingOpportunities } from "@/features/opportunities/hooks";
import { useStaffRequests } from "@/features/interest-requests/hooks";
import { useRecentDocuments } from "@/features/documents/hooks";
import { HBarChart, MonthlyAreaChart } from "./charts";

// Tableau de bord EDBM (section 20 ; maquette « agent_tableau_de_bord_operationnel »)
export function StaffDashboard({ base = "/edbm" }: { base?: string }) {
  const { data: session } = useSession();
  const stats = useStatsOverview({ months: 12 });
  const pending = usePendingOpportunities();
  const requests = useStaffRequests({ status: "nouvelle" });
  const docs = useRecentDocuments();
  const s = stats.data;
  if (!s) return <PageSkeleton />;
  const o = s.opportunities;
  const newRequests = requests.data?.items ?? [];
  const late = newRequests.filter((r) => r.late);

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Espace EDBM" }, { label: "Tableau de bord" }]}
        eyebrow={session ? `Agent : ${session.user.name}` : undefined}
        title="Tableau de bord — Antenne régionale EDBM Toliara"
        description="Pilotage des opportunités, suivi des consultations et traitement des demandes d'intérêt des investisseurs."
        actions={
          <>
            <Link to={`${base}/opportunites/nouvelle`} className={cn(buttonVariants(), "h-10 px-4")}><FilePlus2 /> Créer une opportunité</Link>
            <Link to={`${base}/demandes`} className={cn(buttonVariants({ variant: "outline" }), "h-10 bg-white px-4")}><Inbox /> Demandes</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Opportunités" value={o.total} icon={FolderKanban} hint={`${o.archivee} archivée(s) · ${o.suspendue} suspendue(s)`} />
        <KpiCard label="Publiées" value={o.publiee} icon={BadgeCheck} hint={`${formatAmount(s.totals.investment)} au catalogue`} />
        <KpiCard label="Brouillons" value={o.brouillon} icon={PenLine} accent="ochre" />
        <KpiCard label="En attente de validation" value={o.en_verification + o.validee} icon={Hourglass} accent="secondary" hint={`${o.en_verification} à vérifier · ${o.validee} validée(s)`} />
        <KpiCard label="Demandes d'intérêt" value={s.requests.total} icon={Send} accent="secondary" />
        <KpiCard label="Non traitées" value={s.requests.nouvelle} icon={Inbox} accent={s.requests.nouvelle ? "destructive" : "primary"} hint="Demandes au statut « Nouvelle »" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <Panel title="Évolution des demandes d'intérêt" icon={TrendingUp} description="Demandes reçues par mois (12 derniers mois)" action={<PanelLink href={`${base}/statistiques`}>Statistiques</PanelLink>}>
            <MonthlyAreaChart data={s.monthly} label="Demandes" />
          </Panel>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Opportunités par secteur" description="Tous statuts confondus">
              <HBarChart data={s.bySector} label="Opportunités" />
            </Panel>
            <Panel title="Opportunités par région">
              <HBarChart data={s.byRegion} label="Opportunités" />
            </Panel>
          </div>
          <Panel title="Opportunités les plus consultées" icon={Eye} description={`${formatNumber(s.totals.views)} consultations au total · ${formatNumber(s.totals.views30)} sur 30 jours`} bodyClassName="p-2">
            <ol className="space-y-1">
              {s.topViewed.map((t, i) => (
                <li key={t.id}>
                  <Link to={`${base}/opportunites/${t.id}`} className="flex items-center gap-3 rounded-md p-3 transition hover:bg-muted">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded bg-surface-low text-xs font-bold text-secondary">#{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="label-caps block text-ochre">{t.sector}</span>
                      <span className="block truncate font-semibold">{t.title}</span>
                    </span>
                    <span className="text-right">
                      <span className="tabular block text-sm font-bold">{formatNumber(t.views)} vues</span>
                      <span className="label-caps block text-[10px] text-muted-foreground">{t.requests} demande(s)</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Actions prioritaires" icon={AlertTriangle} bodyClassName="space-y-3">
            {late.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <p className="label-caps text-red-700">Délai dépassé (&gt; 48 h)</p>
                <p className="mt-1 text-sm text-red-900">{late.length} demande(s) sans traitement : {late.slice(0, 2).map((r) => r.company ?? r.lastName).join(", ")}{late.length > 2 ? "…" : ""}</p>
                <Link to={`${base}/demandes`} className={cn(buttonVariants({ size: "sm" }), "mt-3 bg-red-700 hover:bg-red-800")}>Traiter maintenant <ArrowRight /></Link>
              </div>
            )}
            {newRequests.length > 0 && (
              <div className="rounded-md border bg-surface-low/60 p-4">
                <p className="label-caps text-secondary">Nouvelles demandes</p>
                <ul className="mt-2 space-y-2">
                  {newRequests.slice(0, 3).map((r) => (
                    <li key={r.id}>
                      <Link to={`${base}/demandes/${r.id}`} className="block rounded p-1 text-sm hover:bg-white">
                        <span className="font-semibold">{r.company ?? `${r.firstName} ${r.lastName}`}</span>
                        <span className="block truncate text-xs text-muted-foreground">{r.opportunity} · {timeAgo(r.createdAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(pending.data ?? []).map((p) => (
              <Link key={p.id} to={`${base}/opportunites/${p.id}`} className="block rounded-md border p-4 transition hover:border-border-strong">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge kind="opportunity" status={p.status} />
                  <span className="text-[11px] text-muted-foreground">{timeAgo(p.updatedAt)}</span>
                </div>
                <p className="mt-2 text-sm font-semibold">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.status === "validee" ? "Prête à être publiée" : "À vérifier et valider"} · {p.reference}</p>
              </Link>
            ))}
            {!late.length && !newRequests.length && !pending.data?.length && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><CircleDashed className="size-4" /> Aucune action en attente.</p>
            )}
          </Panel>

          <Panel title="Secteurs les plus consultés" icon={Eye}>
            <HBarChart data={s.sectorViews} label="Consultations" max={6} />
          </Panel>

          <Panel title="Derniers documents ajoutés" icon={FileText} action={<PanelLink href={`${base}/documents`}>Tous les documents</PanelLink>} bodyClassName="p-3">
            {docs.data?.length ? (
              <ul className="space-y-2">
                {docs.data.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 rounded-md bg-surface-low/60 p-2.5">
                    <span className="label-caps flex h-9 w-10 shrink-0 items-center justify-center rounded bg-red-50 text-red-700">{d.fileKey.split(".").pop()?.toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{d.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{d.type} · {d.opportunity}</span>
                    </span>
                    <a href={fileUrl(d.fileKey)} target="_blank" rel="noopener" className="text-secondary hover:text-primary" aria-label="Télécharger"><Download className="size-4" /></a>
                  </li>
                ))}
              </ul>
            ) : <p className="p-2 text-sm text-muted-foreground">Aucun document pour le moment.</p>}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
