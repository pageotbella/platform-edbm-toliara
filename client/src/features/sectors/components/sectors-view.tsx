import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Layers, Pencil, Plus, Power, ShieldAlert, Shapes } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/common/form-field";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/page-header";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { SectorIcon } from "@/components/common/sector-icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useManagedSectors, useSaveSector, useSetSectorActive } from "@/features/sectors/hooks";
import { useStaffMe } from "@/features/users/staff-hooks";
import { spaceLabel } from "@/components/layouts/nav-config";

type Editing = { id?: string; name: string; description: string } | null;

// Gestion des secteurs (section 23) : ajouter, modifier, désactiver, consulter les opportunités associées
export function SectorsView({ base = "/edbm" }: { base?: string }) {
  const qc = useQueryClient();
  const me = useStaffMe();
  const { data, isPending } = useManagedSectors();
  const [editing, setEditing] = useState<Editing>(null);
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["sectors"] }), qc.invalidateQueries({ queryKey: ["opportunities", "filter-options"] })]);
  const save = useSaveSector({
    onSuccess: () => { toast.success("Secteur enregistré"); setEditing(null); refresh(); },
    onError: (e) => toast.error(e.message),
  });
  const setActive = useSetSectorActive({
    onSuccess: (_d, v) => { toast.success(v.isActive ? "Secteur réactivé" : "Secteur désactivé"); refresh(); },
    onError: (e) => toast.error(e.message),
  });

  if (isPending || me.isPending) return <PageSkeleton />;
  if (!me.data?.canManageSectors) {
    return <EmptyState icon={ShieldAlert} title="Accès non autorisé" description="La gestion des secteurs nécessite une permission accordée par l'administrateur." />;
  }
  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: spaceLabel(base), href: base }, { label: "Secteurs" }]}
        title="Secteurs économiques"
        description="Filières qui structurent le catalogue. Un secteur désactivé n'apparaît plus dans les filtres publics ni dans le formulaire de création."
        actions={<Button className="h-10 px-4" onClick={() => setEditing({ name: "", description: "" })}><Plus /> Nouveau secteur</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Secteurs actifs" value={`${rows.filter((r) => r.isActive).length} / ${rows.length}`} icon={Shapes} />
        <KpiCard label="Opportunités rattachées" value={rows.reduce((s, r) => s + r.opportunities, 0)} icon={Layers} accent="secondary" />
        <KpiCard label="Volume publié" value={formatAmount(rows.reduce((s, r) => s + r.investment, 0))} icon={Layers} accent="ochre" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((s) => (
          <article key={s.id} className={cn("rounded-lg border bg-card p-5 shadow-card", !s.isActive && "opacity-70")}>
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-low text-primary"><SectorIcon slug={s.slug} className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{s.name}</h2>
                  <span className={cn("label-caps rounded px-2 py-0.5", s.isActive ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600")}>{s.isActive ? "Actif" : "Inactif"}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description ?? "Aucune description."}</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 rounded-md bg-surface-low/60 p-3 text-center">
              <div><dt className="label-caps text-[10px] text-muted-foreground">Opportunités</dt><dd className="tabular font-bold">{s.opportunities}</dd></div>
              <div><dt className="label-caps text-[10px] text-muted-foreground">Publiées</dt><dd className="tabular font-bold">{s.published}</dd></div>
              <div><dt className="label-caps text-[10px] text-muted-foreground">Volume publié</dt><dd className="tabular font-bold">{formatAmount(s.investment)}</dd></div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <Link to={`/secteurs/${s.slug}`} target="_blank" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Opportunités associées <ExternalLink className="size-3" />
              </Link>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing({ id: s.id, name: s.name, description: s.description ?? "" })}><Pencil /> Modifier</Button>
                <label className="flex items-center gap-2 text-xs font-medium" title={s.isActive ? "Désactiver" : "Réactiver"}>
                  <Power className="size-3.5 text-muted-foreground" />
                  <Switch checked={s.isActive} onCheckedChange={(v) => setActive.mutate({ id: s.id, isActive: v })} aria-label="Secteur actif" />
                </label>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Modifier le secteur" : "Nouveau secteur"}</DialogTitle></DialogHeader>
          {editing && (
            <form id="sector-form" className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate({ id: editing.id, name: editing.name, description: editing.description }); }}>
              <FormField label="Nom" htmlFor="sector-name" required>
                <Input id="sector-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
              </FormField>
              <FormField label="Description" htmlFor="sector-desc">
                <Textarea id="sector-desc" rows={4} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </FormField>
            </form>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button type="submit" form="sector-form" disabled={save.isPending || (editing?.name.trim().length ?? 0) < 2}>{save.isPending ? "Enregistrement…" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
