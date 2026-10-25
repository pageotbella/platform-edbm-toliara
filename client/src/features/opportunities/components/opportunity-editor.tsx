import { spaceLabel } from "@/components/layouts/nav-config";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, ExternalLink, Eye, FileText, Heart, Save, Send,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { FormField } from "@/components/common/form-field";
import { LocationPicker } from "@/features/map/components";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { Panel } from "@/components/common/panel";
import { SimpleSelect } from "@/components/common/simple-select";
import { StatusBadge } from "@/components/common/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { INVESTMENT_MODELS, PROJECT_TYPES, type OpportunityStatus } from "@/config/constants";
import { formatAmountFull, formatDate } from "@/lib/format";
import { ACTION_LABELS } from "@/lib/opportunity-workflow";
import { cn } from "@/lib/utils";
import { opportunityInputSchema } from "@/features/opportunities/schemas";
import { useCreateOpportunity, useFilterOptions, useStaffOpportunity, useUpdateOpportunity } from "@/features/opportunities/hooks";
import { DocumentList, DocumentUploader, MediaGallery } from "@/features/documents/components/attachments";
import { useChangeStatus } from "@/features/users/staff-hooks";

type FormIn = z.input<typeof opportunityInputSchema>;
type FormOut = z.output<typeof opportunityInputSchema>;

// Étapes du formulaire (section 18)
const STEPS: { title: string; hint: string; fields: FieldPath<FormIn>[] }[] = [
  { title: "Informations générales", hint: "Titre, secteur, description", fields: ["title", "sectorId", "subSector", "projectType", "description"] },
  { title: "Localisation", hint: "Région, district, commune, GPS", fields: ["regionId", "districtId", "communeId", "latitude", "longitude"] },
  { title: "Informations économiques", hint: "Montant, potentiel, marché", fields: ["estimatedInvestment", "currency", "investmentModel", "potential", "targetMarket", "resources", "infrastructures", "zoneAdvantages"] },
  { title: "Documents & images", hint: "Fiches, PDF, photothèque", fields: [] },
  { title: "Publication", hint: "Brouillon, validation, publication", fields: [] },
];

const num = (v: unknown) => (v === "" || v == null || Number.isNaN(Number(v)) ? undefined : Number(v));
const text = (v: unknown) => (v === "" || v == null ? undefined : String(v));

// Valeurs de l'opportunité → valeurs du formulaire (null → undefined)
function toForm(o: Record<string, unknown>): FormIn {
  const pick = (k: string) => (o[k] == null ? undefined : o[k]);
  return {
    title: o.title as string, description: o.description as string, sectorId: o.sectorId as string,
    subSector: pick("subSector") as string, projectType: pick("projectType") as string,
    regionId: o.regionId as string, districtId: pick("districtId") as string, communeId: pick("communeId") as string,
    latitude: pick("latitude") as number, longitude: pick("longitude") as number,
    estimatedInvestment: pick("estimatedInvestment") as number, currency: (o.currency as "USD") ?? "USD",
    investmentModel: pick("investmentModel") as string, potential: pick("potential") as string,
    targetMarket: pick("targetMarket") as string, resources: pick("resources") as string,
    infrastructures: pick("infrastructures") as string, zoneAdvantages: pick("zoneAdvantages") as string,
    isFeatured: !!o.isFeatured,
  };
}

export function OpportunityEditor({ id, initialStep = 0, base = "/edbm" }: { id?: string; initialStep?: number; base?: string }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 0), STEPS.length - 1));
  const options = useFilterOptions();
  const detail = useStaffOpportunity({ id: id ?? "" }, { enabled: !!id, retry: false });
  const o = detail.data;

  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(opportunityInputSchema),
    defaultValues: { currency: "USD", isFeatured: false },
  });
  const { register, control, handleSubmit, reset, setValue, trigger, formState: { errors, isDirty } } = form;

  // Charge les valeurs une seule fois par opportunité (sans écraser une saisie en cours)
  const loadedId = o?.id;
  useEffect(() => {
    if (o) reset(toForm(o as unknown as Record<string, unknown>));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedId, reset]);

  const regionId = useWatch({ control, name: "regionId" });
  const districtId = useWatch({ control, name: "districtId" });
  const lat = useWatch({ control, name: "latitude" });
  const lng = useWatch({ control, name: "longitude" });
  const watched = useWatch({ control });

  const create = useCreateOpportunity();
  const update = useUpdateOpportunity();
  const changeStatus = useChangeStatus();
  const saving = create.isPending || update.isPending;

  /** Enregistre le formulaire ; crée le brouillon s'il n'existe pas encore. */
  const save = (after?: (savedId: string) => void) =>
    handleSubmit(async (data) => {
      try {
        if (id) {
          await update.mutateAsync({ id, data });
          reset(data);
          toast.success("Modifications enregistrées");
          await detail.refetch();
          after?.(id);
        } else {
          const row = await create.mutateAsync(data);
          toast.success(`Brouillon ${row.reference} créé`);
          navigate(`${base}/opportunites/${row.id}?etape=${after ? 4 : 1}`, { replace: true });
        }
      } catch (e) {
        toast.error((e as Error).message);
      }
    }, () => {
      const first = STEPS.findIndex((s) => s.fields.some((f) => f.split(".")[0]! in errors));
      if (first >= 0) setStep(first);
      toast.error("Certains champs sont invalides");
    })();

  const next = async () => {
    const ok = await trigger(STEPS[step]!.fields);
    if (!ok) return;
    // Les documents exigent une opportunité enregistrée
    if (step === 2 && !id) return save(() => undefined);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const transition = async (to: OpportunityStatus) => {
    if (!id) return;
    if (isDirty) await save();
    await changeStatus.mutateAsync({ id, status: to }).catch(() => undefined);
    await detail.refetch();
  };

  if (id && detail.isPending) return <PageSkeleton />;
  if (id && (detail.error || !o)) {
    return <EmptyState title="Opportunité introuvable" action={<Link to={`${base}/opportunites`} className={buttonVariants({ variant: "outline" })}>Retour au portefeuille</Link>} />;
  }

  const opts = options.data;
  const districts = (opts?.districts ?? []).filter((d) => d.regionId === regionId).map((d) => ({ value: d.id, label: d.name }));
  const communes = (opts?.communes ?? []).filter((c) => c.districtId === districtId).map((c) => ({ value: c.id, label: c.name }));
  const checklist = [
    { label: "Titre et description", ok: !!watched.title && (watched.description?.length ?? 0) >= 20 },
    { label: "Secteur et région", ok: !!watched.sectorId && !!watched.regionId },
    { label: "Coordonnées GPS", ok: watched.latitude != null && watched.longitude != null },
    { label: "Montant d'investissement", ok: watched.estimatedInvestment != null },
    { label: "Au moins une image", ok: (o?.media.length ?? 0) > 0 },
    { label: "Au moins un document", ok: (o?.documents.length ?? 0) > 0 },
  ];
  const score = checklist.filter((c) => c.ok).length;

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: spaceLabel(base), href: base }, { label: "Opportunités", href: `${base}/opportunites` }, { label: o ? o.title : "Nouvelle opportunité" }]}
        eyebrow={o ? `Dossier ${o.reference ?? ""}` : "Instruction d'un nouveau dossier"}
        title={o ? o.title : "Nouvelle opportunité d'investissement"}
        description="Renseignez les volets général, géographique et économique, joignez les pièces puis lancez la validation."
        actions={
          <>
            {o?.status === "publiee" && (
              <Link to={`/opportunites/${o.slug}`} target="_blank" className={cn(buttonVariants({ variant: "outline" }), "h-10 bg-white")}><ExternalLink /> Fiche publique</Link>
            )}
            <Button onClick={() => save()} disabled={saving || (!!id && !isDirty)} className="h-10 px-4">
              <Save /> {saving ? "Enregistrement…" : id ? "Enregistrer" : "Enregistrer comme brouillon"}
            </Button>
          </>
        }
      />

      {/* Étapes */}
      <ol className="grid gap-2 sm:grid-cols-5">
        {STEPS.map((s, i) => {
          const locked = i >= 3 && !id;
          const done = i < step;
          return (
            <li key={s.title}>
              <button
                type="button"
                disabled={locked}
                onClick={() => setStep(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                  i === step ? "border-primary bg-primary text-white" : "hover:border-border-strong",
                )}
              >
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", i === step ? "bg-white text-primary" : done ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground")}>
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={cn("label-caps block text-[10px]", i === step ? "text-white/75" : "text-muted-foreground")}>Étape {i + 1}</span>
                  <span className="block truncate text-sm font-semibold">{s.title}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="min-w-0 space-y-6" noValidate>
          <Panel title={`Étape ${step + 1} : ${STEPS[step]!.title}`} description={STEPS[step]!.hint}>
            {step === 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Titre du projet" htmlFor="title" error={errors.title?.message} required className="md:col-span-2">
                  <Input id="title" {...register("title")} aria-invalid={!!errors.title} />
                </FormField>
                <FormField label="Secteur" error={errors.sectorId?.message} required>
                  <Controller control={control} name="sectorId" render={({ field }) => (
                    <SimpleSelect value={field.value} onChange={(v) => field.onChange(v ?? undefined)} invalid={!!errors.sectorId}
                      placeholder="Choisir un secteur" options={(opts?.sectors ?? []).map((s) => ({ value: s.id, label: s.name }))} />
                  )} />
                </FormField>
                <FormField label="Sous-secteur" htmlFor="subSector" error={errors.subSector?.message}>
                  <Input id="subSector" {...register("subSector", { setValueAs: text })} placeholder="Ex. solaire photovoltaïque" />
                </FormField>
                <FormField label="Type de projet" error={errors.projectType?.message}>
                  <Controller control={control} name="projectType" render={({ field }) => (
                    <SimpleSelect value={field.value} onChange={(v) => field.onChange(v ?? undefined)} allLabel="Non précisé"
                      options={[...new Set([...PROJECT_TYPES, ...(field.value ? [field.value] : [])])].map((t) => ({ value: t, label: t }))} />
                  )} />
                </FormField>
                <FormField label="Mise en avant" hint="Affichée dans « Projets phares » sur l'accueil.">
                  <label className="flex h-10 items-center gap-2 text-sm">
                    <Controller control={control} name="isFeatured" render={({ field }) => (
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    )} />
                    Projet en vedette
                  </label>
                </FormField>
                <FormField label="Description" htmlFor="description" error={errors.description?.message} required className="md:col-span-2">
                  <Textarea id="description" rows={7} {...register("description")} aria-invalid={!!errors.description} />
                </FormField>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Région" error={errors.regionId?.message} required>
                  <Controller control={control} name="regionId" render={({ field }) => (
                    <SimpleSelect value={field.value} invalid={!!errors.regionId} placeholder="Choisir une région"
                      options={(opts?.regions ?? []).map((r) => ({ value: r.id, label: r.name }))}
                      onChange={(v) => { field.onChange(v ?? undefined); setValue("districtId", undefined); setValue("communeId", undefined); }} />
                  )} />
                </FormField>
                <FormField label="District">
                  <Controller control={control} name="districtId" render={({ field }) => (
                    <SimpleSelect value={field.value} allLabel="Non précisé" options={districts} disabled={!regionId}
                      onChange={(v) => { field.onChange(v ?? undefined); setValue("communeId", undefined); }} />
                  )} />
                </FormField>
                <FormField label="Commune">
                  <Controller control={control} name="communeId" render={({ field }) => (
                    <SimpleSelect value={field.value} allLabel="Non précisée" options={communes} disabled={!districtId}
                      onChange={(v) => field.onChange(v ?? undefined)} />
                  )} />
                </FormField>
                <FormField label="Latitude" htmlFor="latitude" error={errors.latitude?.message}>
                  <Input id="latitude" type="number" step="any" {...register("latitude", { setValueAs: num })} placeholder="-23.35" />
                </FormField>
                <FormField label="Longitude" htmlFor="longitude" error={errors.longitude?.message}>
                  <Input id="longitude" type="number" step="any" {...register("longitude", { setValueAs: num })} placeholder="43.67" />
                </FormField>
                <div className="flex items-end">
                  <Button type="button" variant="ghost" className="h-10" disabled={lat == null}
                    onClick={() => { setValue("latitude", undefined, { shouldDirty: true }); setValue("longitude", undefined, { shouldDirty: true }); }}>
                    Effacer les coordonnées
                  </Button>
                </div>
                <div className="md:col-span-3">
                  <p className="mb-2 text-xs text-muted-foreground">Cliquez sur la carte pour placer le projet (Madagascar : latitude -26 à -11, longitude 43 à 51).</p>
                  <div className="overflow-hidden rounded-lg border p-1">
                    <LocationPicker
                      value={lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : null}
                      onChange={(p) => { setValue("latitude", p.lat, { shouldDirty: true, shouldValidate: true }); setValue("longitude", p.lng, { shouldDirty: true, shouldValidate: true }); }}
                      className="h-80"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Investissement estimé" htmlFor="estimatedInvestment" error={errors.estimatedInvestment?.message}
                  hint={watched.estimatedInvestment ? formatAmountFull(Number(watched.estimatedInvestment), watched.currency) : undefined}>
                  <div className="flex gap-2">
                    <Input id="estimatedInvestment" type="number" min={0} step="any" className="flex-1" {...register("estimatedInvestment", { setValueAs: num })} />
                    <Controller control={control} name="currency" render={({ field }) => (
                      <SimpleSelect value={field.value ?? "USD"} onChange={(v) => field.onChange(v ?? "USD")} className="w-24"
                        options={["USD", "EUR", "MGA"].map((c) => ({ value: c, label: c }))} />
                    )} />
                  </div>
                </FormField>
                <FormField label="Modèle d'investissement">
                  <Controller control={control} name="investmentModel" render={({ field }) => (
                    <SimpleSelect value={field.value} onChange={(v) => field.onChange(v ?? undefined)} allLabel="Non précisé"
                      options={[...new Set([...INVESTMENT_MODELS, ...(field.value ? [field.value] : [])])].map((t) => ({ value: t, label: t }))} />
                  )} />
                </FormField>
                {([
                  ["potential", "Potentiel économique", "Production, emplois, retombées attendues…"],
                  ["targetMarket", "Marché cible", "Clients visés, débouchés à l'export…"],
                  ["resources", "Ressources disponibles", "Foncier, matières premières, main-d'œuvre…"],
                  ["infrastructures", "Infrastructures existantes", "Routes, port, énergie, eau…"],
                  ["zoneAdvantages", "Avantages de la zone", "Atouts du site, incitations…"],
                ] as const).map(([name, label, placeholder]) => (
                  <FormField key={name} label={label} htmlFor={name} error={errors[name]?.message} className={name === "zoneAdvantages" ? "md:col-span-2" : undefined}>
                    <Textarea id={name} rows={4} placeholder={placeholder} {...register(name, { setValueAs: text })} />
                  </FormField>
                ))}
              </div>
            )}

            {step === 3 && o && (
              <div className="space-y-6">
                <section className="space-y-3">
                  <h3 className="font-semibold">Photothèque</h3>
                  <MediaGallery opportunityId={o.id} media={o.media} onChange={() => detail.refetch()} />
                </section>
                <section className="space-y-3">
                  <h3 className="font-semibold">Documents (fiche projet, études, brochures…)</h3>
                  <DocumentUploader opportunityId={o.id} onUploaded={() => detail.refetch()} />
                  <DocumentList documents={o.documents} onChange={() => detail.refetch()} />
                </section>
              </div>
            )}

            {step === 4 && o && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-low/70 p-4">
                  <span className="text-sm text-muted-foreground">Statut actuel :</span>
                  <StatusBadge kind="opportunity" status={o.status} />
                  {o.publishedAt && <span className="text-xs text-muted-foreground">Publiée le {formatDate(o.publishedAt)}</span>}
                </div>
                {isDirty && <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Des modifications ne sont pas enregistrées : elles le seront avant le changement de statut.</p>}
                {o.transitions.length ? (
                  <div className="flex flex-wrap gap-2">
                    {o.transitions.map((to) => (
                      <Button
                        key={to} type="button" disabled={changeStatus.isPending}
                        variant={to === "publiee" || to === "en_verification" ? "default" : to === "archivee" || to === "suspendue" ? "destructive" : "outline"}
                        className="h-10 px-4"
                        onClick={() => transition(to)}
                      >
                        {to === "en_verification" ? <Send /> : to === "publiee" ? <Eye /> : null} {ACTION_LABELS[to]}
                      </Button>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">Aucune action disponible pour ce statut.</p>}
                {!o.canPublish && (
                  <p className="text-xs text-muted-foreground">
                    Vous n&apos;avez pas la permission de publication : soumettez le dossier à validation, un agent habilité ou un administrateur le publiera.
                  </p>
                )}
                <dl className="grid gap-3 text-sm sm:grid-cols-3">
                  {[["Consultations", o.stats.views, Eye], ["Favoris", o.stats.favorites, Heart], ["Demandes d'intérêt", o.stats.requests, Send]].map(([label, value, Icon]) => {
                    const I = Icon as typeof Eye;
                    return (
                      <div key={label as string} className="rounded-lg border p-3">
                        <dt className="label-caps flex items-center gap-1 text-muted-foreground"><I className="size-3" /> {label as string}</dt>
                        <dd className="tabular mt-1 text-xl font-bold">{value as number}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}
          </Panel>

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" className="h-10 bg-white" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft /> Étape précédente
            </Button>
            {step < STEPS.length - 1 && (
              <Button type="button" className="h-10" onClick={next} disabled={saving}>
                {step === 2 && !id ? "Enregistrer et ajouter les documents" : "Étape suivante"} <ArrowRight />
              </Button>
            )}
          </div>
        </form>

        <aside className="space-y-6">
          {o && (
            <Panel title="Dossier" icon={FileText}>
              <dl className="space-y-2 text-sm">
                {[
                  ["Référence", o.reference ?? "—"], ["Statut", <StatusBadge key="s" kind="opportunity" status={o.status} />],
                  ["Créé par", o.createdByName ?? "—"], ["Créé le", formatDate(o.createdAt)], ["Mis à jour", formatDate(o.updatedAt)],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex items-center justify-between gap-3 border-b pb-2 last:border-0">
                    <dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          )}
          <Panel title="Complétude du dossier" description={`${score} / ${checklist.length} éléments`}>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(score / checklist.length) * 100}%` }} />
            </div>
            <ul className="space-y-2 text-sm">
              {checklist.map((c) => (
                <li key={c.label} className={cn("flex items-center gap-2", c.ok ? "text-foreground" : "text-muted-foreground")}>
                  {c.ok ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Circle className="size-4" />} {c.label}
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
