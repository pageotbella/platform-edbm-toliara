import { ArrowRight, SearchX } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "@/components/common/empty-state";
import { OpportunityCard } from "@/components/common/opportunity-card";
import { SectorIcon } from "@/components/common/sector-icon";
import { PageBand } from "@/components/layouts/page-band";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { catalogHref } from "@/lib/catalog-params";
import { formatAmount } from "@/lib/format";
import { NotFoundPage } from "@/pages/not-found-page";
import { useSector, useSectorsSummary } from "../hooks";

// Liste des secteurs stratégiques (section 23)
export function SectorsPage() {
  const { data: sectors } = useSectorsSummary();
  return (
    <>
      <title>Secteurs stratégiques — EDBM Toliara</title>
      <PageBand
        crumbs={[{ label: "Secteurs" }]}
        eyebrow="Filières prioritaires"
        title="Secteurs stratégiques"
        description="Les opportunités sont structurées par secteur économique. Choisissez un secteur pour consulter ses projets."
      />
      <div className="container-page grid gap-5 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {sectors
          ? sectors.map((s) => (
              <Link
                key={s.id}
                to={`/secteurs/${s.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-lg border bg-card p-6 shadow-card transition before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-primary hover:border-border-strong hover:shadow-hover"
              >
                <div className="flex items-start justify-between">
                  <span className="flex size-12 items-center justify-center rounded-lg bg-surface-low text-primary transition group-hover:bg-primary group-hover:text-white">
                    <SectorIcon slug={s.slug} className="size-6" />
                  </span>
                  <span className="label-caps rounded bg-surface-low px-2 py-1 text-secondary">{s.count} projet{s.count > 1 ? "s" : ""}</span>
                </div>
                <h2 className="mt-5 text-lg font-semibold">{s.name}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{s.description}</p>
                <div className="mt-5 flex items-center justify-between border-t pt-4">
                  <div>
                    <p className="label-caps text-muted-foreground">Volume estimé</p>
                    <p className="tabular font-bold">{formatAmount(s.total)}</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                    Voir les projets <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))
          : Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-60 rounded-lg" />)}
      </div>
    </>
  );
}

// Opportunités publiées d'un secteur
export function SectorPage() {
  const { slug = "" } = useParams();
  const { data, isPending, isError } = useSector(slug);
  if (isPending) return <div className="container-page py-10"><Skeleton className="h-96" /></div>;
  if (isError || !data) return <NotFoundPage />;

  const { sector, items } = data;
  const total = items.reduce((s, o) => s + (o.estimatedInvestment ?? 0), 0);
  return (
    <>
      <title>{`${sector.name} — Secteurs — EDBM Toliara`}</title>
      <PageBand
        crumbs={[{ label: "Secteurs", href: "/secteurs" }, { label: sector.name }]}
        eyebrow="Secteur stratégique"
        title={<span className="flex items-center gap-3"><SectorIcon slug={sector.slug} className="size-8 text-primary" />{sector.name}</span>}
        description={sector.description}
      >
        <div className="flex gap-6 rounded-lg border bg-surface-low px-5 py-3">
          <div><p className="label-caps text-muted-foreground">Projets</p><p className="tabular text-xl font-bold">{items.length}</p></div>
          <div><p className="label-caps text-muted-foreground">Volume estimé</p><p className="tabular text-xl font-bold">{formatAmount(total)}</p></div>
        </div>
      </PageBand>
      <div className="container-page py-10">
        {items.length ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((o) => <OpportunityCard key={o.id} o={o} />)}
            </div>
            <div className="mt-8 text-center">
              <Link to={catalogHref({ secteur: sector.id })} className={buttonVariants({ variant: "outline" })}>
                Filtrer ce secteur dans le catalogue
              </Link>
            </div>
          </>
        ) : (
          <EmptyState icon={SearchX} title="Aucune opportunité publiée dans ce secteur pour le moment" />
        )}
      </div>
    </>
  );
}
