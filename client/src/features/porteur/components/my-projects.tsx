import { ArrowRight, Calendar, FileText, FilePlus2, ImageIcon, Lightbulb, MapPin, Send, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { OpportunityCover } from "@/components/common/opportunity-cover";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { formatAmount, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PorteurProjectRow } from "@/types";
import { useMyProjects } from "../hooks";
import { PORTEUR_STATUS } from "../status";
import { PorteurStatusBadge, ProjectProgress } from "./project-progress";

const HOW = [
  { icon: Lightbulb, title: "Décrivez votre projet", text: "Titre, secteur, localisation et chiffres clés, en trois étapes." },
  { icon: Upload, title: "Ajoutez photos et documents", text: "Plan d'affaires, étude, photos du site… pour convaincre." },
  { icon: Send, title: "Transmettez à l'EDBM", text: "Un agent l'étudie ; vous êtes informé par e-mail à chaque étape." },
];

// Prochaine action attendue du porteur, selon le statut
const NEXT: Partial<Record<PorteurProjectRow["status"], string>> = {
  brouillon: "À compléter et transmettre",
};

function ProjectRow({ p }: { p: PorteurProjectRow }) {
  const next = NEXT[p.status];
  return (
    <Link
      to={`/porteur/projets/${p.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-white shadow-card transition hover:shadow-hover sm:flex-row"
    >
      <div className="h-36 shrink-0 sm:h-auto sm:w-48">
        <OpportunityCover coverKey={p.coverKey} sectorSlug={p.sectorSlug} title={p.title} iconClassName="size-10" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="label-caps text-muted-foreground">{p.reference ?? "Projet"} · {p.sector}</p>
            <h3 className="mt-1 truncate text-lg font-bold group-hover:text-primary">{p.title}</h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {[p.district, p.region].filter(Boolean).join(", ")}</span>
              <span className="flex items-center gap-1"><Calendar className="size-3.5" /> Mis à jour le {formatDate(p.updatedAt)}</span>
              {p.estimatedInvestment != null && <span className="font-semibold text-foreground">{formatAmount(p.estimatedInvestment, p.currency)}</span>}
            </p>
          </div>
          <PorteurStatusBadge status={p.status} />
        </div>
        <ProjectProgress status={p.status} className="max-w-md" />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-1"><ImageIcon className="size-3.5" /> {p.media} photo(s)</span>
            <span className="flex items-center gap-1"><FileText className="size-3.5" /> {p.documents} document(s)</span>
            {p.status === "publiee" && <span className="flex items-center gap-1"><Send className="size-3.5" /> {p.requests} investisseur(s) intéressé(s)</span>}
          </span>
          <span className={cn("flex items-center gap-1 font-semibold", next ? "text-primary" : "text-muted-foreground")}>
            {next ?? PORTEUR_STATUS[p.status].hint} <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function MyProjects() {
  const { data: session } = useSession();
  const { data, isPending } = useMyProjects();
  const firstName = session?.user.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Espace porteur de projet"
        title={firstName ? `Bonjour ${firstName}` : "Mes projets"}
        description="Déposez vos projets d'investissement auprès de l'antenne EDBM de Toliara, sans vous déplacer, et suivez leur traitement."
        actions={
          <Link to="/porteur/projets/nouveau" className={cn(buttonVariants(), "h-10 px-4")}>
            <FilePlus2 /> Déposer un projet
          </Link>
        }
      />

      {isPending ? (
        <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
      ) : data?.length ? (
        <section className="space-y-4" aria-label="Mes projets">
          <p className="text-sm text-muted-foreground">{data.length} projet(s)</p>
          {data.map((p) => <ProjectRow key={p.id} p={p} />)}
        </section>
      ) : (
        // Premier passage : comment ça marche
        <section className="bg-brand-gradient overflow-hidden rounded-xl p-6 text-white md:p-10">
          <p className="label-caps text-brand-light">Comment ça marche</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">Votre projet mérite d'être vu par les investisseurs</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {HOW.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="rounded-lg bg-white/10 p-5">
                <span className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-white text-sm font-bold text-primary">{i + 1}</span>
                  <Icon className="size-5 text-brand-light" />
                </span>
                <p className="mt-3 font-semibold">{title}</p>
                <p className="mt-1 text-sm text-white/80">{text}</p>
              </li>
            ))}
          </ol>
          <Link to="/porteur/projets/nouveau" className={cn(buttonVariants(), "mt-8 h-11 bg-white px-5 text-primary hover:bg-white/90")}>
            <FilePlus2 /> Déposer mon premier projet
          </Link>
        </section>
      )}
    </div>
  );
}
