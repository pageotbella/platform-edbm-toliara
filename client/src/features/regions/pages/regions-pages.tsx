import { ArrowRight, ChevronRight, MapPin, MapPinned, SearchX } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "@/components/common/empty-state";
import { OpportunityCard } from "@/components/common/opportunity-card";
import { PageBand } from "@/components/layouts/page-band";
import { Skeleton } from "@/components/ui/skeleton";
import { OpportunityMap } from "@/features/map/components";
import { catalogHref } from "@/lib/catalog-params";
import { formatAmount } from "@/lib/format";
import { NotFoundPage } from "@/pages/not-found-page";
import { useRegion, useRegionsSummary } from "../hooks";

const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

// Régions de Madagascar : Région → District → Commune → Opportunité (section 24)
export function RegionsPage() {
  const { data: regions } = useRegionsSummary();
  return (
    <>
      <title>Régions — EDBM Toliara</title>
      <PageBand
        crumbs={[{ label: "Régions" }]}
        eyebrow="Structure géographique"
        title="Régions de Madagascar"
        description="Madagascar → Région → District → Commune → Opportunité : explorez les projets selon leur zone géographique."
      />
      <div className="container-page grid gap-5 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {regions
          ? regions.map((r) => (
              <Link
                key={r.id}
                to={`/regions/${r.id}`}
                className="group flex flex-col rounded-lg border bg-card p-6 shadow-card transition hover:border-border-strong hover:shadow-hover"
              >
                <div className="flex items-start justify-between">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-surface-low text-secondary transition group-hover:bg-secondary group-hover:text-white">
                    <MapPinned className="size-5" />
                  </span>
                  <span className="label-caps text-muted-foreground">{r.code}</span>
                </div>
                <h2 className="mt-4 text-lg font-semibold">{r.name}</h2>
                <dl className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center">
                  <div><dt className="label-caps text-muted-foreground">Projets</dt><dd className="tabular mt-1 font-bold">{r.count}</dd></div>
                  <div><dt className="label-caps text-muted-foreground">Districts</dt><dd className="tabular mt-1 font-bold">{r.districts}</dd></div>
                  <div><dt className="label-caps text-muted-foreground">Volume</dt><dd className="tabular mt-1 font-bold">{formatAmount(r.total).replace(" USD", "")}</dd></div>
                </dl>
                <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
                  Explorer la région <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))
          : Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-56 rounded-lg" />)}
      </div>
    </>
  );
}

export function RegionPage() {
  const { id = "" } = useParams();
  if (!isUuid(id)) return <NotFoundPage />;
  return <RegionContent id={id} />;
}

function RegionContent({ id }: { id: string }) {
  const { data, isPending, isError } = useRegion(id);
  if (isPending) return <div className="container-page py-10"><Skeleton className="h-96" /></div>;
  if (isError || !data) return <NotFoundPage />;
  const { region, districts, sectors, items } = data;

  return (
    <>
      <title>{`${region.name} — Régions — EDBM Toliara`}</title>
      <PageBand
        crumbs={[{ label: "Régions", href: "/regions" }, { label: region.name }]}
        eyebrow={`Région · ${region.code}`}
        title={region.name}
        description={`${items.length} opportunité(s) publiée(s) réparties sur ${districts.length} district(s).`}
      />
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-lg border bg-white p-5 shadow-card">
            <p className="label-caps mb-3 text-muted-foreground">Opportunités par secteur</p>
            {sectors.length ? (
              <ul className="space-y-2">
                {sectors.map((s) => (
                  <li key={s.name} className="flex justify-between text-sm">
                    <span>→ {s.name}</span>
                    <span className="tabular font-semibold">{s.count}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Aucune opportunité publiée.</p>}
          </div>
          <div className="rounded-lg border bg-white p-5 shadow-card">
            <p className="label-caps mb-3 text-muted-foreground">Districts et communes</p>
            <ul className="space-y-3">
              {districts.map((d) => (
                <li key={d.id} className="rounded-md border p-3">
                  <Link
                    to={catalogHref({ region: region.id, district: d.id })}
                    className="flex items-center justify-between font-semibold hover:text-primary"
                  >
                    <span>{d.name}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {d.count} projet{d.count > 1 ? "s" : ""} <ChevronRight className="size-3.5" />
                    </span>
                  </Link>
                  {d.communes.length > 0 && (
                    <p className="mt-1.5 flex flex-wrap gap-1">
                      {d.communes.map((c) => (
                        <Link
                          key={c.id}
                          to={catalogHref({ region: region.id, district: d.id, commune: c.id })}
                          className="flex items-center gap-0.5 rounded bg-surface-low px-1.5 py-0.5 text-xs text-secondary hover:bg-accent"
                        >
                          <MapPin className="size-3" />{c.name}
                        </Link>
                      ))}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <div className="min-w-0 space-y-6">
          {items.some((o) => o.latitude != null) && (
            <div className="overflow-hidden rounded-lg border bg-white p-2 shadow-card">
              <OpportunityMap points={items} className="h-[340px]" />
            </div>
          )}
          {items.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {items.map((o) => <OpportunityCard key={o.id} o={o} />)}
            </div>
          ) : (
            <EmptyState icon={SearchX} title="Aucune opportunité publiée dans cette région pour le moment" />
          )}
        </div>
      </div>
    </>
  );
}
