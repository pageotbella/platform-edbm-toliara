import { spaceLabel } from "@/components/layouts/nav-config";
import { keepPreviousData } from "@tanstack/react-query";
import {
  Eye, ExternalLink, FilePlus2, FileText, Image as ImageIcon, MoreHorizontal, Pencil, Search, SearchX, Send, Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCard } from "@/components/common/kpi-card";
import { OpportunityCover } from "@/components/common/opportunity-cover";
import { PageHeader } from "@/components/common/page-header";
import { Pager } from "@/components/common/pager";
import { SimpleSelect } from "@/components/common/simple-select";
import { StatusBadge } from "@/components/common/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { OPPORTUNITY_STATUS_LABELS, type OpportunityStatus } from "@/config/constants";
import { formatAmount, formatDate } from "@/lib/format";
import { ACTION_LABELS, allowedTransitions } from "@/lib/opportunity-workflow";
import { cn } from "@/lib/utils";
import { useDeleteOpportunity, useFilterOptions, useStaffOpportunities } from "@/features/opportunities/hooks";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useChangeStatus, useStaffMe } from "@/features/users/staff-hooks";

const PAGE_SIZE = 10;
const TABS: (OpportunityStatus | null)[] = [null, "publiee", "en_verification", "validee", "brouillon", "suspendue", "archivee"];

// Portefeuille des opportunités (maquette « agent_gestion_du_portefeuille… », section 18)
export function Portfolio({ base = "/edbm" }: { base?: string }) {
  const me = useStaffMe().data;
  const [status, setStatus] = useState<OpportunityStatus | null>(null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [sectorId, setSectorId] = useState<string | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const options = useFilterOptions();
  const { data, isPending, isFetching } = useStaffOpportunities({
      q: search || undefined, status: status ?? undefined, sectorId: sectorId ?? undefined,
      regionId: regionId ?? undefined, page, pageSize: PAGE_SIZE,
    }, { placeholderData: keepPreviousData });
  const changeStatus = useChangeStatus();
  const remove = useDeleteOpportunity({
    onSuccess: () => toast.success("Opportunité supprimée"),
    onError: (e) => toast.error(e.message),
  });

  const counts = data?.statusCounts ?? {};
  const all = data?.all ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: spaceLabel(base), href: base }, { label: "Opportunités" }]}
        title="Portefeuille des opportunités"
        description="Création, modification et suivi du cycle de vie des projets avant publication ou archivage."
        actions={<Link to={`${base}/opportunites/nouvelle`} className={cn(buttonVariants(), "h-10 px-4")}><FilePlus2 /> Nouvelle opportunité</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Dossiers" value={all} icon={FileText} hint="Selon les filtres secteur / région" />
        <KpiCard label="Publiées" value={counts.publiee ?? 0} icon={Eye} />
        <KpiCard label="En cours d'instruction" value={(counts.en_verification ?? 0) + (counts.validee ?? 0) + (counts.brouillon ?? 0)} icon={Pencil} accent="ochre" hint="Brouillons, à vérifier, validées" />
        <KpiCard label="Suspendues / archivées" value={(counts.suspendue ?? 0) + (counts.archivee ?? 0)} icon={Send} accent="secondary" />
      </div>

      <div className="rounded-lg border bg-card shadow-card">
        <div className="grid gap-3 border-b p-4 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Titre, référence (OPP-ATS-…), district…" className="h-10 pl-9" aria-label="Rechercher" />
          </div>
          <SimpleSelect value={sectorId} allLabel="Tous les secteurs" options={(options.data?.sectors ?? []).map((s) => ({ value: s.id, label: s.name }))} onChange={(v) => { setSectorId(v); setPage(1); }} />
          <SimpleSelect value={regionId} allLabel="Toutes les régions" options={(options.data?.regions ?? []).map((r) => ({ value: r.id, label: r.name }))} onChange={(v) => { setRegionId(v); setPage(1); }} />
        </div>
        <div className="flex gap-1 overflow-x-auto border-b px-3 py-2">
          {TABS.map((t) => (
            <button
              key={t ?? "all"}
              type="button"
              onClick={() => { setStatus(t); setPage(1); }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition",
                status === t ? "bg-primary text-white" : "text-secondary hover:bg-muted",
              )}
            >
              {t ? OPPORTUNITY_STATUS_LABELS[t] : "Tous"}
              <span className={cn("rounded px-1.5 text-[10px]", status === t ? "bg-white/20" : "bg-surface-low")}>{t ? counts[t] ?? 0 : all}</span>
            </button>
          ))}
        </div>

        {isPending ? (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : !data?.items.length ? (
          <EmptyState className="m-4" icon={SearchX} title="Aucune opportunité" description="Modifiez les filtres ou créez une nouvelle opportunité." />
        ) : (
          <div className={cn("overflow-x-auto", isFetching && "opacity-70")}>
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="label-caps border-b bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3">Réf. & projet</th>
                  <th className="px-3 py-3">Localisation</th>
                  <th className="px-3 py-3 text-right">Investissement</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Activité</th>
                  <th className="px-3 py-3">Mise à jour</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((o) => {
                  const transitions = me ? allowedTransitions(o.status as OpportunityStatus, me.canPublish) : [];
                  const deletable = ["brouillon", "archivee"].includes(o.status) && o.requests === 0; // auteur ou admin : vérifié côté serveur
                  return (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="size-11 shrink-0 overflow-hidden rounded">
                            <OpportunityCover coverKey={o.coverKey} sectorSlug={o.sectorSlug} title={o.title} iconClassName="size-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="label-caps text-[10px] text-muted-foreground">{o.reference ?? "—"}</p>
                            <Link to={`${base}/opportunites/${o.id}`} className="line-clamp-1 font-semibold hover:text-primary">{o.title}</Link>
                            <p className="text-xs text-muted-foreground">{o.sector}{o.isFeatured && <span className="ml-1.5 font-semibold text-ochre">· En vedette</span>}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <p className="font-medium">{o.district ?? "—"}</p>
                        <p className="text-muted-foreground">{[o.commune, o.region].filter(Boolean).join(", ")}</p>
                      </td>
                      <td className="tabular px-3 py-3 text-right font-bold">{formatAmount(o.estimatedInvestment, o.currency)}</td>
                      <td className="px-3 py-3"><StatusBadge kind="opportunity" status={o.status} /></td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-3">
                          <span title="Documents" className="flex items-center gap-1"><FileText className="size-3.5" />{o.documents}</span>
                          <span title="Images" className="flex items-center gap-1"><ImageIcon className="size-3.5" />{o.media}</span>
                          <span title="Consultations" className="flex items-center gap-1"><Eye className="size-3.5" />{o.views}</span>
                          <span title="Demandes d'intérêt" className="flex items-center gap-1"><Send className="size-3.5" />{o.requests}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {formatDate(o.updatedAt)}
                        <span className="block">{o.createdBy ?? ""}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded hover:bg-muted" aria-label="Actions">
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem render={<Link to={`${base}/opportunites/${o.id}`} />}><Pencil /> Modifier</DropdownMenuItem>
                            {o.status === "publiee" && (
                              <DropdownMenuItem render={<Link to={`/opportunites/${o.slug}`} target="_blank" />}><ExternalLink /> Voir la fiche publique</DropdownMenuItem>
                            )}
                            {transitions.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                                  {transitions.map((to) => (
                                    <DropdownMenuItem key={to} onClick={() => changeStatus.mutate({ id: o.id, status: to })}>
                                      {ACTION_LABELS[to]}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuGroup>
                              </>
                            )}
                            {deletable && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onClick={() => setToDelete({ id: o.id, title: o.title })}><Trash2 /> Supprimer</DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pager className="border-t p-3" page={page} pageCount={data.pageCount} total={data.total} pageSize={PAGE_SIZE} label="opportunités" onPageChange={setPage} />}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Supprimer cette opportunité ?"
        description={<>« {toDelete?.title} » sera définitivement supprimée, avec ses documents et images. Cette action est irréversible.</>}
        confirmLabel="Supprimer définitivement"
        onConfirm={() => toDelete && remove.mutate({ id: toDelete.id })}
      />
    </div>
  );
}
