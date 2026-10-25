import { INVESTMENT_TRANCHES } from "@/config/constants";
import { opportunitySortValues, type OpportunityFilters } from "@/features/opportunities/schemas";

// Les filtres du catalogue vivent dans l'URL (partageables, conservés au retour arrière)
export type CatalogParams = {
  q?: string;
  secteur?: string;
  region?: string;
  district?: string;
  commune?: string;
  type?: string;
  tranche?: string;
  tri?: (typeof opportunitySortValues)[number];
  page?: number;
};

export function readCatalogParams(sp: URLSearchParams): CatalogParams {
  const tri = sp.get("tri");
  return {
    q: sp.get("q") ?? undefined,
    secteur: sp.get("secteur") ?? undefined,
    region: sp.get("region") ?? undefined,
    district: sp.get("district") ?? undefined,
    commune: sp.get("commune") ?? undefined,
    type: sp.get("type") ?? undefined,
    tranche: sp.get("tranche") ?? undefined,
    tri: opportunitySortValues.includes(tri as never) ? (tri as CatalogParams["tri"]) : undefined,
    page: Number(sp.get("page")) || undefined,
  };
}

export function catalogHref(params: CatalogParams, base = "/opportunites") {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "" && !(k === "page" && v === 1)) sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

const isUuid = (v?: string) => !!v && /^[0-9a-f-]{36}$/i.test(v);

export function toFilters(p: CatalogParams, pageSize = 12): OpportunityFilters {
  const tranche = INVESTMENT_TRANCHES.find((t) => t.id === p.tranche);
  return {
    q: p.q || undefined,
    sectorId: isUuid(p.secteur) ? p.secteur : undefined,
    regionId: isUuid(p.region) ? p.region : undefined,
    districtId: isUuid(p.district) ? p.district : undefined,
    communeId: isUuid(p.commune) ? p.commune : undefined,
    projectType: p.type || undefined,
    minInvestment: tranche?.min,
    maxInvestment: tranche?.max,
    sort: p.tri ?? "recent",
    page: p.page ?? 1,
    pageSize,
  };
}
