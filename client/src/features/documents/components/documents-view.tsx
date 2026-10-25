import { useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Download, FileText, Globe, Image as ImageIcon, Lock, Search, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/page-header";
import { Pager } from "@/components/common/pager";
import { SimpleSelect } from "@/components/common/simple-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fileUrl, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDeleteDocument, useDocuments, useUpdateDocument } from "@/features/documents/hooks";
import { useOpportunityOptions } from "@/features/opportunities/hooks";
import { DocumentUploader } from "./attachments";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { spaceLabel } from "@/components/layouts/nav-config";

const PAGE_SIZE = 15;

// Gestion documentaire (section 25)
export function DocumentsView({ base = "/edbm" }: { base?: string }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [opportunityId, setOpportunityId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "prive" | null>(null);
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const opportunities = useOpportunityOptions();
  const { data, isPending } = useDocuments({ q: search || undefined, opportunityId: opportunityId ?? undefined, visibility: visibility ?? undefined, page, pageSize: PAGE_SIZE }, { placeholderData: keepPreviousData });
  const refresh = () => qc.invalidateQueries({ queryKey: ["documents"] });
  const update = useUpdateDocument({ onSuccess: refresh, onError: (e) => toast.error(e.message) });
  const remove = useDeleteDocument({
    onSuccess: () => { toast.success("Document supprimé"); refresh(); },
    onError: (e) => toast.error(e.message),
  });
  const oppOptions = (opportunities.data ?? []).map((o) => ({ value: o.id, label: `${o.reference ?? ""} ${o.title}`.trim() }));

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: spaceLabel(base), href: base }, { label: "Documents & médias" }]}
        title="Documents et médias"
        description="Fiches projets, études, brochures et documents techniques rattachés aux opportunités."
        actions={<Button className="h-10 px-4" onClick={() => setUploadOpen(true)}><Upload /> Ajouter un document</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Documents" value={data?.stats.documents ?? "…"} icon={FileText} />
        <KpiCard label="Réservés aux connectés" value={data?.stats.privateDocs ?? "…"} icon={Lock} accent="ochre" />
        <KpiCard label="Images (photothèque)" value={data?.stats.media ?? "…"} icon={ImageIcon} accent="secondary" />
      </div>

      <div className="rounded-lg border bg-card shadow-card">
        <div className="grid gap-3 border-b p-4 md:grid-cols-[1.4fr_1.2fr_1fr]">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, type, opportunité…" className="h-10 pl-9" />
          </div>
          <SimpleSelect value={opportunityId} onChange={(v) => { setOpportunityId(v); setPage(1); }} allLabel="Toutes les opportunités" options={oppOptions} />
          <SimpleSelect value={visibility} onChange={(v) => { setVisibility(v as typeof visibility); setPage(1); }} allLabel="Toutes visibilités"
            options={[{ value: "public", label: "Publics" }, { value: "prive", label: "Réservés aux connectés" }]} />
        </div>
        {isPending ? (
          <div className="space-y-2 p-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : !data?.items.length ? (
          <EmptyState className="m-4" icon={FileText} title="Aucun document" description="Ajoutez des documents depuis ce bouton ou depuis l'étape 4 d'une opportunité." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="label-caps border-b bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3">Document</th>
                  <th className="px-3 py-3">Opportunité</th>
                  <th className="px-3 py-3">Visibilité</th>
                  <th className="px-3 py-3">Ajouté par</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="label-caps flex h-9 w-11 shrink-0 items-center justify-center rounded bg-red-50 text-red-700">{d.fileKey.split(".").pop()?.toUpperCase()}</span>
                        <div className="min-w-0"><p className="truncate font-semibold">{d.name}</p><p className="text-xs text-muted-foreground">{d.type}</p></div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Link to={`${base}/opportunites/${d.opportunityId}?etape=4`} className="line-clamp-1 hover:text-primary">{d.opportunity}</Link>
                      <p className="text-xs text-muted-foreground">{d.reference}</p>
                    </td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => update.mutate({ id: d.id, isPublic: !d.isPublic })}
                        className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold", d.isPublic ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")}>
                        {d.isPublic ? <><Globe className="size-3.5" /> Public</> : <><Lock className="size-3.5" /> Membres</>}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-xs"><p>{d.uploadedBy ?? "—"}</p><p className="text-muted-foreground">{formatDate(d.createdAt)}</p></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <a href={fileUrl(d.fileKey)} target="_blank" rel="noopener" className="flex size-8 items-center justify-center rounded text-secondary hover:bg-muted" aria-label="Télécharger"><Download className="size-4" /></a>
                        <button type="button" onClick={() => setToDelete({ id: d.id, name: d.name })} className="flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-red-50 hover:text-red-700" aria-label="Supprimer"><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pager className="border-t p-3" page={page} pageCount={data.pageCount} total={data.total} pageSize={PAGE_SIZE} label="documents" onPageChange={setPage} />}
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Ajouter un document</DialogTitle>
            <DialogDescription>Choisissez l&apos;opportunité concernée, le type et la visibilité.</DialogDescription>
          </DialogHeader>
          <SimpleSelect value={uploadTarget} onChange={setUploadTarget} placeholder="Opportunité concernée" options={oppOptions} />
          {uploadTarget
            ? <DocumentUploader opportunityId={uploadTarget} onUploaded={() => { refresh(); setUploadOpen(false); }} />
            : <p className="text-sm text-muted-foreground">Sélectionnez d&apos;abord une opportunité.</p>}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}
        title="Supprimer ce document ?" description={<>« {toDelete?.name} » et son fichier seront définitivement supprimés.</>}
        confirmLabel="Supprimer" onConfirm={() => toDelete && remove.mutate({ id: toDelete.id })}
      />
    </div>
  );
}
