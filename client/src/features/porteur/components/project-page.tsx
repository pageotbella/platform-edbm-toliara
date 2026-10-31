import {
  CheckCircle2, Clock, Download, ExternalLink, FileText, History, ImageIcon, MessageSquareWarning, Pencil, Send, Trash2, Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { Panel } from "@/components/common/panel";
import { SimpleSelect } from "@/components/common/simple-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { DOCUMENT_TYPES } from "@/config/constants";
import { documentsApi } from "@/features/documents/api";
import { MediaGallery } from "@/features/documents/components/attachments";
import { useDeleteDocument } from "@/features/documents/hooks";
import { fileUrl, formatAmountFull, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PorteurProject } from "@/types";
import { useDeleteProject, useMyProject, useSubmitProject } from "../hooks";
import { PORTEUR_STATUS } from "../status";
import { PorteurStatusBadge, ProjectProgress } from "./project-progress";

const ext = (key: string) => key.split(".").pop()?.toUpperCase() ?? "DOC";

// Ce que le porteur doit savoir (ou faire) maintenant
function NextStep({ p, onSubmit }: { p: PorteurProject; onSubmit: () => void }) {
  if (p.status === "brouillon") {
    const returned = !!p.lastNote;
    return (
      <section className={cn("rounded-xl border p-5 md:p-6", returned ? "border-amber-300 bg-amber-50" : "border-primary/30 bg-accent")}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className={cn("flex items-center gap-2 font-bold", returned ? "text-amber-900" : "text-primary")}>
              {returned ? <MessageSquareWarning className="size-5" /> : <Send className="size-5" />}
              {returned ? "L'EDBM vous demande des compléments" : "Prochaine étape : transmettre votre projet à l'EDBM"}
            </p>
            {returned ? (
              <blockquote className="rounded-md border-l-4 border-amber-500 bg-white px-4 py-3 text-sm whitespace-pre-line">{p.lastNote}</blockquote>
            ) : (
              <p className="text-sm text-secondary">
                Vérifiez vos informations, ajoutez des photos et documents (plan d'affaires, étude…), puis transmettez le projet.
                Rien n'est envoyé tant que vous ne cliquez pas sur « Transmettre ».
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link to={`/porteur/projets/${p.id}/modifier`} className={cn(buttonVariants({ variant: "outline" }), "h-10 bg-white")}>
              <Pencil /> Modifier
            </Link>
            <Button className="h-10 px-4" onClick={onSubmit}>
              <Send /> {returned ? "Transmettre à nouveau" : "Transmettre à l'EDBM"}
            </Button>
          </div>
        </div>
      </section>
    );
  }
  const messages: Record<string, { icon: typeof Clock; title: string; text: string }> = {
    en_verification: {
      icon: Clock,
      title: "Votre projet est entre les mains de l'EDBM",
      text: "Un agent de l'antenne de Toliara l'étudie. Vous recevrez un e-mail dès qu'il sera validé ou si des compléments sont nécessaires. Vous pouvez encore ajouter des documents.",
    },
    validee: { icon: CheckCircle2, title: "Votre projet a été validé", text: "Il sera prochainement publié dans le catalogue des opportunités." },
    publiee: { icon: CheckCircle2, title: "Votre projet est en ligne", text: "Les investisseurs peuvent le consulter et manifester leur intérêt auprès de l'EDBM, qui reviendra vers vous." },
    suspendue: { icon: Clock, title: "Votre projet est suspendu", text: "Il n'est temporairement plus visible. Contactez l'antenne EDBM pour en savoir plus." },
    archivee: { icon: Clock, title: "Votre projet est archivé", text: "Il n'est plus suivi. Contactez l'antenne EDBM pour le réactiver." },
  };
  const m = messages[p.status]!;
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-card md:flex-row md:items-center md:justify-between md:p-6">
      <div className="flex gap-3">
        <m.icon className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="font-bold">{m.title}</p>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{m.text}</p>
        </div>
      </div>
      {p.status === "publiee" && (
        <Link to={`/opportunites/${p.slug}`} target="_blank" className={cn(buttonVariants({ variant: "outline" }), "h-10 shrink-0")}>
          <ExternalLink /> Voir la fiche publique
        </Link>
      )}
    </section>
  );
}

// Pièces jointes du porteur : réservées aux membres connectés, l'EDBM décide de leur diffusion
function ProjectDocuments({ p, onChange }: { p: PorteurProject; onChange: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<string>("Fiche projet");
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<PorteurProject["documents"][number] | null>(null);
  const remove = useDeleteDocument({
    onSuccess: () => { toast.success("Document supprimé"); onChange(); },
    onError: (e) => toast.error(e.message),
  });

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      try {
        await documentsApi.upload({ file, opportunityId: p.id, kind: "document", type });
        toast.success(`« ${file.name} » ajouté`);
      } catch (e) {
        toast.error(`${file.name} : ${(e as Error).message}`);
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    onChange();
  };

  return (
    <div className="space-y-3">
      {p.documents.length ? (
        <ul className="space-y-2">
          {p.documents.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-md border bg-white p-3">
              <span className="label-caps flex h-10 w-12 shrink-0 items-center justify-center rounded bg-red-50 text-red-700">{ext(d.fileKey)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.type} · ajouté le {formatDate(d.createdAt)}</p>
              </div>
              <a href={fileUrl(d.fileKey)} target="_blank" rel="noopener" className="flex size-8 items-center justify-center rounded text-secondary hover:bg-muted" aria-label={`Télécharger ${d.name}`}>
                <Download className="size-4" />
              </a>
              {p.canEditFiles && (
                <button type="button" onClick={() => setToDelete(d)} className="flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-red-50 hover:text-red-700" aria-label={`Supprimer ${d.name}`}>
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun document pour l'instant.</p>
      )}
      {p.canEditFiles && (
        <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed bg-surface-low/50 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <p className="text-[13px] font-semibold text-secondary">Type de document</p>
            <SimpleSelect value={type} onChange={(v) => setType(v ?? "Fiche projet")} options={DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))} />
          </div>
          <Button type="button" className="h-10" disabled={busy} onClick={() => input.current?.click()}>
            <Upload /> {busy ? "Envoi…" : "Ajouter des documents"}
          </Button>
          <input ref={input} type="file" multiple hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={(e) => onFiles(e.target.files)} />
        </div>
      )}
      {p.canEditFiles && <p className="text-xs text-muted-foreground">PDF, Word, Excel ou PowerPoint · 20 Mo maximum par fichier.</p>}
      <ConfirmDialog
        open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}
        title="Supprimer ce document ?" description={<>« {toDelete?.name} » sera définitivement supprimé.</>}
        confirmLabel="Supprimer" destructive onConfirm={() => toDelete && remove.mutate({ id: toDelete.id })}
      />
    </div>
  );
}

function Summary({ p }: { p: PorteurProject }) {
  const rows: [string, string | null][] = [
    ["Secteur", p.sector],
    ["Type de projet", p.projectType],
    ["Localisation", [p.commune, p.district, p.region].filter(Boolean).join(", ")],
    ["Montant recherché", p.estimatedInvestment != null ? formatAmountFull(p.estimatedInvestment, p.currency) : null],
    ["Partenariat recherché", p.investmentModel],
  ];
  const texts: [string, string | null][] = [
    ["Potentiel du projet", p.potential],
    ["Clients visés", p.targetMarket],
    ["Ce dont vous disposez déjà", p.resources],
  ];
  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 whitespace-pre-line">{p.description}</p>
      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="border-b pb-2">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className={cn("font-medium", !v && "text-muted-foreground italic")}>{v || "Non renseigné"}</dd>
          </div>
        ))}
      </dl>
      {texts.some(([, v]) => v) && (
        <dl className="space-y-3 text-sm">
          {texts.filter(([, v]) => v).map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="whitespace-pre-line">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function ProjectPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: p, isPending, error, refetch } = useMyProject({ id }, { retry: false });
  const [confirm, setConfirm] = useState<"submit" | "delete" | null>(null);
  const submit = useSubmitProject({
    onSuccess: () => { toast.success("Projet transmis à l'EDBM : un accusé de réception vous a été envoyé par e-mail"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const remove = useDeleteProject({
    onSuccess: () => { toast.success("Projet retiré"); navigate("/porteur", { replace: true }); },
    onError: (e) => toast.error(e.message),
  });

  if (isPending) return <PageSkeleton />;
  if (error || !p) {
    return <EmptyState title="Projet introuvable" action={<Link to="/porteur" className={buttonVariants({ variant: "outline" })}>Mes projets</Link>} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Mes projets", href: "/porteur" }, { label: p.title }]}
        eyebrow={`${p.reference ?? "Projet"} · déposé le ${formatDate(p.createdAt)}`}
        title={p.title}
        actions={<PorteurStatusBadge status={p.status} className="px-3 py-1.5" />}
      />

      <div className="rounded-xl border bg-white p-5 shadow-card">
        <ProjectProgress status={p.status} />
        <p className="mt-3 text-center text-sm text-muted-foreground">{PORTEUR_STATUS[p.status].hint}</p>
      </div>

      <NextStep p={p} onSubmit={() => setConfirm("submit")} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Panel
            title="Mon projet"
            icon={FileText}
            action={p.canEdit ? <Link to={`/porteur/projets/${p.id}/modifier`} className="text-sm font-semibold text-primary hover:underline">Modifier</Link> : undefined}
          >
            <Summary p={p} />
          </Panel>
          <Panel title="Photos" icon={ImageIcon} description={p.canEditFiles ? "La photo marquée « Couverture » illustre votre projet dans le catalogue." : undefined}>
            {p.canEditFiles ? (
              <MediaGallery opportunityId={p.id} media={p.media} onChange={() => refetch()} />
            ) : p.media.length ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {p.media.map((m) => <img key={m.id} src={fileUrl(m.fileKey)} alt={m.title ?? ""} className="aspect-[4/3] w-full rounded-lg border object-cover" />)}
              </div>
            ) : <p className="text-sm text-muted-foreground">Aucune photo.</p>}
          </Panel>
          <Panel title="Documents" icon={FileText} description="Plan d'affaires, étude de faisabilité, autorisations… Ils restent visibles des seuls membres connectés, sauf décision de l'EDBM.">
            <ProjectDocuments p={p} onChange={() => refetch()} />
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Historique" icon={History}>
            <ol className="relative space-y-4 border-l pl-5">
              {[...p.history].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className={cn("absolute -left-[26px] mt-1 size-3 rounded-full border-2 border-white", i === 0 ? "bg-primary" : "bg-border-strong")} />
                  <p className="text-sm font-semibold">{i === p.history.length - 1 ? "Projet créé" : h.status === "brouillon" && h.note ? "Renvoyé pour compléments" : PORTEUR_STATUS[h.status].label}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(h.at)}</p>
                  {h.note && <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs whitespace-pre-line text-amber-900">{h.note}</p>}
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="Besoin d'aide ?">
            <p className="text-sm text-muted-foreground">Une question sur votre dossier ? L'antenne EDBM de Toliara vous répond.</p>
            <Link to="/contact" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">Contacter l'antenne →</Link>
          </Panel>
          {p.canDelete && (
            <Button variant="outline" className="h-10 w-full text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => setConfirm("delete")}>
              <Trash2 /> Retirer ce projet
            </Button>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirm === "submit"} onOpenChange={(o) => !o && setConfirm(null)}
        title="Transmettre votre projet à l'EDBM ?"
        description="Un agent va l'étudier. Pendant l'examen, vous ne pourrez plus modifier les informations, mais vous pourrez encore ajouter des photos et documents."
        confirmLabel="Transmettre"
        onConfirm={() => submit.mutate(p.id)}
      />
      <ConfirmDialog
        open={confirm === "delete"} onOpenChange={(o) => !o && setConfirm(null)}
        title="Retirer ce projet ?"
        description={<>« {p.title} », ses photos et ses documents seront définitivement supprimés{p.status !== "brouillon" ? " et l'EDBM en sera informée" : ""}.</>}
        confirmLabel="Retirer le projet" destructive
        onConfirm={() => remove.mutate(p.id)}
      />
    </div>
  );
}
