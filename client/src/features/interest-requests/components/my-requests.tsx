import { ArrowRight, CheckCircle2, ClipboardList, Hourglass, Plus, Search, Send, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/page-header";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { SectorIcon } from "@/components/common/sector-icon";
import { StatusBadge } from "@/components/common/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/config/constants";
import { formatAmount, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMyRequests } from "../hooks";

const OPEN: RequestStatus[] = ["nouvelle", "en_cours", "contact_etabli", "en_attente"];

// « Mes demandes » : historique et suivi des demandes d'intérêt (sections 6.2 et 15)
export function RequestsView() {
  const { data, isPending } = useMyRequests();
  const [status, setStatus] = useState<RequestStatus | null>(null);
  const [q, setQ] = useState("");
  if (isPending || !data) return <PageSkeleton />;

  const count = (s: RequestStatus) => data.filter((r) => r.status === s).length;
  const needle = q.trim().toLowerCase();
  const items = data.filter((r) =>
    (!status || r.status === status)
    && (!needle || [r.opportunity, r.reference, r.region, r.district, r.sector].some((v) => v?.toLowerCase().includes(needle))),
  );
  const total = data.reduce((s, r) => s + (r.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Guichet unique régional · Toliara"
        title="Suivi de mes demandes d'intérêt"
        description="Suivez l'avancement de vos manifestations d'intérêt et les réponses de l'antenne EDBM Toliara."
        actions={
          <Link to="/investisseur/opportunites" className={cn(buttonVariants(), "h-10 px-4")}>
            <Plus /> Nouvelle demande
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Demandes déposées" value={data.length} icon={ClipboardList} hint={`Couvrant ${formatAmount(total)} cumulés`} />
        <KpiCard label="En traitement" value={data.filter((r) => OPEN.includes(r.status)).length} icon={Hourglass} accent="ochre" hint="Nouvelles, en cours ou en attente" />
        <KpiCard label="Contact établi" value={count("contact_etabli")} icon={Send} accent="secondary" />
        <KpiCard label="Traitées / clôturées" value={count("traitee") + count("cloturee")} icon={CheckCircle2} />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-card lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[null, ...(Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[])].map((s) => {
            const n = s ? count(s) : data.length;
            return (
              <button
                key={s ?? "all"}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition",
                  status === s ? "bg-primary text-white" : "text-secondary hover:bg-muted",
                )}
              >
                {s ? REQUEST_STATUS_LABELS[s] : "Toutes"}
                <span className={cn("rounded px-1.5 text-[10px]", status === s ? "bg-white/20" : "bg-surface-low")}>{n}</span>
              </button>
            );
          })}
        </div>
        <div className="relative lg:w-72">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un projet, une référence…" className="h-9 pl-9" />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Send}
          title={data.length ? "Aucune demande ne correspond" : "Vous n'avez encore envoyé aucune demande"}
          description={data.length ? "Modifiez le filtre ou la recherche." : "Depuis la fiche d'une opportunité, cliquez sur « Je suis intéressé »."}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id}>
              <Link
                to={`/investisseur/demandes/${r.id}`}
                className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-card transition hover:border-border-strong hover:shadow-hover md:flex-row md:items-center"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-low text-primary">
                  <SectorIcon slug={r.sectorSlug} className="size-5" />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge kind="request" status={r.status} />
                    <span className="text-xs text-muted-foreground">Réf. {r.reference ?? "—"} · déposée le {formatDate(r.createdAt)}</span>
                  </div>
                  <p className="truncate font-semibold">{r.opportunity}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.sector} · {[r.district, r.region].filter(Boolean).join(", ")}
                    {r.edbmResponse && <span className="ml-2 font-semibold text-primary">· Réponse de l&apos;EDBM disponible</span>}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-6 md:justify-end">
                  <div className="text-right">
                    <p className="label-caps flex items-center justify-end gap-1 text-muted-foreground"><Wallet className="size-3" /> Montant envisagé</p>
                    <p className="tabular text-lg font-bold">{formatAmount(r.amount, r.currency)}</p>
                  </div>
                  <span className="flex items-center gap-1 rounded bg-surface-low px-3 py-2 text-xs font-semibold text-secondary">
                    Consulter <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
