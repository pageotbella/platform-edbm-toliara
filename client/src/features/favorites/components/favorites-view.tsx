import { ArrowRight, CalendarDays, Heart, HeartOff, MapPin, Table2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { InterestDialog } from "@/features/interest-requests/components/interest-dialog";
import { useFavoriteList, useToggleFavorite } from "../hooks";
import { EmptyState } from "@/components/common/empty-state";
import { OpportunityCover } from "@/components/common/opportunity-cover";
import { PageHeader } from "@/components/common/page-header";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { Panel } from "@/components/common/panel";
import { SectorIcon } from "@/components/common/sector-icon";
import { StatusBadge } from "@/components/common/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatAmount, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

// « Mes favoris » (section 16 ; maquette « mes_favoris_veille_d_investissement »)
export function FavoritesView() {
  const { data, isPending } = useFavoriteList();
  const toggle = useToggleFavorite();
  const [sector, setSector] = useState<string | null>(null);

  const sectors = useMemo(() => {
    const m = new Map<string, { slug: string; name: string; n: number }>();
    for (const f of data ?? []) {
      const s = m.get(f.sectorSlug) ?? { slug: f.sectorSlug, name: f.sector, n: 0 };
      s.n++;
      m.set(f.sectorSlug, s);
    }
    return [...m.values()];
  }, [data]);

  if (isPending || !data) return <PageSkeleton />;
  const items = data.filter((f) => !sector || f.sectorSlug === sector);
  const total = data.reduce((s, f) => s + (f.estimatedInvestment ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Espace investisseur · Veille"
        title="Mes opportunités favorites"
        description="Retrouvez les projets que vous avez mis de côté, comparez leurs indicateurs et manifestez votre intérêt."
        actions={
          <div className="flex divide-x rounded-lg border bg-card shadow-card">
            <div className="px-4 py-2">
              <p className="label-caps text-muted-foreground">Projets suivis</p>
              <p className="tabular text-xl font-bold">{data.length}</p>
            </div>
            <div className="px-4 py-2">
              <p className="label-caps text-muted-foreground">Volume cumulé</p>
              <p className="tabular text-xl font-bold text-primary">{formatAmount(total)}</p>
            </div>
          </div>
        }
      />

      {data.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Vous n'avez encore aucun favori"
          description="Parcourez le catalogue et cliquez sur le cœur d'une opportunité pour l'enregistrer ici."
          action={<Link to="/investisseur/opportunites" className={cn(buttonVariants(), "h-10 px-4")}>Explorer le catalogue</Link>}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 rounded-lg border bg-card p-3 shadow-card">
            <button
              type="button"
              onClick={() => setSector(null)}
              className={cn("rounded px-3 py-1.5 text-xs font-semibold transition", !sector ? "bg-primary text-white" : "bg-surface-low text-secondary hover:bg-accent")}
            >
              Tous les favoris ({data.length})
            </button>
            {sectors.map((s) => (
              <button
                key={s.slug}
                type="button"
                onClick={() => setSector(s.slug)}
                className={cn("flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition", sector === s.slug ? "bg-primary text-white" : "bg-surface-low text-secondary hover:bg-accent")}
              >
                <SectorIcon slug={s.slug} className="size-3.5" /> {s.name} ({s.n})
              </button>
            ))}
          </div>

          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {items.map((f) => (
              <article key={f.favoriteId} className="relative flex flex-col overflow-hidden rounded-lg border bg-card shadow-card before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-[3px] before:bg-primary">
                <div className="relative h-40">
                  <OpportunityCover coverKey={f.coverKey} sectorSlug={f.sectorSlug} title={f.title} />
                  <span className="label-caps absolute top-3 left-3 rounded bg-white/95 px-2 py-1 text-primary">{f.sector}</span>
                  <span className="absolute top-3 right-3 flex items-center gap-1 rounded bg-black/55 px-2 py-1 text-xs text-white">
                    <MapPin className="size-3" /> {f.district ?? f.region}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 p-3 text-white">
                    <p className="label-caps text-[9px] text-white/80">Investissement estimé</p>
                    <p className="tabular text-xl font-bold">{formatAmount(f.estimatedInvestment, f.currency)}</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug">{f.title}</h3>
                    <button
                      type="button"
                      onClick={() => toggle.mutate({ opportunityId: f.id })}
                      disabled={toggle.isPending}
                      className="shrink-0 rounded p-1 text-red-600 transition hover:bg-red-50"
                      aria-label="Retirer des favoris"
                      title="Retirer des favoris"
                    >
                      <HeartOff className="size-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Réf. {f.reference ?? "—"} · {f.region}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge kind="opportunity" status={f.status} />
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" /> Ajouté le {formatDate(f.addedAt)}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 rounded-md bg-surface-low/70 p-3 text-xs leading-5 text-slate-600">{f.description}</p>
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                    <Link to={`/opportunites/${f.slug}`} className={cn(buttonVariants({ variant: "outline" }), "h-9")}>
                      Voir la fiche <ArrowRight />
                    </Link>
                    <InterestDialog opportunityId={f.id} opportunityTitle={f.title} slug={f.slug} label="Intéressé" className="h-9 text-sm" />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Panel title="Tableau comparatif des projets favoris" icon={Table2} description="Comparez rapidement les principaux indicateurs." bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="label-caps border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="px-5 py-3">Projet & localisation</th>
                    <th className="px-3 py-3">Secteur</th>
                    <th className="px-3 py-3 text-right">Investissement</th>
                    <th className="px-3 py-3">Modèle</th>
                    <th className="px-3 py-3">Type de projet</th>
                    <th className="px-5 py-3">Ajouté le</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((f) => (
                    <tr key={f.favoriteId} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <Link to={`/opportunites/${f.slug}`} className="font-semibold hover:text-primary">{f.title}</Link>
                        <p className="text-xs text-muted-foreground">{[f.district, f.region].filter(Boolean).join(", ")}</p>
                      </td>
                      <td className="px-3 py-3"><span className="label-caps rounded bg-surface-low px-2 py-1 text-secondary">{f.sector}</span></td>
                      <td className="tabular px-3 py-3 text-right font-bold">{formatAmount(f.estimatedInvestment, f.currency)}</td>
                      <td className="px-3 py-3 text-xs">{f.investmentModel ?? "—"}</td>
                      <td className="px-3 py-3 text-xs">{f.projectType ?? "—"}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{formatDate(f.addedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
