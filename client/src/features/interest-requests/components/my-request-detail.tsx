import { Building2, CalendarDays, FileText, History, Mail, MapPin, MessageSquareText, Phone, SearchX, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/common/empty-state";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { Breadcrumbs } from "@/components/common/page-header";
import { Panel } from "@/components/common/panel";
import { StatusBadge } from "@/components/common/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/config/constants";
import { formatAmount, formatAmountFull, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMyRequest } from "../hooks";
import { RequestStepper } from "./request-stepper";

export function RequestDetail({ id }: { id: string }) {
  const { data: r, isPending, error } = useMyRequest({ id });
  if (isPending) return <PageSkeleton />;
  if (error || !r) {
    return (
      <EmptyState
        icon={SearchX} title="Demande introuvable"
        action={<Link to="/investisseur/demandes" className={cn(buttonVariants({ variant: "outline" }), "h-9")}>Retour à mes demandes</Link>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Espace investisseur", href: "/investisseur" }, { label: "Mes demandes", href: "/investisseur/demandes" }, { label: r.opportunity }]} />

      <section className="relative overflow-hidden rounded-lg border bg-card p-6 shadow-card before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-primary">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <StatusBadge kind="request" status={r.status} />
              <span>Réf. {r.reference ?? "—"}</span>
              <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> Déposée le {formatDate(r.createdAt)}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-[28px] md:leading-9">{r.opportunity}</h1>
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="size-4" />{[r.district, r.region].filter(Boolean).join(", ")}</span>
              <span className="flex items-center gap-1"><Building2 className="size-4" />Secteur {r.sector}</span>
            </p>
          </div>
          <div className="rounded-lg bg-surface-low px-5 py-4 lg:min-w-56">
            <p className="label-caps flex items-center gap-1 text-muted-foreground"><Wallet className="size-3" /> Montant envisagé</p>
            <p className="tabular mt-1 text-2xl font-bold text-primary">{formatAmount(r.amount, r.currency)}</p>
            <p className="text-xs text-muted-foreground">Projet estimé à {formatAmount(r.estimatedInvestment, r.currency)}</p>
          </div>
        </div>
        <div className="mt-6 rounded-lg bg-surface-low/60 p-4">
          <RequestStepper status={r.status} createdAt={r.createdAt} history={r.history} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Panel title="Réponse de l'EDBM" icon={MessageSquareText}>
            {r.edbmResponse ? (
              <div className="rounded-md border-l-4 border-primary bg-primary/5 p-4">
                <p className="text-sm leading-6 whitespace-pre-line">{r.edbmResponse}</p>
                <p className="mt-2 text-xs text-muted-foreground">Antenne EDBM Toliara · mise à jour le {formatDate(r.updatedAt)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune réponse pour le moment. Vous serez notifié dès qu&apos;un agent EDBM aura traité votre demande.
              </p>
            )}
          </Panel>

          <Panel title="Mon message" icon={FileText}>
            <p className="text-sm leading-6 whitespace-pre-line text-slate-700">{r.message || "Aucun message joint à la demande."}</p>
          </Panel>

          <Panel title="Historique des statuts" icon={History}>
            <ol className="relative space-y-4 border-l pl-5">
              <li className="relative">
                <span className="absolute -left-[26px] mt-1.5 size-3 rounded-full bg-primary" />
                <p className="text-sm font-semibold">Demande déposée</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</p>
              </li>
              {r.history.map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[26px] mt-1.5 size-3 rounded-full bg-secondary" />
                  <p className="text-sm font-semibold">{REQUEST_STATUS_LABELS[h.status as RequestStatus] ?? h.status}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(h.at)}{h.by ? ` · par ${h.by}` : ""}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Informations transmises">
            <dl className="space-y-3 text-sm">
              {[
                ["Demandeur", [r.firstName, r.lastName].filter(Boolean).join(" ") || "—"],
                ["Entreprise", r.company ?? "—"],
                ["Pays", r.country ?? "—"],
                ["Montant", formatAmountFull(r.amount, r.currency)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {r.email && <li className="flex items-center gap-2"><Mail className="size-3.5" />{r.email}</li>}
              {r.phone && <li className="flex items-center gap-2"><Phone className="size-3.5" />{r.phone}</li>}
            </ul>
          </Panel>
          <Link to={`/opportunites/${r.slug}`} className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full")}>
            Voir la fiche de l&apos;opportunité
          </Link>
        </aside>
      </div>
    </div>
  );
}
