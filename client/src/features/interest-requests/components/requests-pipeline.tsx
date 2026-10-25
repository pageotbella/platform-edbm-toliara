import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Columns3, Inbox, ListChecks, Search, Send, Table2, Timer, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/page-header";
import { SimpleSelect } from "@/components/common/simple-select";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/config/constants";
import { formatAmount, formatDate, initials, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useOpportunityOptions } from "@/features/opportunities/hooks";
import { useStaffRequests, useTakeRequest } from "@/features/interest-requests/hooks";
import { RequestPanel } from "./request-panel";
import { spaceLabel } from "@/components/layouts/nav-config";

const COLUMNS = Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[];
const DOT: Record<RequestStatus, string> = {
  nouvelle: "bg-blue-500", en_cours: "bg-amber-500", contact_etabli: "bg-emerald-600",
  en_attente: "bg-slate-400", traitee: "bg-emerald-800", cloturee: "bg-slate-600",
};

// Pipeline des demandes d'intérêt (maquette « agent_traitement_du_pipeline… »)
export function RequestsPipeline({ base = "/edbm" }: { base?: string }) {
  const qc = useQueryClient();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [mine, setMine] = useState(false);
  const [opportunityId, setOpportunityId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const opportunities = useOpportunityOptions();
  const { data, isPending } = useStaffRequests({
    q: search || undefined, mine: mine || undefined, opportunityId: opportunityId ?? undefined,
  });
  const take = useTakeRequest({
    onSuccess: () => {
      toast.success("Demande prise en charge");
      qc.invalidateQueries({ queryKey: ["interest-requests"] });
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const items = data?.items ?? [];
  const counts = data?.counts ?? {};
  const total = Object.values(counts).reduce((s, n) => s + (n ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: spaceLabel(base), href: base }, { label: "Demandes d'intérêt" }]}
        title="Traitement des demandes d'intérêt"
        description="Prise en charge, prise de contact et suivi des manifestations d'intérêt des investisseurs."
        actions={
          <div className="flex rounded-md border bg-white p-0.5" role="group" aria-label="Affichage">
            {([["kanban", "Pipeline", Columns3], ["table", "Tableau", Table2]] as const).map(([v, label, Icon]) => (
              <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v}
                className={cn("flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition", view === v ? "bg-surface-low font-semibold text-primary" : "text-muted-foreground")}>
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Demandes reçues" value={total} icon={Inbox} />
        <KpiCard label="Nouvelles" value={counts.nouvelle ?? 0} icon={Send} accent={counts.nouvelle ? "destructive" : "primary"} hint="À prendre en charge" />
        <KpiCard label="En cours / en attente" value={(counts.en_cours ?? 0) + (counts.en_attente ?? 0)} icon={Timer} accent="ochre" />
        <KpiCard label="Contact établi" value={counts.contact_etabli ?? 0} icon={UserCheck} accent="secondary" />
        <KpiCard label="Traitées / clôturées" value={(counts.traitee ?? 0) + (counts.cloturee ?? 0)} icon={CheckCircle2} />
      </div>

      <div className="grid gap-3 rounded-lg border bg-card p-3 shadow-card md:grid-cols-[1.4fr_1fr_auto]">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Investisseur, entreprise, e-mail, projet, référence…" className="h-10 pl-9" />
        </div>
        <SimpleSelect value={opportunityId} onChange={setOpportunityId} allLabel="Toutes les opportunités"
          options={(opportunities.data ?? []).map((o) => ({ value: o.id, label: `${o.reference ?? ""} ${o.title}`.trim() }))} />
        <Button type="button" variant={mine ? "default" : "outline"} className="h-10" onClick={() => setMine((m) => !m)}>
          <ListChecks /> Mes dossiers
        </Button>
      </div>

      {isPending ? (
        <Skeleton className="h-96 rounded-lg" />
      ) : !items.length ? (
        <EmptyState icon={Inbox} title="Aucune demande" description="Aucune demande ne correspond aux filtres." />
      ) : view === "kanban" ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8">
          <div className="flex min-w-max gap-4">
            {COLUMNS.map((col) => {
              const cards = items.filter((r) => r.status === col);
              return (
                <section key={col} className="w-72 shrink-0 rounded-lg bg-surface-low p-3">
                  <h2 className="mb-3 flex items-center justify-between px-1 text-sm font-semibold">
                    <span className="flex items-center gap-2"><span className={cn("size-2 rounded-full", DOT[col])} />{REQUEST_STATUS_LABELS[col]}</span>
                    <span className="rounded bg-white px-1.5 text-xs text-muted-foreground">{cards.length}</span>
                  </h2>
                  <div className="space-y-3">
                    {cards.map((r) => (
                      <article key={r.id} className="rounded-lg border bg-white p-3 shadow-card transition hover:border-border-strong">
                        <button type="button" onClick={() => setOpenId(r.id)} className="w-full text-left">
                          <div className="flex items-start justify-between gap-2">
                            <span className="label-caps rounded bg-surface-low px-1.5 py-0.5 text-[9px] text-secondary">{r.sector}</span>
                            <span className="text-[11px] text-muted-foreground">{timeAgo(r.createdAt)}</span>
                          </div>
                          <p className="mt-2 font-semibold leading-snug">{r.company ?? `${r.firstName} ${r.lastName}`}</p>
                          <p className="text-xs text-muted-foreground">{[r.firstName, r.lastName].filter(Boolean).join(" ")}{r.country ? ` · ${r.country}` : ""}</p>
                          <p className="mt-2 line-clamp-2 rounded bg-surface-low/70 px-2 py-1.5 text-xs">{r.opportunity}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="tabular text-sm font-bold">{formatAmount(r.amount, r.currency)}</span>
                            {r.handledByName && (
                              <span title={`Suivie par ${r.handledByName}`} className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                                {initials(r.handledByName)}
                              </span>
                            )}
                          </div>
                        </button>
                        {col === "nouvelle" && (
                          <Button type="button" size="sm" className="mt-3 w-full" disabled={take.isPending} onClick={() => take.mutate({ id: r.id })}>
                            Prendre en charge
                          </Button>
                        )}
                      </article>
                    ))}
                    {!cards.length && <p className="px-1 py-4 text-center text-xs text-muted-foreground">Aucune demande</p>}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="label-caps border-b bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3">Investisseur</th>
                <th className="px-3 py-3">Opportunité</th>
                <th className="px-3 py-3 text-right">Montant</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-3 py-3">Suivi par</th>
                <th className="px-4 py-3">Reçue le</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} onClick={() => setOpenId(r.id)} className="cursor-pointer border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{r.company ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{[r.firstName, r.lastName].filter(Boolean).join(" ")} · {r.email}</p>
                  </td>
                  <td className="px-3 py-3"><p className="line-clamp-1">{r.opportunity}</p><p className="text-xs text-muted-foreground">{r.reference}</p></td>
                  <td className="tabular px-3 py-3 text-right font-bold">{formatAmount(r.amount, r.currency)}</td>
                  <td className="px-3 py-3"><StatusBadge kind="request" status={r.status} /></td>
                  <td className="px-3 py-3 text-xs">{r.handledByName ?? <span className="text-muted-foreground">Non attribuée</span>}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader><SheetTitle>Instruction de la demande</SheetTitle></SheetHeader>
          <div className="px-4 pb-6">{openId && <RequestPanel id={openId} base={base} />}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
