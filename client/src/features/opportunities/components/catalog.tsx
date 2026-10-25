import { keepPreviousData } from "@tanstack/react-query";
import { LayoutGrid, List, Map as MapIcon, RotateCcw, Search, SearchX } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { OpportunityMap } from "@/features/map/components";
import { EmptyState } from "@/components/common/empty-state";
import { OpportunityCard } from "@/components/common/opportunity-card";
import { Pager } from "@/components/common/pager";
import { SimpleSelect } from "@/components/common/simple-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { catalogHref, readCatalogParams, toFilters, type CatalogParams } from "@/lib/catalog-params";
import { INVESTMENT_TRANCHES } from "@/config/constants";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useFilterOptions, useMapPoints, useOpportunities } from "@/features/opportunities/hooks";

const VIEWS = [
  { id: "mixte", label: "Mixte", icon: MapIcon },
  { id: "grille", label: "Grille", icon: LayoutGrid },
  { id: "liste", label: "Liste", icon: List },
] as const;
type View = (typeof VIEWS)[number]["id"];

const SORTS = [
  { value: "recent", label: "Plus récentes" },
  { value: "montant_desc", label: "Montant décroissant" },
  { value: "montant_asc", label: "Montant croissant" },
  { value: "titre", label: "Ordre alphabétique" },
];

// Catalogue des opportunités (sections 12.2 à 12.4) ; l'état des filtres est porté par l'URL
export function Catalog() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const params = useMemo(() => readCatalogParams(searchParams), [searchParams]);
  const view: View = (VIEWS.find((v) => v.id === searchParams.get("vue"))?.id) ?? "mixte";
  const pageSize = view === "grille" ? 12 : 8;
  const filters = toFilters(params, pageSize);

  const [q, setQ] = useState(params.q ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const update = (patch: Partial<CatalogParams> & { vue?: View }) => {
    const { vue, ...rest } = patch;
    const next: CatalogParams = { ...params, page: 1, ...rest };
    const href = catalogHref(next, pathname);
    const v = vue ?? view;
    const withView = v === "mixte" ? href : `${href}${href.includes("?") ? "&" : "?"}vue=${v}`;
    navigate(withView, { replace: true, preventScrollReset: true });
  };

  // Recherche plein texte avec un léger délai de frappe
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.q ?? "") !== q.trim()) update({ q: q.trim() || undefined });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const options = useFilterOptions();
  const list = useOpportunities(filters, { placeholderData: keepPreviousData });
  const mapFilters = { ...filters, page: undefined, pageSize: undefined, sort: undefined };
  const points = useMapPoints(mapFilters, { enabled: view === "mixte" });

  const opts = options.data;
  const districtOptions = (opts?.districts ?? [])
    .filter((d) => !params.region || d.regionId === params.region)
    .map((d) => ({ value: d.id, label: d.name }));
  const communeOptions = (opts?.communes ?? [])
    .filter((c) => params.district && c.districtId === params.district)
    .map((c) => ({ value: c.id, label: c.name }));
  const hasFilters = !!(params.q || params.secteur || params.region || params.district || params.commune || params.type || params.tranche);
  const data = list.data;

  return (
    <div className="space-y-6">
      {/* Barre de filtres */}
      <div className="rounded-lg border bg-white p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nom, mot-clé, commune, référence…"
              className="h-10 bg-white pl-9"
              aria-label="Rechercher une opportunité"
            />
          </div>
          <SimpleSelect
            value={params.secteur} allLabel="Secteur : tous"
            options={(opts?.sectors ?? []).map((s) => ({ value: s.id, label: s.name }))}
            onChange={(v) => update({ secteur: v ?? undefined })}
          />
          <SimpleSelect
            value={params.region} allLabel="Région : toutes"
            options={(opts?.regions ?? []).map((r) => ({ value: r.id, label: r.name }))}
            onChange={(v) => update({ region: v ?? undefined, district: undefined, commune: undefined })}
          />
          <SimpleSelect
            value={params.district} allLabel="District : tous" options={districtOptions}
            onChange={(v) => update({ district: v ?? undefined, commune: undefined })}
          />
          <SimpleSelect
            value={params.commune} allLabel="Commune : toutes" options={communeOptions}
            disabled={!params.district} placeholder="Commune (choisir un district)"
            onChange={(v) => update({ commune: v ?? undefined })}
          />
          <SimpleSelect
            value={params.type} allLabel="Type de projet : tous"
            options={(opts?.projectTypes ?? []).map((t) => ({ value: t, label: t }))}
            onChange={(v) => update({ type: v ?? undefined })}
          />
          <div className="flex flex-wrap items-center gap-2 lg:col-span-2">
            <span className="label-caps text-muted-foreground">Ticket :</span>
            {[{ id: undefined, label: "Tous" }, ...INVESTMENT_TRANCHES].map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => update({ tranche: t.id })}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  params.tranche === t.id ? "border-primary bg-primary text-white" : "border-border-strong bg-white hover:bg-muted",
                )}
              >
                {t.label}
              </button>
            ))}
            {hasFilters && (
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setQ(""); navigate(pathname, { replace: true, preventScrollReset: true }); }}>
                <RotateCcw /> Réinitialiser
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Résumé, tri et modes d'affichage */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          <b className="tabular text-lg text-foreground">{data?.total ?? "…"}</b> opportunité{(data?.total ?? 0) > 1 ? "s" : ""} trouvée{(data?.total ?? 0) > 1 ? "s" : ""}
          {data && data.total > 0 && <> · Volume estimé : <b className="text-foreground">{formatAmount(data.sumInvestment)}</b></>}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <SimpleSelect
            value={params.tri ?? "recent"} options={SORTS} className="w-48"
            onChange={(v) => update({ tri: (v ?? "recent") as CatalogParams["tri"] })}
          />
          <div className="flex rounded-md border bg-white p-0.5" role="group" aria-label="Mode d'affichage">
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => update({ vue: id, page: params.page })}
                aria-pressed={view === id}
                className={cn(
                  "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition",
                  view === id ? "bg-surface-low font-semibold text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" /> <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className={cn(view === "mixte" && "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]")}>
        {view === "mixte" && (
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-lg border bg-white p-2 shadow-card">
              <OpportunityMap
                points={points.data ?? []}
                selectedId={selectedId}
                onSelect={setSelectedId}
                className="h-[360px] lg:h-[calc(100vh-10rem)] lg:max-h-[640px]"
              />
            </div>
          </div>
        )}
        <div className={cn("min-w-0", list.isFetching && "opacity-70 transition-opacity")}>
          {list.isPending ? (
            <div className={cn("grid gap-4", view === "grille" && "md:grid-cols-2 xl:grid-cols-3")}>
              {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
            </div>
          ) : !data?.items.length ? (
            <EmptyState
              icon={SearchX}
              title="Aucune opportunité ne correspond à vos critères"
              description="Élargissez votre recherche ou réinitialisez les filtres."
            />
          ) : (
            <div className={cn("grid gap-5", view === "grille" && "md:grid-cols-2 xl:grid-cols-3")}>
              {data.items.map((o) => (
                <div key={o.id} onMouseEnter={() => view === "mixte" && setSelectedId(o.id)}>
                  <OpportunityCard o={o} layout={view === "grille" ? "grid" : "list"} />
                </div>
              ))}
            </div>
          )}
          {data && (
            <Pager
              className="mt-6 rounded-lg border bg-white p-3"
              page={filters.page ?? 1}
              pageCount={data.pageCount}
              total={data.total}
              pageSize={pageSize}
              label="opportunités"
              onPageChange={(page) => { update({ page }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
