import { zodResolver } from "@hookform/resolvers/zod";
import { Coins, ExternalLink, Eye, Handshake, Landmark, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { FormField } from "@/components/common/form-field";
import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/page-header";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { SimpleSelect } from "@/components/common/simple-select";
import { spaceLabel } from "@/components/layouts/nav-config";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useRegions } from "@/features/regions/hooks";
import { formatAmount } from "@/lib/format";
import type { PartnerProject } from "@/types";
import { useManagedPartnerProjects, useRemovePartnerProject, useSavePartnerProject, useSetPartnerProjectPublished } from "../hooks";
import { projectPhase } from "../period";
import { type PartnerProjectInput, partnerProjectInputSchema, type PartnerProjectOutput } from "../schemas";
import { PartnerProjectCard } from "./partner-project-card";

const toNumber = (v: unknown) => (v === "" || v == null ? undefined : Number(v));

function defaults(p?: PartnerProject): PartnerProjectInput {
  return {
    title: p?.title ?? "",
    fullName: p?.fullName ?? "",
    donor: p?.donor ?? "",
    implementer: p?.implementer ?? "",
    sectors: p?.sectors ?? "",
    duration: p?.duration ?? "",
    startYear: p?.startYear ?? undefined,
    endYear: p?.endYear ?? undefined,
    funding: p?.funding ?? "",
    amountUsd: p?.amountUsd ?? undefined,
    beneficiaries: p?.beneficiaries ?? "",
    contact: p?.contact ?? "",
    source: p?.source ?? "",
    notes: p?.notes ?? "",
    regionId: p?.regionId ?? "",
    isPublished: p?.isPublished ?? true,
  };
}

// Formulaire d'un projet PTF : reprend les colonnes du classeur des projets financés par les PTF
// Monté à chaque ouverture : le formulaire repart des valeurs du projet (ou vide), jamais d'une saisie précédente
function ProjectFormDialog({ project, onClose }: { project?: PartnerProject; onClose: () => void }) {
  const { data: regions } = useRegions();
  const form = useForm<PartnerProjectInput, unknown, PartnerProjectOutput>({
    resolver: zodResolver(partnerProjectInputSchema),
    defaultValues: defaults(project),
  });
  const { register, control, handleSubmit, formState: { errors } } = form;
  const save = useSavePartnerProject({
    onSuccess: () => { toast.success("Projet enregistré"); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const onSubmit = handleSubmit((values) => save.mutate({ ...values, id: project?.id }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{project ? `Modifier « ${project.title} »` : "Nouveau projet partenaire"}</DialogTitle></DialogHeader>
        <form id="partner-project-form" onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nom du projet" htmlFor="pp-title" required error={errors.title?.message}>
            <Input id="pp-title" {...register("title")} placeholder="PTASO" />
          </FormField>
          <FormField label="Bailleur" htmlFor="pp-donor" required error={errors.donor?.message}>
            <Input id="pp-donor" {...register("donor")} placeholder="BAD, Banque Mondiale, PNUD…" />
          </FormField>
          <FormField label="Intitulé complet" htmlFor="pp-fullname" className="sm:col-span-2" error={errors.fullName?.message}>
            <Input id="pp-fullname" {...register("fullName")} />
          </FormField>
          <FormField label="Organisme de mise en œuvre (MOD)" htmlFor="pp-impl" error={errors.implementer?.message}>
            <Input id="pp-impl" {...register("implementer")} />
          </FormField>
          <FormField label="Région" htmlFor="pp-region" required error={errors.regionId?.message}>
            <Controller control={control} name="regionId" render={({ field }) => (
              <SimpleSelect id="pp-region" value={field.value || null} onChange={(v) => field.onChange(v ?? "")} invalid={!!errors.regionId}
                options={(regions ?? []).map((r) => ({ value: r.id, label: r.name }))} />
            )} />
          </FormField>
          <FormField label="Secteurs" htmlFor="pp-sectors" className="sm:col-span-2" error={errors.sectors?.message}>
            <Input id="pp-sectors" {...register("sectors")} placeholder="Agribusiness, Tourisme, Entrepreneuriat…" />
          </FormField>
          <FormField label="Durée du projet" htmlFor="pp-duration" className="sm:col-span-2" error={errors.duration?.message}>
            <Input id="pp-duration" {...register("duration")} placeholder="5 ans à partir de 2021 (2021-2026)" />
          </FormField>
          <FormField label="Année de début" htmlFor="pp-start" error={errors.startYear?.message}>
            <Input id="pp-start" type="number" inputMode="numeric" {...register("startYear", { setValueAs: toNumber })} />
          </FormField>
          <FormField label="Année de fin" htmlFor="pp-end" error={errors.endYear?.message}>
            <Input id="pp-end" type="number" inputMode="numeric" {...register("endYear", { setValueAs: toNumber })} />
          </FormField>
          <FormField label="Montant du financement" htmlFor="pp-funding" hint="Tel que communiqué (devise, répartition…)" error={errors.funding?.message}>
            <Input id="pp-funding" {...register("funding")} />
          </FormField>
          <FormField label="Équivalent en USD" htmlFor="pp-amount" hint="Sert au total affiché sur la page publique" error={errors.amountUsd?.message}>
            <Input id="pp-amount" type="number" inputMode="decimal" {...register("amountUsd", { setValueAs: toNumber })} />
          </FormField>
          <FormField label="Principales cibles / bénéficiaires" htmlFor="pp-benef" className="sm:col-span-2" error={errors.beneficiaries?.message}>
            <Textarea id="pp-benef" rows={3} {...register("beneficiaries")} />
          </FormField>
          <FormField label="Informations / documents pertinents" htmlFor="pp-notes" className="sm:col-span-2" error={errors.notes?.message}>
            <Textarea id="pp-notes" rows={4} {...register("notes")} />
          </FormField>
          <FormField label="Coordonnées / point focal" htmlFor="pp-contact" error={errors.contact?.message}>
            <Textarea id="pp-contact" rows={2} {...register("contact")} />
          </FormField>
          <FormField label="Source / lien vers le projet" htmlFor="pp-source" error={errors.source?.message}>
            <Textarea id="pp-source" rows={2} {...register("source")} />
          </FormField>
          <label className="flex items-center gap-3 text-sm font-medium sm:col-span-2">
            <Controller control={control} name="isPublished" render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Publié sur le portail" />
            )} />
            Visible sur la page publique « Projets des partenaires »
          </label>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" form="partner-project-form" disabled={save.isPending}>{save.isPending ? "Enregistrement…" : "Enregistrer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Gestion des projets financés par les PTF (agents et administrateurs)
export function PartnerProjectsView({ base = "/edbm" }: { base?: string }) {
  const { data, isPending } = useManagedPartnerProjects();
  const [editing, setEditing] = useState<{ project?: PartnerProject } | null>(null);
  const [toDelete, setToDelete] = useState<PartnerProject | null>(null);
  const setPublished = useSetPartnerProjectPublished({
    onSuccess: (_d, v) => toast.success(v.isPublished ? "Projet publié" : "Projet retiré de la page publique"),
    onError: (e) => toast.error(e.message),
  });
  const remove = useRemovePartnerProject({
    onSuccess: () => toast.success("Projet supprimé"),
    onError: (e) => toast.error(e.message),
  });

  if (isPending) return <PageSkeleton />;
  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: spaceLabel(base), href: base }, { label: "Projets des partenaires" }]}
        title="Projets des partenaires (PTF)"
        description="Programmes financés par les partenaires techniques et financiers et déjà en cours dans la région. Ils sont présentés à titre d'information, hors catalogue d'opportunités."
        actions={
          <>
            <Link to="/projets-partenaires" target="_blank" className="flex h-10 items-center gap-1.5 rounded-md border px-4 text-sm font-medium hover:bg-muted">
              <Eye className="size-4" /> Page publique <ExternalLink className="size-3" />
            </Link>
            <Button className="h-10 px-4" onClick={() => setEditing({})}><Plus /> Nouveau projet</Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Projets en cours" value={`${rows.filter((p) => projectPhase(p) === "en_cours").length} / ${rows.length}`} icon={Handshake} />
        <KpiCard label="Bailleurs" value={new Set(rows.map((p) => p.donor)).size} icon={Landmark} accent="secondary" />
        <KpiCard label="Financements annoncés" value={formatAmount(rows.reduce((s, p) => s + (p.amountUsd ?? 0), 0))} icon={Coins} accent="ochre" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        {rows.map((p) => (
          <div key={p.id} className={p.isPublished ? undefined : "opacity-75"}>
            <PartnerProjectCard
              project={p}
              actions={
                <span className="flex items-center gap-1">
                  <label className="mr-1 flex items-center gap-1.5 text-xs font-medium" title={p.isPublished ? "Retirer de la page publique" : "Publier"}>
                    <Switch checked={p.isPublished} onCheckedChange={(v) => setPublished.mutate({ id: p.id, isPublished: v })} aria-label="Publié" />
                    {p.isPublished ? "Publié" : "Masqué"}
                  </label>
                  <Button size="icon-sm" variant="ghost" onClick={() => setEditing({ project: p })} aria-label="Modifier"><Pencil /></Button>
                  <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => setToDelete(p)} aria-label="Supprimer"><Trash2 /></Button>
                </span>
              }
            />
          </div>
        ))}
      </div>

      {editing && <ProjectFormDialog key={editing.project?.id ?? "nouveau"} project={editing.project} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}
        title={`Supprimer « ${toDelete?.title ?? ""} » ?`}
        description="Le projet disparaîtra de la page publique et de cette liste. Pour le masquer seulement, désactivez « Publié »."
        confirmLabel="Supprimer" onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
    </div>
  );
}
