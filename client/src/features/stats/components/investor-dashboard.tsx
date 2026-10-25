import {
  ArrowRight, Bell, Building2, Compass, Heart, Layers, Mail, MapPin, Phone, Send, Timer,
} from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCard } from "@/components/common/kpi-card";
import { MiniOpportunity } from "@/components/common/mini-opportunity";
import { OpportunityCover } from "@/components/common/opportunity-cover";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { Panel, PanelLink } from "@/components/common/panel";
import { StatusBadge } from "@/components/common/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { useContact } from "@/features/settings/hooks";
import { formatAmount, formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useInvestorDashboard } from "@/features/stats/hooks";
import { useProfile } from "@/features/auth/hooks";

// Tableau de bord investisseur (section 19 ; maquette « tableau_de_bord_investisseur_connect »)
export function InvestorDashboard() {
  const contact = useContact();
  const { data, isPending } = useInvestorDashboard();
  const profile = useProfile();
  if (isPending || !data) return <PageSkeleton />;
  const { stats } = data;
  const p = profile.data;

  return (
    <div className="space-y-6">
      {/* Bienvenue */}
      <section className="grid gap-4 rounded-lg border bg-card p-6 shadow-card lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="label-caps rounded bg-primary px-2 py-1 text-white">Investisseur</span>
            <span className="label-caps text-muted-foreground">Guichet régional Atsimo-Andrefana</span>
          </div>
          <h1 className="text-[28px] leading-9 font-bold tracking-tight text-primary md:text-4xl md:leading-[44px]">
            Bienvenue, {p?.name ?? "…"}
          </h1>
          {p?.company && <p className="text-sm text-muted-foreground">{p.company}{p.country ? ` · ${p.country}` : ""}</p>}
          <p className="max-w-2xl text-sm text-muted-foreground">
            Suivez vos opportunités favorites et l&apos;avancement de vos demandes d&apos;intérêt auprès de l&apos;antenne EDBM Toliara.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Link to="/investisseur/opportunites" className={cn(buttonVariants(), "h-10 px-4")}>
            <Compass /> Explorer le catalogue
          </Link>
          {!p?.company && (
            <Link to="/investisseur/profil" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}>
              Compléter mon profil
            </Link>
          )}
        </div>
      </section>

      {/* Indicateurs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Opportunités publiées" value={stats.opportunities} icon={Layers} hint="Dans le catalogue national" />
        <KpiCard label="Mes favoris" value={stats.favorites} unit="projets suivis" icon={Heart} accent="ochre" />
        <KpiCard label="Demandes envoyées" value={stats.requests} icon={Send} accent="secondary" />
        <KpiCard label="Demandes en cours" value={stats.openRequests} icon={Timer} hint="En attente ou en traitement par l'EDBM" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* Dernières demandes */}
          <Panel
            title="Suivi de mes demandes d'intérêt"
            description="Dossiers transmis à l'antenne EDBM Toliara"
            action={<PanelLink href="/investisseur/demandes">Voir tout le suivi →</PanelLink>}
            bodyClassName="p-0"
          >
            {data.requests.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="label-caps border-b bg-muted/50 text-left text-muted-foreground">
                      <th className="px-5 py-3">Projet & référence</th>
                      <th className="px-3 py-3">Montant envisagé</th>
                      <th className="px-3 py-3">Statut</th>
                      <th className="px-3 py-3">Mise à jour</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.requests.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="px-5 py-3">
                          <p className="font-semibold">{r.opportunity}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.district ?? r.region} · {r.reference ?? "—"} · déposée le {formatDate(r.createdAt)}
                          </p>
                        </td>
                        <td className="tabular px-3 py-3 font-bold">{formatAmount(r.amount, r.currency)}</td>
                        <td className="px-3 py-3"><StatusBadge kind="request" status={r.status} /></td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">{timeAgo(r.updatedAt)}</td>
                        <td className="px-5 py-3 text-right">
                          <Link to={`/investisseur/demandes/${r.id}`} className="text-primary hover:underline" aria-label="Voir la demande">
                            <ArrowRight className="size-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                className="m-5" icon={Send} title="Aucune demande pour le moment"
                description="Depuis la fiche d'une opportunité, cliquez sur « Je suis intéressé »."
              />
            )}
          </Panel>

          {/* Favoris */}
          <div>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold">Projets favoris</h2>
                <p className="text-xs text-muted-foreground">Vos dernières opportunités enregistrées</p>
              </div>
              <PanelLink href="/investisseur/favoris">Gérer mes favoris ({stats.favorites})</PanelLink>
            </div>
            {data.favorites.length ? (
              <div className="grid gap-4 md:grid-cols-3">
                {data.favorites.map((o) => (
                  <Link key={o.id} to={`/opportunites/${o.slug}`} className="group overflow-hidden rounded-lg border bg-card shadow-card transition hover:shadow-hover">
                    <div className="relative h-32">
                      <OpportunityCover coverKey={o.coverKey} sectorSlug={o.sectorSlug} title={o.title} iconClassName="size-10" />
                      <span className="label-caps absolute top-2 left-2 rounded bg-primary px-2 py-0.5 text-white">{o.sector}</span>
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 p-3 text-white">
                        <p className="label-caps text-[9px] text-white/80">{o.district ?? o.region}</p>
                        <p className="line-clamp-2 text-sm font-semibold">{o.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <div>
                        <p className="label-caps text-[9px] text-muted-foreground">Ticket estimé</p>
                        <p className="tabular text-sm font-bold">{formatAmount(o.estimatedInvestment, o.currency)}</p>
                      </div>
                      <span className="rounded bg-primary px-2 py-1 text-xs font-semibold text-white">Détails</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={Heart} title="Aucun favori" description="Cliquez sur le cœur d'une opportunité pour la suivre ici." />
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <Panel title="Notifications" icon={Bell} action={<PanelLink href="/investisseur/notifications">Tout voir</PanelLink>} bodyClassName="p-3">
            {data.notifications.length ? (
              <ul className="space-y-2">
                {data.notifications.map((n) => (
                  <li key={n.id}>
                    <Link to={n.link ?? "/investisseur/notifications"} className={cn("block rounded-md border-l-2 bg-surface-low/60 p-3 transition hover:bg-surface-low", n.isRead ? "border-transparent" : "border-primary")}>
                      <p className="text-[11px] font-semibold text-primary">{timeAgo(n.createdAt)}</p>
                      <p className="text-sm font-semibold">{n.title}</p>
                      {n.content && <p className="line-clamp-2 text-xs text-muted-foreground">{n.content}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="p-3 text-sm text-muted-foreground">Aucune notification.</p>}
          </Panel>

          <Panel title="Dernières opportunités" icon={Layers} action={<PanelLink href="/investisseur/opportunites">Catalogue</PanelLink>} bodyClassName="p-2">
            {data.latest.map((o) => <MiniOpportunity key={o.id} o={o} />)}
          </Panel>

          <Panel title="Votre interlocuteur EDBM" icon={Building2}>
            <p className="font-semibold">{contact.name}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" />{contact.address}</li>
              <li className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0 text-primary" />{contact.phone}</li>
              <li className="flex gap-2"><Mail className="mt-0.5 size-4 shrink-0 text-primary" />{contact.email}</li>
            </ul>
            <a href={`mailto:${contact.email}`} className={cn(buttonVariants(), "mt-4 h-10 w-full")}>
              <Mail /> Écrire à l&apos;antenne
            </a>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
