import {
  CheckCircle2, Circle, ClipboardList, Coins, Download, ExternalLink, FileText, FolderOpen, Headset, History, ImageIcon,
  MessageSquareWarning, Pencil, Send, Trash2, Upload, X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { SimpleSelect } from "@/components/common/simple-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { DOCUMENT_TYPES } from "@/config/constants";
import { documentsApi } from "@/features/documents/api";
import { MediaGallery } from "@/features/documents/components/attachments";
import { useDeleteDocument } from "@/features/documents/hooks";
import { fileUrl, formatAmountFull, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PorteurProject } from "@/types";
import { completeness } from "../completeness";
import { useDeleteProject, useMyProject, useSubmitProject } from "../hooks";
import { PORTEUR_STATUS } from "../status";
import { AlertStrip, GradeScale, MonoRef, OpsHeader, StatTile } from "./ops-ui";
import { PorteurStatusBadge, ProjectProgress } from "./project-progress";

const ext = (key: string) => key.split(".").pop()?.toUpperCase() ?? "DOC";

/** Bloc blanc à en-tête en petites capitales (sections de la fiche). */
function Block({ title, icon: Icon, action, children, bodyClassName }: {
  title: string;
  icon: typeof FileText;
  action?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3.5">
        <h2 className="label-caps flex items-center gap-2 text-secondary"><Icon className="size-4 text-primary" /> {title}</h2>
        {action}
      </div>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

// Message d'état quand le projet est entre les mains de l'EDBM
function StatusStrip({ p }: { p: PorteurProject }) {
  const messages: Partial<Record<PorteurProject["status"], { title: string; text: string }>> = {
    en_verification: {
      title: "Votre projet est entre les mains de l'EDBM",
      text: "Un agent de l'antenne de Toliara l'étudie. Vous recevrez un e-mail dès qu'il sera validé ou si des compléments sont nécessaires. Vous pouvez encore ajouter des photos et documents.",
    },
    validee: { title: "Votre projet a été validé", text: "Il sera prochainement publié dans le catalogue des opportunités." },
    publiee: { title: "Votre projet est en ligne", text: "Les investisseurs peuvent le consulter et manifester leur intérêt auprès de l'EDBM, qui reviendra vers vous." },
    suspendue: { title: "Votre projet est suspendu", text: "Il n'est temporairement plus visible. Contactez l'antenne EDBM pour en savoir plus." },
    archivee: { title: "Votre projet est archivé", text: "Il n'est plus suivi. Contactez l'antenne EDBM pour le réactiver." },
  };
  const m = messages[p.status];
  if (!m) return null;
  return (
    <AlertStrip
      tone={p.status === "suspendue" ? "danger" : "info"}
      icon={PORTEUR_STATUS[p.status].icon}
      title={m.title}
      action={p.status === "publiee" ? (
        <Link to={`/opportunites/${p.slug}`} target="_blank" className={cn(buttonVariants({ variant: "outline" }), "h-9 bg-white px-3")}><ExternalLink /> Fiche publique</Link>
      ) : undefined}
    >
      {m.text}
    </AlertStrip>
  );
}

// Fiche projet présentée comme un registre : libellé à gauche, valeur à droite
function ProjectSheet({ p }: { p: PorteurProject }) {
  const rows: [string, React.ReactNode][] = [
    ["Référence", <MonoRef key="r">{p.reference ?? "—"}</MonoRef>],
    ["Secteur", p.sector],
    ["Type de projet", p.projectType],
    ["Région", p.region],
    ["District / commune", [p.district, p.commune].filter(Boolean).join(" · ")],
    ["Coordonnées GPS", p.latitude != null && p.longitude != null ? <span key="g" className="font-mono text-xs">{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</span> : null],
    ["Montant recherché", p.estimatedInvestment != null ? formatAmountFull(p.estimatedInvestment, p.currency) : null],
    ["Partenariat recherché", p.investmentModel],
  ];
  const texts: [string, string | null][] = [
    ["Potentiel du projet", p.potential],
    ["Clients visés", p.targetMarket],
    ["Ressources disponibles", p.resources],
  ];
  return (
    <div className="space-y-5">
      <div>
        <p className="label-caps mb-1.5 text-muted-foreground">Présentation</p>
        <p className="text-sm leading-6 whitespace-pre-line">{p.description}</p>
      </div>
      <dl className="grid overflow-hidden rounded-lg border sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 border-b px-4 py-2.5 text-sm odd:sm:border-r">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className={cn("text-right font-medium", !v && "font-normal text-muted-foreground italic")}>{v || "Non renseigné"}</dd>
          </div>
        ))}
      </dl>
      {texts.some(([, v]) => v) && (
        <div className="grid gap-3 md:grid-cols-3">
          {texts.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="rounded-lg border-l-4 border-l-primary bg-surface-low/60 px-4 py-3">
              <p className="label-caps text-muted-foreground">{k}</p>
              <p className="mt-1 text-sm whitespace-pre-line">{v}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Pièces jointes du porteur : réservées aux membres connectés, l'EDBM décide de leur diffusion
function DocumentsTable({ p, onChange }: { p: PorteurProject; onChange: () => void }) {
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
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="label-caps border-b bg-muted/40 text-left text-muted-foreground">
              <th className="px-5 py-2.5">Document</th>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5">Ajouté le</th>
              <th className="px-5 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {p.documents.map((d) => (
              <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-5 py-2.5">
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-10 shrink-0 items-center justify-center rounded bg-red-50 font-mono text-[10px] font-bold text-red-700">{ext(d.fileKey)}</span>
                    <span className="max-w-64 truncate font-medium">{d.name}</span>
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{d.type}</td>
                <td className="tabular px-3 py-2.5 text-xs text-muted-foreground">{formatDate(d.createdAt)}</td>
                <td className="px-5 py-2.5">
                  <span className="flex justify-end gap-1">
                    <a href={fileUrl(d.fileKey)} target="_blank" rel="noopener" className="flex size-8 items-center justify-center rounded-md text-secondary hover:bg-accent hover:text-primary" aria-label={`Télécharger ${d.name}`}>
                      <Download className="size-4" />
                    </a>
                    {p.canEditFiles && (
                      <button type="button" onClick={() => setToDelete(d)} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-700" aria-label={`Supprimer ${d.name}`}>
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </span>
                </td>
              </tr>
            ))}
            {!p.documents.length && (
              <tr><td colSpan={4} className="px-5 py-6 text-center text-sm text-muted-foreground">Aucun document : un plan d&apos;affaires ou une étude rassure l&apos;EDBM et les investisseurs.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {p.canEditFiles && (
        <div className="flex flex-col gap-3 border-t bg-surface-low/50 px-5 py-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <p className="text-xs font-medium text-secondary">Type du document à ajouter</p>
            <SimpleSelect value={type} onChange={(v) => setType(v ?? "Fiche projet")} options={DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))} />
          </div>
          <Button type="button" className="h-10" disabled={busy} onClick={() => input.current?.click()}>
            <Upload /> {busy ? "Envoi…" : "Ajouter des documents"}
          </Button>
          <input ref={input} type="file" multiple hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={(e) => onFiles(e.target.files)} />
        </div>
      )}
      <ConfirmDialog
        open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}
        title="Supprimer ce document ?" description={<>« {toDelete?.name} » sera définitivement supprimé.</>}
        confirmLabel="Supprimer" destructive onConfirm={() => toDelete && remove.mutate({ id: toDelete.id })}
      />
    </div>
  );
}

// Panneau latéral « dossier actif » : en-tête sombre, complétude, journal, actions
function DossierPanel({ p, onDelete }: { p: PorteurProject; onDelete: () => void }) {
  const c = completeness({ ...p, media: p.media.length, documents: p.documents.length });
  const steps = [...p.history].reverse();
  return (
    <aside className="overflow-hidden rounded-xl border bg-white shadow-card lg:sticky lg:top-20">
      <div className="bg-primary-dark px-5 py-4 text-white">
        <div className="flex items-center gap-2">
          <span className="label-caps rounded bg-white/15 px-2 py-0.5 text-[10px] text-brand-light">Dossier actif</span>
          <span className="font-mono text-xs text-white/80">{p.reference ?? "—"}</span>
        </div>
        <p className="mt-2 text-lg leading-snug font-bold">{p.title}</p>
        <p className="text-xs text-white/70">{[p.district, p.region].filter(Boolean).join(" — ")}</p>
      </div>

      <div className="space-y-5 p-5">
        <section className="space-y-2.5">
          <p className="label-caps flex items-center justify-between text-secondary">
            Complétude du dossier <span className="tabular text-primary">{c.done}/{c.total}</span>
          </p>
          <GradeScale grade={c.grade} ratio={c.ratio} />
          <ul className="space-y-1.5 text-sm">
            {c.items.map((i) => (
              <li key={i.label} className={cn("flex items-center gap-2", i.ok ? "text-foreground" : "text-muted-foreground")}>
                {i.ok ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Circle className="size-4" />} {i.label}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3 border-t pt-4">
          <p className="label-caps flex items-center gap-1.5 text-secondary"><History className="size-3.5" /> Journal du dossier</p>
          <ol className="space-y-2.5">
            {steps.map((h, i) => {
              const created = i === steps.length - 1;
              const returned = h.status === "brouillon" && !!h.note;
              const S = PORTEUR_STATUS[h.status];
              return (
                <li key={i} className={cn("rounded-lg border p-3", returned ? "border-amber-200 bg-amber-50/60" : "bg-white")}>
                  <div className="flex items-start gap-2.5">
                    <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", returned ? "bg-amber-100 text-amber-700" : "bg-accent text-primary")}>
                      {returned ? <MessageSquareWarning className="size-3.5" /> : <S.icon className="size-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center justify-between gap-2 text-sm font-semibold">
                        {created ? "Projet créé" : returned ? "Renvoyé pour compléments" : S.label}
                        <span className="tabular shrink-0 text-[11px] font-normal text-muted-foreground">{formatDate(h.at)}</span>
                      </p>
                      {h.note && <p className="mt-1 text-xs whitespace-pre-line text-amber-900">{h.note}</p>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-5 py-3">
        <Link to="/contact" className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"><Headset className="size-4" /> Contacter l&apos;antenne</Link>
        {p.canDelete && (
          <button type="button" onClick={onDelete} className="flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:underline">
            <X className="size-4" /> Retirer le projet
          </button>
        )}
      </div>
    </aside>
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
  const c = completeness({ ...p, media: p.media.length, documents: p.documents.length });

  return (
    <div className="space-y-6">
      <OpsHeader
        icon={FolderOpen}
        eyebrow={<><Link to="/porteur" className="hover:underline">Mes projets</Link> <span className="text-muted-foreground">/</span> <span className="font-mono normal-case">{p.reference}</span></>}
        title={p.title}
        description={<span className="flex flex-wrap items-center gap-x-3 gap-y-1">{p.sector} · {[p.district, p.region].filter(Boolean).join(", ")} · déposé le {formatDate(p.createdAt)} <PorteurStatusBadge status={p.status} /></span>}
        actions={
          <>
            {p.canEdit && (
              <Link to={`/porteur/projets/${p.id}/modifier`} className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}><Pencil /> Modifier</Link>
            )}
            {p.canSubmit && (
              <Button className="h-10 px-4" onClick={() => setConfirm("submit")}><Send /> {p.lastNote ? "Transmettre à nouveau" : "Transmettre à l'EDBM"}</Button>
            )}
          </>
        }
      >
        <div className="mt-6 border-t pt-5"><ProjectProgress status={p.status} /></div>
      </OpsHeader>

      {p.lastNote ? (
        <AlertStrip
          tone="warning" icon={MessageSquareWarning} title="L'EDBM vous demande des compléments"
          action={<Link to={`/porteur/projets/${p.id}/modifier`} className={cn(buttonVariants(), "h-9 px-3")}><Pencil /> Corriger le projet</Link>}
        >
          <span className="whitespace-pre-line">{p.lastNote}</span>
        </AlertStrip>
      ) : p.status === "brouillon" ? (
        <AlertStrip tone="info" icon={Send} title="Prochaine étape : transmettre votre projet à l'EDBM">
          Vérifiez vos informations et joignez vos pièces, puis cliquez sur « Transmettre ». Rien n&apos;est envoyé avant.
        </AlertStrip>
      ) : <StatusStrip p={p} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Étape du dossier" value={PORTEUR_STATUS[p.status].label} icon={PORTEUR_STATUS[p.status].icon} valueClassName="text-xl leading-7"
          sub={PORTEUR_STATUS[p.status].hint} tone={p.lastNote ? "amber" : "primary"} />
        <StatTile label="Montant recherché" icon={Coins} tone="blue"
          value={p.estimatedInvestment != null ? formatAmountFull(p.estimatedInvestment, p.currency) : "—"} valueClassName="text-xl leading-7"
          sub={p.investmentModel ?? "Partenariat non précisé"} />
        <StatTile label="Pièces jointes" value={p.media.length + p.documents.length} icon={FileText} tone="green"
          segments={[
            { label: "Photos", value: p.media.length, className: "bg-primary" },
            { label: "Documents", value: p.documents.length, className: "bg-ochre" },
          ]} />
        <StatTile label="Complétude" value={`${Math.round(c.ratio * 100)} %`} icon={CheckCircle2} tone={c.ratio < 0.5 ? "red" : "primary"}
          sub={`Note ${c.grade} · ${c.total - c.done} élément(s) à ajouter`} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Block title="Fiche projet" icon={ClipboardList}
            action={p.canEdit ? <Link to={`/porteur/projets/${p.id}/modifier`} className="text-xs font-semibold text-primary hover:underline">Modifier</Link> : undefined}>
            <ProjectSheet p={p} />
          </Block>
          <Block title={`Photos (${p.media.length})`} icon={ImageIcon}>
            {p.canEditFiles ? (
              <MediaGallery opportunityId={p.id} media={p.media} onChange={() => refetch()} />
            ) : p.media.length ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {p.media.map((m) => <img key={m.id} src={fileUrl(m.fileKey)} alt={m.title ?? ""} className="aspect-[4/3] w-full rounded-lg border object-cover" />)}
              </div>
            ) : <p className="text-sm text-muted-foreground">Aucune photo.</p>}
          </Block>
          <Block title={`Documents (${p.documents.length})`} icon={FileText} bodyClassName="p-0">
            <DocumentsTable p={p} onChange={() => refetch()} />
          </Block>
        </div>
        <DossierPanel p={p} onDelete={() => setConfirm("delete")} />
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
