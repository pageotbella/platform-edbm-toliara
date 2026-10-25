import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, MapPin, MapPinned, Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/common/form-field";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/page-header";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useManagedRegions, useRemoveGeo, useSaveCommune, useSaveDistrict, useSaveRegion } from "@/features/regions/hooks";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useStaffMe } from "@/features/users/staff-hooks";
import { spaceLabel } from "@/components/layouts/nav-config";

type Level = "region" | "district" | "commune";
type Edit = { level: Level; id?: string; parentId?: string; name: string; code?: string } | null;
const LABEL: Record<Level, string> = { region: "région", district: "district", commune: "commune" };
const THE: Record<Level, string> = { region: "la région", district: "le district", commune: "la commune" };

function IconBtn({ onClick, label, danger, children }: { onClick: () => void; label: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className={cn("flex size-7 items-center justify-center rounded text-muted-foreground transition", danger ? "hover:bg-red-50 hover:text-red-700" : "hover:bg-muted hover:text-foreground")}>
      {children}
    </button>
  );
}

// Gestion géographique (section 24) : Madagascar → Région → District → Commune
export function RegionsView({ base = "/edbm" }: { base?: string }) {
  const qc = useQueryClient();
  const me = useStaffMe();
  const { data, isPending } = useManagedRegions();
  const [selected, setSelected] = useState<string | null>(null);
  const [edit, setEdit] = useState<Edit>(null);
  const [toDelete, setToDelete] = useState<{ level: Level; id: string; name: string } | null>(null);

  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["regions"] }), qc.invalidateQueries({ queryKey: ["opportunities", "filter-options"] })]);
  const opts = { onSuccess: () => { toast.success("Enregistré"); setEdit(null); refresh(); }, onError: (e: { message: string }) => toast.error(e.message) };
  const saveRegion = useSaveRegion(opts);
  const saveDistrict = useSaveDistrict(opts);
  const saveCommune = useSaveCommune(opts);
  const remove = useRemoveGeo({ onSuccess: () => { toast.success("Supprimé"); refresh(); }, onError: (e) => toast.error(e.message) });
  const saving = saveRegion.isPending || saveDistrict.isPending || saveCommune.isPending;

  if (isPending || me.isPending) return <PageSkeleton />;
  if (!me.data?.canManageRegions) {
    return <EmptyState icon={ShieldAlert} title="Accès non autorisé" description="La gestion des régions nécessite une permission accordée par l'administrateur." />;
  }
  const regions = data ?? [];
  const region = regions.find((r) => r.id === selected) ?? regions.find((r) => r.opportunities > 0) ?? regions[0];

  const submit = () => {
    if (!edit) return;
    if (edit.level === "region") saveRegion.mutate({ id: edit.id, name: edit.name, code: edit.code || undefined });
    else if (edit.level === "district") saveDistrict.mutate({ id: edit.id, regionId: edit.parentId!, name: edit.name });
    else saveCommune.mutate({ id: edit.id, districtId: edit.parentId!, name: edit.name });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: spaceLabel(base), href: base }, { label: "Régions & districts" }]}
        title="Découpage territorial"
        description="Arborescence Région → District → Commune utilisée pour localiser et rechercher les opportunités."
        actions={<Button className="h-10 px-4" onClick={() => setEdit({ level: "region", name: "", code: "" })}><Plus /> Nouvelle région</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Régions" value={regions.length} icon={MapPinned} />
        <KpiCard label="Districts" value={regions.reduce((s, r) => s + r.districts.length, 0)} icon={MapPin} accent="secondary" />
        <KpiCard label="Communes" value={regions.reduce((s, r) => s + r.districts.reduce((x, d) => x + d.communes.length, 0), 0)} icon={MapPin} accent="ochre" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <ul className="h-fit space-y-1 rounded-lg border bg-card p-2 shadow-card">
          {regions.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => setSelected(r.id)}
                className={cn("flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm transition", region?.id === r.id ? "bg-primary text-white" : "hover:bg-muted")}>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{r.name}</span>
                  <span className={cn("block text-xs", region?.id === r.id ? "text-white/75" : "text-muted-foreground")}>{r.code} · {r.districts.length} district(s) · {r.opportunities} opp.</span>
                </span>
                <ChevronRight className="size-4 shrink-0" />
              </button>
            </li>
          ))}
        </ul>

        {region && (
          <section className="rounded-lg border bg-card shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
              <div>
                <p className="label-caps text-muted-foreground">Région · {region.code}</p>
                <h2 className="text-lg font-semibold">{region.name}</h2>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => setEdit({ level: "region", id: region.id, name: region.name, code: region.code })}><Pencil /> Modifier</Button>
                <Button size="sm" onClick={() => setEdit({ level: "district", parentId: region.id, name: "" })}><Plus /> District</Button>
                {region.opportunities === 0 && (
                  <IconBtn danger label="Supprimer la région" onClick={() => setToDelete({ level: "region", id: region.id, name: region.name })}><Trash2 className="size-4" /></IconBtn>
                )}
              </div>
            </div>
            <div className="space-y-3 p-5">
              {!region.districts.length && <p className="text-sm text-muted-foreground">Aucun district. Ajoutez-en un pour structurer la région.</p>}
              {region.districts.map((d) => (
                <div key={d.id} className="rounded-md border">
                  <div className="flex items-center justify-between gap-2 bg-surface-low/60 px-4 py-2.5">
                    <p className="font-semibold">{d.name} <span className="ml-1 text-xs font-normal text-muted-foreground">{d.communes.length} commune(s) · {d.opportunities} opportunité(s)</span></p>
                    <div className="flex items-center gap-0.5">
                      <IconBtn label="Ajouter une commune" onClick={() => setEdit({ level: "commune", parentId: d.id, name: "" })}><Plus className="size-4" /></IconBtn>
                      <IconBtn label="Renommer le district" onClick={() => setEdit({ level: "district", id: d.id, parentId: region.id, name: d.name })}><Pencil className="size-3.5" /></IconBtn>
                      {d.opportunities === 0 && (
                        <IconBtn danger label="Supprimer le district" onClick={() => setToDelete({ level: "district", id: d.id, name: d.name })}><Trash2 className="size-3.5" /></IconBtn>
                      )}
                    </div>
                  </div>
                  <ul className="flex flex-wrap gap-2 p-3">
                    {d.communes.map((c) => (
                      <li key={c.id} className="group flex items-center gap-1 rounded border bg-white py-1 pr-1 pl-2.5 text-sm">
                        <MapPin className="size-3 text-primary" /> {c.name}
                        {c.opportunities > 0 && <span className="rounded bg-surface-low px-1 text-[10px] text-secondary">{c.opportunities}</span>}
                        <IconBtn label={`Renommer ${c.name}`} onClick={() => setEdit({ level: "commune", id: c.id, parentId: d.id, name: c.name })}><Pencil className="size-3" /></IconBtn>
                        {c.opportunities === 0 && (
                          <IconBtn danger label={`Supprimer ${c.name}`} onClick={() => setToDelete({ level: "commune", id: c.id, name: c.name })}><Trash2 className="size-3" /></IconBtn>
                        )}
                      </li>
                    ))}
                    {!d.communes.length && <li className="text-xs text-muted-foreground">Aucune commune.</li>}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{edit?.id ? "Modifier" : "Ajouter"} : {edit && LABEL[edit.level]}</DialogTitle></DialogHeader>
          {edit && (
            <form id="geo-form" className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <FormField label="Nom" htmlFor="geo-name" required>
                <Input id="geo-name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} autoFocus />
              </FormField>
              {edit.level === "region" && (
                <FormField label="Code" htmlFor="geo-code" hint="Généré à partir du nom si vide.">
                  <Input id="geo-code" value={edit.code ?? ""} onChange={(e) => setEdit({ ...edit, code: e.target.value })} />
                </FormField>
              )}
            </form>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Annuler</Button>
            <Button type="submit" form="geo-form" disabled={saving || (edit?.name.trim().length ?? 0) < 2}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}
        title={`Supprimer ${toDelete ? THE[toDelete.level] : ""} « ${toDelete?.name ?? ""} » ?`}
        description="Les éléments rattachés (districts, communes) seront également supprimés."
        confirmLabel="Supprimer" onConfirm={() => toDelete && remove.mutate({ level: toDelete.level, id: toDelete.id })}
      />
    </div>
  );
}
