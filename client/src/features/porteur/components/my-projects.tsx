import {
  ArrowRight, ChevronDown, ChevronRight, Clock, Eye, FileText, FilePlus2, FolderKanban, Globe, Headset, ImageIcon, MessageSquareWarning,
  Pencil, RotateCcw, Search, Users, Workflow,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { OpportunityCover } from "@/components/common/opportunity-cover";
import { SimpleSelect } from "@/components/common/simple-select";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { OPPORTUNITY_STATUSES, type OpportunityStatus } from "@/config/constants";
import { useSession } from "@/lib/auth-client";
import { formatAmount, formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PorteurProjectRow } from "@/types";
import { completeness } from "../completeness";
import { useMyProjects } from "../hooks";
import { PORTEUR_STATUS } from "../status";
import { AlertStrip, GradeScale, MonoRef, OpsHeader, Pill, StatTile } from "./ops-ui";
import { PorteurStatusBadge, ProgressSegments } from "./project-progress";

// Parcours d'un dossier, de la saisie à la publication (cartes numérotées)
const PROCEDURE = [
  { step: "Brouillon", who: "Vous", title: "Décrire le projet", detail: "Titre, secteur, localisation, montant", box: "Formulaire en 3 étapes", tone: "border-primary/30 bg-accent/60", head: "text-primary" },
  { step: "Pièces", who: "Vous", title: "Joindre les pièces", detail: "Photos du site, plan d'affaires, étude", box: "PDF, DOCX, JPG, PNG", tone: "bg-white", head: "text-secondary" },
  { step: "Transmission", who: "Vous", title: "Envoyer à l'EDBM", detail: "Statut « Opportunité à vérifier »", box: "Agent EDBM alerté", tone: "border-amber-200 bg-amber-50/60", head: "text-amber-700" },
  { step: "Examen", who: "EDBM", title: "Instruction du dossier", detail: "Validation ou demande de compléments", box: "Réponse par e-mail", tone: "border-blue-200 bg-blue-50/60", head: "text-blue-700" },
  { step: "Publication", who: "EDBM", title: "Catalogue investisseurs", detail: "Fiche publique, carte interactive", box: "Demandes d'intérêt suivies", tone: "border-emerald-200 bg-emerald-50/60", head: "text-emerald-700" },
];

function Procedure() {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold"><Workflow className="size-4 text-primary" /> Parcours d&apos;un projet déposé en ligne</h2>
        <p className="rounded bg-accent px-2 py-1 font-mono text-[11px] text-primary">
          Brouillon → Opportunité à vérifier → Validée → Publiée
        </p>
      </div>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {PROCEDURE.map((p, i) => (
          <li key={p.step} className={cn("flex flex-col rounded-lg border p-3", p.tone)}>
            <p className={cn("label-caps flex justify-between text-[10px]", p.head)}>
              <span>{i + 1}. {p.step}</span><span className="font-mono normal-case">{p.who}</span>
            </p>
            <p className="mt-1.5 font-semibold text-primary-dark">{p.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{p.detail}</p>
            <p className="mt-auto pt-3"><span className="block rounded border bg-white px-2 py-1 text-[11px] text-secondary">{p.box}</span></p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const iconBtn = "flex size-8 items-center justify-center rounded-md text-secondary transition hover:bg-accent hover:text-primary";

// Ligne dépliée : indicateurs du dossier, complétude et prochaine action
function RowDetail({ p }: { p: PorteurProjectRow }) {
  const c = completeness(p);
  const metrics = [
    { label: "Photos", value: p.media, icon: ImageIcon },
    { label: "Documents", value: p.documents, icon: FileText },
    { label: "Investisseurs intéressés", value: p.status === "publiee" ? p.requests : "—", icon: Users },
    { label: "Dernière mise à jour", value: timeAgo(p.updatedAt), icon: Clock },
  ];
  return (
    <div className="space-y-4 bg-surface-low/50 px-5 py-5">
      <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="size-3.5" /> {label}</p>
            <p className="tabular mt-1 text-xl font-bold text-primary-dark">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <GradeScale label={`Complétude du dossier · ${c.done}/${c.total}`} grade={c.grade} ratio={c.ratio} />
          <ul className="flex flex-wrap gap-1.5">
            {c.items.map((i) => (
              <li key={i.label} className={cn("rounded border px-2 py-0.5 text-[11px]", i.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-dashed bg-white text-muted-foreground")}>
                {i.ok ? "✓" : "○"} {i.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-secondary">Prochaine étape</p>
          {p.pendingNote ? (
            <p className="rounded-md border border-l-4 border-amber-200 border-l-amber-500 bg-white px-3 py-2 text-sm whitespace-pre-line">
              <span className="mb-0.5 block text-xs font-semibold text-amber-700">Remarque de l&apos;EDBM</span>{p.pendingNote}
            </p>
          ) : (
            <p className="rounded-md border bg-white px-3 py-2 text-sm text-secondary">{PORTEUR_STATUS[p.status].hint}.</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Link to={`/porteur/projets/${p.id}`} className={cn(buttonVariants(), "h-9 px-3")}><Eye /> Ouvrir le dossier</Link>
            {p.status === "brouillon" && (
              <Link to={`/porteur/projets/${p.id}/modifier`} className={cn(buttonVariants({ variant: "outline" }), "h-9 bg-white px-3")}><Pencil /> Modifier</Link>
            )}
            {p.status === "publiee" && (
              <Link to={`/opportunites/${p.slug}`} target="_blank" className={cn(buttonVariants({ variant: "outline" }), "h-9 bg-white px-3")}><Globe /> Fiche publique</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Registry({ projects }: { projects: PorteurProjectRow[] }) {
  // La recherche de la barre supérieure arrive par ?q=
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const setQ = (v: string) => setParams(v ? { q: v } : {}, { replace: true });
  const [status, setStatus] = useState<OpportunityStatus | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(projects.find((p) => p.pendingNote)?.id ?? null);

  const sectors = useMemo(() => [...new Map(projects.map((p) => [p.sectorId, p.sector])).entries()], [projects]);
  const rows = projects.filter((p) => {
    const text = `${p.title} ${p.reference ?? ""} ${p.region} ${p.district ?? ""}`.toLowerCase();
    return (!q || text.includes(q.toLowerCase())) && (!status || p.status === status) && (!sector || p.sectorId === sector);
  });
  const filtered = !!(q || status || sector);

  return (
    <>
      {/* Filtres */}
      <section className="grid gap-3 rounded-xl border bg-white p-4 shadow-card md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-secondary">Recherche</span>
          <span className="relative block">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Titre, référence, localité…" className="h-10 pl-9" />
          </span>
        </label>
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-secondary">Statut du dossier</span>
          <SimpleSelect value={status} onChange={(v) => setStatus(v as OpportunityStatus | null)} allLabel="Tous les statuts"
            options={OPPORTUNITY_STATUSES.map((s) => ({ value: s, label: PORTEUR_STATUS[s].label }))} />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-secondary">Secteur</span>
          <SimpleSelect value={sector} onChange={setSector} allLabel="Tous les secteurs" options={sectors.map(([value, label]) => ({ value, label }))} />
        </div>
        <button type="button" onClick={() => { setQ(""); setStatus(null); setSector(null); }} disabled={!filtered}
          className="flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm text-secondary hover:bg-muted disabled:opacity-40" title="Réinitialiser les filtres">
          <RotateCcw className="size-4" /> <span className="md:sr-only">Réinitialiser</span>
        </button>
      </section>

      {/* Registre */}
      <section className="overflow-hidden rounded-xl border bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <FolderKanban className="size-4 text-primary" /> Registre de mes projets
            <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[11px] text-primary">{rows.length} dossier(s)</span>
          </h2>
          <p className="text-xs text-muted-foreground">Trié par : <span className="font-semibold text-foreground underline underline-offset-2">dernière mise à jour</span></p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="label-caps border-b bg-muted/40 text-left text-muted-foreground">
                <th className="w-10 px-3 py-3" aria-label="Déplier" />
                <th className="px-3 py-3">Référence</th>
                <th className="px-3 py-3">Projet</th>
                <th className="px-3 py-3 text-right">Montant</th>
                <th className="px-3 py-3">Avancement</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const expanded = open === p.id;
                return (
                  <Fragment key={p.id}>
                    <tr className={cn("border-b transition hover:bg-muted/30", expanded && "bg-accent/40", p.pendingNote && "border-l-4 border-l-amber-500")}>
                      <td className="px-3 py-3">
                        <button type="button" onClick={() => setOpen(expanded ? null : p.id)} className={iconBtn} aria-expanded={expanded} aria-label={expanded ? "Replier" : "Déplier"}>
                          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <MonoRef className="whitespace-nowrap">{p.reference ?? "—"}</MonoRef>
                        <p className="text-[11px] whitespace-nowrap text-muted-foreground">Créé le {formatDate(p.createdAt)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="size-10 shrink-0 overflow-hidden rounded-md">
                            <OpportunityCover coverKey={p.coverKey} sectorSlug={p.sectorSlug} title={p.title} iconClassName="size-4" />
                          </span>
                          <span className="min-w-0">
                            <Link to={`/porteur/projets/${p.id}`} className="block max-w-64 truncate font-semibold hover:text-primary xl:max-w-80">{p.title}</Link>
                            <span className="block truncate text-xs text-muted-foreground">{p.sector} · {[p.district, p.region].filter(Boolean).join(", ")}</span>
                          </span>
                        </div>
                      </td>
                      <td className="tabular px-3 py-3 text-right font-semibold whitespace-nowrap">
                        {p.estimatedInvestment != null ? formatAmount(p.estimatedInvestment, p.currency) : <span className="font-normal text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-3"><ProgressSegments status={p.status} /></td>
                      <td className="px-3 py-3">
                        {p.pendingNote ? (
                          <Pill className="border-amber-300 bg-amber-50 text-amber-800" icon={MessageSquareWarning}>À compléter</Pill>
                        ) : <PorteurStatusBadge status={p.status} />}
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex justify-end gap-1">
                          <Link to={`/porteur/projets/${p.id}`} className={iconBtn} aria-label={`Ouvrir ${p.title}`} title="Ouvrir le dossier"><Eye className="size-4" /></Link>
                          {p.status === "brouillon" && (
                            <Link to={`/porteur/projets/${p.id}/modifier`} className={iconBtn} aria-label={`Modifier ${p.title}`} title="Modifier"><Pencil className="size-4" /></Link>
                          )}
                          {p.status === "publiee" && (
                            <Link to={`/opportunites/${p.slug}`} target="_blank" className={iconBtn} aria-label="Fiche publique" title="Fiche publique"><Globe className="size-4" /></Link>
                          )}
                        </span>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b">
                        <td colSpan={7} className="p-0"><RowDetail p={p} /></td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!rows.length && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">{projects.length ? "Aucun projet ne correspond à ces filtres." : "Aucun projet déposé pour le moment."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
          Affichage de <b className="text-foreground">{rows.length}</b> sur <b className="text-foreground">{projects.length}</b> projet(s) déposé(s)
        </p>
      </section>
    </>
  );
}

export function MyProjects() {
  const { data: session } = useSession();
  const { data, isPending } = useMyProjects();
  const firstName = session?.user.name.split(" ")[0];
  const projects = data ?? [];

  const count = (...s: OpportunityStatus[]) => projects.filter((p) => s.includes(p.status)).length;
  const toFix = projects.filter((p) => p.pendingNote);
  const media = projects.reduce((s, p) => s + p.media, 0);
  const documents = projects.reduce((s, p) => s + p.documents, 0);
  const requests = projects.reduce((s, p) => s + p.requests, 0);

  return (
    <div className="space-y-6">
      <OpsHeader
        icon={FolderKanban}
        eyebrow="Espace porteur · Antenne EDBM Toliara"
        title={firstName ? `Bonjour ${firstName}, voici vos projets` : "Mes projets d'investissement"}
        description="Déposez vos projets auprès de l'antenne EDBM de Toliara sans vous déplacer, joignez vos pièces et suivez chaque étape de leur instruction."
        actions={
          <>
            <Link to="/contact" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}><Headset /> Contacter l&apos;antenne</Link>
            <Link to="/porteur/projets/nouveau" className={cn(buttonVariants(), "h-10 px-4")}><FilePlus2 /> Déposer un projet</Link>
          </>
        }
      />

      {isPending ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          {!projects.length && (
            <AlertStrip
              tone="info"
              icon={FilePlus2}
              title="Aucun projet déposé pour le moment"
              action={<Link to="/porteur/projets/nouveau" className={cn(buttonVariants(), "h-9 px-3")}>Déposer mon premier projet <ArrowRight /></Link>}
            >
              Présentez votre projet en quelques minutes : il reste un brouillon modifiable tant que vous ne l&apos;avez pas transmis à l&apos;EDBM.
            </AlertStrip>
          )}
          {toFix.length > 0 && (
            <AlertStrip
              tone="warning"
              icon={MessageSquareWarning}
              title={`${toFix.length} projet(s) en attente de vos compléments`}
              action={<Link to={`/porteur/projets/${toFix[0]!.id}`} className={cn(buttonVariants(), "h-9 px-3")}>Voir la remarque</Link>}
            >
              L&apos;EDBM vous a renvoyé « {toFix[0]!.title} »{toFix.length > 1 ? " et d'autres projets" : ""} : corrigez-le puis transmettez-le à nouveau.
            </AlertStrip>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Projets déposés" value={projects.length} icon={FolderKanban}
              segments={[
                { label: "Brouillons", value: count("brouillon"), className: "bg-amber-400" },
                { label: "En cours", value: count("en_verification", "validee"), className: "bg-primary" },
                { label: "Publiés", value: count("publiee"), className: "bg-emerald-500" },
                ...(count("suspendue", "archivee") ? [{ label: "Suspendus / archivés", value: count("suspendue", "archivee"), className: "bg-slate-400" }] : []),
              ]}
            />
            <StatTile label="En examen par l'EDBM" value={count("en_verification", "validee")} icon={Clock} tone="blue"
              sub={<>{count("en_verification")} transmis · {count("validee")} validé(s), bientôt publié(s)</>} />
            <StatTile label="Publiés au catalogue" value={count("publiee")} icon={Globe} tone="green"
              sub={<><b className="text-foreground">{requests}</b> demande(s) d&apos;intérêt d&apos;investisseurs</>} />
            <StatTile
              label="Pièces jointes" value={media + documents} icon={FileText} tone={toFix.length ? "amber" : "primary"}
              segments={[
                { label: "Photos", value: media, className: "bg-primary" },
                { label: "Documents", value: documents, className: "bg-ochre" },
              ]}
            />
          </div>

          {!projects.length && <Procedure />}

          <Registry projects={projects} />
        </>
      )}
    </div>
  );
}
