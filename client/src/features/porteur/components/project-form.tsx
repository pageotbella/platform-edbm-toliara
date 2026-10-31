import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, ClipboardList, Coins, FilePlus2, Lightbulb, MapPin, Pencil, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, type FieldPath, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { FormField } from "@/components/common/form-field";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { SimpleSelect } from "@/components/common/simple-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { INVESTMENT_MODELS, PROJECT_TYPES } from "@/config/constants";
import { LocationPicker } from "@/features/map/components";
import { useFilterOptions } from "@/features/opportunities/hooks";
import { formatAmountFull } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PorteurProject } from "@/types";
import { useCreateProject, useMyProject, useUpdateProject } from "../hooks";
import { completeness } from "../completeness";
import { type ProjectInput, projectInputSchema, type ProjectOutput } from "../schemas";
import { GradeScale, MonoRef, OpsHeader } from "./ops-ui";

// Trois étapes courtes : seuls le titre, le secteur, la région et la description sont obligatoires
const STEPS: { title: string; hint: string; icon: typeof Lightbulb; fields: FieldPath<ProjectInput>[] }[] = [
  { title: "Votre projet", hint: "Titre, secteur, description", icon: Lightbulb, fields: ["title", "sectorId", "projectType", "description"] },
  { title: "Localisation", hint: "Région, district, commune", icon: MapPin, fields: ["regionId", "districtId", "communeId", "latitude", "longitude"] },
  { title: "Chiffres clés", hint: "Montant, marché, ressources", icon: Coins, fields: ["estimatedInvestment", "currency", "investmentModel", "potential", "targetMarket", "resources"] },
];

const num = (v: unknown) => (v === "" || v == null || Number.isNaN(Number(v)) ? undefined : Number(v));
const text = (v: unknown) => (v === "" || v == null ? undefined : String(v));

function toForm(p: PorteurProject): ProjectInput {
  const opt = <T,>(v: T | null) => v ?? undefined;
  return {
    title: p.title, description: p.description, sectorId: p.sectorId, projectType: opt(p.projectType),
    regionId: p.regionId, districtId: opt(p.districtId), communeId: opt(p.communeId),
    latitude: opt(p.latitude), longitude: opt(p.longitude),
    estimatedInvestment: opt(p.estimatedInvestment), currency: (p.currency as "USD") ?? "USD",
    investmentModel: opt(p.investmentModel), potential: opt(p.potential), targetMarket: opt(p.targetMarket), resources: opt(p.resources),
  };
}

function ProjectForm({ project }: { project?: PorteurProject }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const options = useFilterOptions();
  const create = useCreateProject();
  const update = useUpdateProject();
  const saving = create.isPending || update.isPending;

  const { register, control, handleSubmit, setValue, trigger, formState: { errors } } = useForm<ProjectInput, unknown, ProjectOutput>({
    resolver: zodResolver(projectInputSchema),
    defaultValues: project ? toForm(project) : { currency: "USD" },
  });
  const regionId = useWatch({ control, name: "regionId" });
  const districtId = useWatch({ control, name: "districtId" });
  const lat = useWatch({ control, name: "latitude" });
  const lng = useWatch({ control, name: "longitude" });
  const values = useWatch({ control });

  const opts = options.data;
  const districts = (opts?.districts ?? []).filter((d) => d.regionId === regionId).map((d) => ({ value: d.id, label: d.name }));
  const communes = (opts?.communes ?? []).filter((c) => c.districtId === districtId).map((c) => ({ value: c.id, label: c.name }));

  const onSubmit = handleSubmit(
    async (data) => {
      try {
        if (project) {
          await update.mutateAsync({ id: project.id, data });
          toast.success("Modifications enregistrées");
          navigate(`/porteur/projets/${project.id}`);
        } else {
          const row = await create.mutateAsync(data);
          toast.success("Projet enregistré : ajoutez maintenant vos photos et documents");
          navigate(`/porteur/projets/${row.id}`, { replace: true });
        }
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    () => {
      const first = STEPS.findIndex((s) => s.fields.some((f) => f in errors));
      if (first >= 0) setStep(first);
      toast.error("Certains champs sont à corriger");
    },
  );

  const next = async () => {
    if (await trigger(STEPS[step]!.fields)) setStep((s) => s + 1);
  };
  const last = step === STEPS.length - 1;

  return (
    <form onSubmit={onSubmit} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="overflow-hidden rounded-xl border bg-white shadow-card">
        {/* Étapes en onglets soulignés */}
        <div className="flex overflow-x-auto border-b" role="tablist" aria-label="Étapes du dépôt">
          {STEPS.map((st, i) => {
            const Icon = i < step ? Check : st.icon;
            return (
              <button
                key={st.title} type="button" role="tab" aria-selected={i === step}
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition",
                  i === step ? "border-primary text-primary" : i < step ? "border-transparent text-emerald-700 hover:bg-muted/50" : "border-transparent text-muted-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" /> <span className="hidden sm:inline">{i + 1}. {st.title}</span>
              </button>
            );
          })}
        </div>

        <div className="p-5 md:p-7">
          <p className="label-caps text-primary">Étape {step + 1} sur {STEPS.length} · {STEPS[step]!.hint}</p>
          <div className="mt-5 space-y-5">
          {step === 0 && (
            <>
              <FormField label="Titre du projet" htmlFor="title" error={errors.title?.message} required hint="Un titre court et parlant, par ex. « Unité de séchage de poisson à Morombe ».">
                <Input id="title" className="h-11" autoFocus {...register("title")} aria-invalid={!!errors.title} />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Secteur d'activité" error={errors.sectorId?.message} required>
                  <Controller control={control} name="sectorId" render={({ field }) => (
                    <SimpleSelect value={field.value} invalid={!!errors.sectorId} placeholder="Choisir un secteur"
                      options={(opts?.sectors ?? []).map((s) => ({ value: s.id, label: s.name }))}
                      onChange={(v) => field.onChange(v ?? undefined)} />
                  )} />
                </FormField>
                <FormField label="Type de projet">
                  <Controller control={control} name="projectType" render={({ field }) => (
                    <SimpleSelect value={field.value} allLabel="Non précisé" options={PROJECT_TYPES.map((t) => ({ value: t, label: t }))}
                      onChange={(v) => field.onChange(v ?? undefined)} />
                  )} />
                </FormField>
              </div>
              <FormField label="Présentation du projet" htmlFor="description" error={errors.description?.message} required
                hint="Expliquez simplement ce que vous voulez réaliser, pourquoi, et ce que vous recherchez (financement, partenaire…).">
                <Textarea id="description" rows={7} {...register("description")} aria-invalid={!!errors.description} />
              </FormField>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid gap-5 sm:grid-cols-3">
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
              </div>
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-secondary">Emplacement sur la carte <span className="font-normal text-muted-foreground">(facultatif)</span></p>
                <p className="text-xs text-muted-foreground">Cliquez sur la carte à l'endroit du projet. Vous pourrez le déplacer en cliquant ailleurs.</p>
                <LocationPicker
                  value={lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : null}
                  onChange={(p) => { setValue("latitude", p.lat, { shouldValidate: true }); setValue("longitude", p.lng, { shouldValidate: true }); }}
                  className="h-72"
                />
                {lat != null && lng != null && (
                  <button type="button" className="text-xs font-semibold text-primary hover:underline"
                    onClick={() => { setValue("latitude", undefined); setValue("longitude", undefined); }}>
                    Retirer le point
                  </button>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="rounded-md bg-surface-low px-4 py-3 text-sm text-secondary">
                Ces informations sont facultatives mais aident l'EDBM à présenter votre projet aux investisseurs. Remplissez ce que vous savez déjà.
              </p>
              <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
                <FormField label="Montant d'investissement recherché" htmlFor="estimatedInvestment" error={errors.estimatedInvestment?.message}>
                  <Input id="estimatedInvestment" type="number" min={0} step="any" inputMode="decimal" className="h-11"
                    {...register("estimatedInvestment", { setValueAs: num })} aria-invalid={!!errors.estimatedInvestment} />
                </FormField>
                <FormField label="Devise">
                  <Controller control={control} name="currency" render={({ field }) => (
                    <SimpleSelect value={field.value} className="sm:w-32" options={["USD", "EUR", "MGA"].map((c) => ({ value: c, label: c }))}
                      onChange={(v) => field.onChange(v ?? "USD")} />
                  )} />
                </FormField>
              </div>
              <FormField label="Type de partenariat recherché">
                <Controller control={control} name="investmentModel" render={({ field }) => (
                  <SimpleSelect value={field.value} allLabel="Non précisé" options={INVESTMENT_MODELS.map((m) => ({ value: m, label: m }))}
                    onChange={(v) => field.onChange(v ?? undefined)} />
                )} />
              </FormField>
              {([
                ["potential", "Potentiel du projet", "Production prévue, emplois créés, retombées pour la région…"],
                ["targetMarket", "Clients visés", "Marché local, national, export…"],
                ["resources", "Ce dont vous disposez déjà", "Terrain, matières premières, équipements, main-d'œuvre, autorisations…"],
              ] as const).map(([name, label, placeholder]) => (
                <FormField key={name} label={label} htmlFor={name} error={errors[name]?.message}>
                  <Textarea id={name} rows={3} placeholder={placeholder} {...register(name, { setValueAs: text })} />
                </FormField>
              ))}
            </>
          )}
          </div>
        </div>

        {/* Navigation entre les étapes */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 px-5 py-4 md:px-7">
          {step > 0 ? (
            <Button type="button" variant="outline" className="h-10 bg-white" onClick={() => setStep((st) => st - 1)}>
              <ArrowLeft /> Retour
            </Button>
          ) : (
            <Link to={project ? `/porteur/projets/${project.id}` : "/porteur"} className={cn(buttonVariants({ variant: "ghost" }), "h-10")}>Annuler</Link>
          )}
          {last ? (
            <Button type="submit" className="h-10 px-5" disabled={saving}>
              <Save /> {saving ? "Enregistrement…" : project ? "Enregistrer les modifications" : "Enregistrer mon projet"}
            </Button>
          ) : (
            <Button type="button" className="h-10 px-5" onClick={next}>
              Continuer <ArrowRight />
            </Button>
          )}
        </div>
      </section>

      <Summary project={project} values={values} sectors={opts?.sectors ?? []} regions={opts?.regions ?? []} districts={opts?.districts ?? []} />
    </form>
  );
}

// Récapitulatif du dossier, mis à jour pendant la saisie
function Summary({ project, values, sectors, regions, districts }: {
  project?: PorteurProject;
  values: Partial<ProjectInput>;
  sectors: { id: string; name: string }[];
  regions: { id: string; name: string }[];
  districts: { id: string; name: string }[];
}) {
  const name = (list: { id: string; name: string }[], id?: string) => list.find((x) => x.id === id)?.name;
  const district = name(districts, values.districtId);
  const c = completeness({
    description: values.description ?? "",
    estimatedInvestment: values.estimatedInvestment ?? null,
    district: district ?? null,
    latitude: values.latitude ?? null,
    media: project?.media.length ?? 0,
    documents: project?.documents.length ?? 0,
  });
  const rows: [string, React.ReactNode][] = [
    ["Titre", values.title],
    ["Secteur", name(sectors, values.sectorId)],
    ["Type", values.projectType],
    ["Localisation", [district, name(regions, values.regionId)].filter(Boolean).join(", ")],
    ["Montant", values.estimatedInvestment ? formatAmountFull(Number(values.estimatedInvestment), values.currency ?? "USD") : null],
    ["Partenariat", values.investmentModel],
  ];
  return (
    <aside className="overflow-hidden rounded-xl border bg-white shadow-card lg:sticky lg:top-20">
      <div className="bg-primary-dark px-5 py-4 text-white">
        <p className="label-caps flex items-center gap-1.5 text-brand-light"><ClipboardList className="size-3.5" /> Récapitulatif du dossier</p>
        <p className="mt-1 font-mono text-sm text-white/85">{project?.reference ?? "NOUVEAU DOSSIER"}</p>
      </div>
      <dl className="divide-y text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-3 px-5 py-2.5">
            <dt className="shrink-0 text-xs text-muted-foreground">{k}</dt>
            <dd className={cn("min-w-0 text-right font-medium break-words", !v && "font-normal text-muted-foreground")}>{v || "—"}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-2 border-t bg-surface-low/50 px-5 py-4">
        <GradeScale label={`Complétude · ${c.done}/${c.total}`} grade={c.grade} ratio={c.ratio} />
        <p className="text-xs text-muted-foreground">
          {project ? "Photos et documents se gèrent depuis la fiche du projet." : "Photos et documents s'ajoutent juste après l'enregistrement."}
          {" "}Rien n&apos;est envoyé à l&apos;EDBM tant que vous ne transmettez pas le projet.
        </p>
      </div>
    </aside>
  );
}

export function NewProjectPage() {
  return (
    <div className="space-y-6">
      <OpsHeader
        icon={FilePlus2}
        eyebrow={<><Link to="/porteur" className="hover:underline">Mes projets</Link> <span className="text-muted-foreground">/</span> Dépôt en ligne</>}
        title="Déposer un projet d'investissement"
        description="Présentez votre projet en trois étapes : il est enregistré comme brouillon, vous ajoutez ensuite vos pièces puis vous le transmettez à l'EDBM."
      />
      <ProjectForm />
    </div>
  );
}

export function EditProjectPage() {
  const { id = "" } = useParams();
  const { data, isPending, error } = useMyProject({ id }, { retry: false });
  const navigate = useNavigate();
  // Un projet en cours d'instruction n'est plus modifiable : retour à sa fiche
  useEffect(() => {
    if (data && !data.canEdit) navigate(`/porteur/projets/${id}`, { replace: true });
  }, [data, id, navigate]);

  if (isPending) return <PageSkeleton />;
  if (error || !data) {
    return <EmptyState title="Projet introuvable" action={<Link to="/porteur" className={buttonVariants({ variant: "outline" })}>Mes projets</Link>} />;
  }
  return (
    <div className="space-y-6">
      <OpsHeader
        icon={Pencil}
        eyebrow={<><Link to="/porteur" className="hover:underline">Mes projets</Link> <span className="text-muted-foreground">/</span> <MonoRef className="text-[11px]">{data.reference}</MonoRef></>}
        title="Modifier mon projet"
        description={<>« {data.title} » — enregistrez vos corrections, puis transmettez le projet depuis sa fiche.</>}
      />
      <ProjectForm project={data} />
    </div>
  );
}
