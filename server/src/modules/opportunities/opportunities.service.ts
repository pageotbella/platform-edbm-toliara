import { and, asc, count, desc, eq, gte, ilike, isNotNull, lte, ne, or, type SQL, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import {
  communes, districts, interestRequests, opportunities, opportunityDocuments, opportunityMedia, opportunityViews,
  regions, sectors, user,
} from "@/db/schema";
import { HttpError } from "@/utils/http-error";
import type { ListQuery, MapPointsQuery } from "./opportunities.schemas";
import { selectCards } from "./opportunity-card";

// Le portail public ne montre que les opportunités publiées
const published = eq(opportunities.status, "publiee");

/** Conditions de recherche (section 12.3) et de filtrage (section 12.4) du catalogue. */
function filterConditions(input: MapPointsQuery): (SQL | undefined)[] {
  const like = input.q ? `%${input.q}%` : undefined;
  return [
    input.sectorId ? eq(opportunities.sectorId, input.sectorId) : undefined,
    input.regionId ? eq(opportunities.regionId, input.regionId) : undefined,
    input.districtId ? eq(opportunities.districtId, input.districtId) : undefined,
    input.communeId ? eq(opportunities.communeId, input.communeId) : undefined,
    input.projectType ? eq(opportunities.projectType, input.projectType) : undefined,
    input.minInvestment != null ? gte(opportunities.estimatedInvestment, input.minInvestment) : undefined,
    input.maxInvestment != null ? lte(opportunities.estimatedInvestment, input.maxInvestment) : undefined,
    like
      ? or(
          ilike(opportunities.title, like),
          ilike(opportunities.description, like),
          ilike(opportunities.reference, like),
          ilike(opportunities.subSector, like),
          ilike(sectors.name, like),
          ilike(regions.name, like),
          ilike(districts.name, like),
          sql`exists (select 1 from communes c where c.id = ${opportunities.communeId} and c.name ilike ${like})`,
        )
      : undefined,
  ];
}

const sortOrder = {
  recent: [desc(opportunities.publishedAt), desc(opportunities.createdAt)],
  montant_desc: [sql`${opportunities.estimatedInvestment} desc nulls last`],
  montant_asc: [sql`${opportunities.estimatedInvestment} asc nulls last`],
  titre: [asc(opportunities.title)],
};

export async function list(input: ListQuery) {
  const where = and(published, ...filterConditions(input));
  const [items, [{ total, sumInvestment }]] = await Promise.all([
    selectCards(db)
      .where(where)
      .orderBy(...sortOrder[input.sort])
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize),
    db
      .select({
        total: sql<number>`count(*)::int`,
        sumInvestment: sql<number>`coalesce(sum(${opportunities.estimatedInvestment}), 0)::float`,
      })
      .from(opportunities)
      .innerJoin(sectors, eq(sectors.id, opportunities.sectorId))
      .innerJoin(regions, eq(regions.id, opportunities.regionId))
      .leftJoin(districts, eq(districts.id, opportunities.districtId))
      .where(where),
  ]);
  return { items, total, sumInvestment, pageCount: Math.max(1, Math.ceil(total / input.pageSize)) };
}

const geolocated = and(isNotNull(opportunities.latitude), isNotNull(opportunities.longitude));

// Points de la carte du catalogue, avec les mêmes filtres
export const mapPoints = (input: MapPointsQuery) =>
  selectCards(db).where(and(published, geolocated, ...filterConditions(input)));

/** Points de la carte + répartition région → secteurs (section 17). */
export async function mapData() {
  const points = await selectCards(db).where(and(published, geolocated));
  const byRegion = new Map<string, { id: string; name: string; total: number; sectors: Map<string, number> }>();
  for (const p of points) {
    const r = byRegion.get(p.regionId) ?? { id: p.regionId, name: p.region, total: 0, sectors: new Map() };
    r.total++;
    r.sectors.set(p.sector, (r.sectors.get(p.sector) ?? 0) + 1);
    byRegion.set(p.regionId, r);
  }
  return {
    points,
    regions: [...byRegion.values()]
      .map((r) => ({
        id: r.id,
        name: r.name,
        total: r.total,
        sectors: [...r.sectors].map(([name, n]) => ({ name, count: n })).sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.total - a.total),
  };
}

// Valeurs des listes déroulantes de filtres
export async function filterOptions() {
  const [sectorRows, regionRows, districtRows, communeRows, types] = await Promise.all([
    db.select({ id: sectors.id, name: sectors.name }).from(sectors).where(eq(sectors.isActive, true)).orderBy(asc(sectors.name)),
    db.select({ id: regions.id, name: regions.name }).from(regions).orderBy(asc(regions.name)),
    db.select({ id: districts.id, name: districts.name, regionId: districts.regionId }).from(districts).orderBy(asc(districts.name)),
    db.select({ id: communes.id, name: communes.name, districtId: communes.districtId }).from(communes).orderBy(asc(communes.name)),
    db
      .selectDistinct({ type: opportunities.projectType })
      .from(opportunities)
      .where(and(published, isNotNull(opportunities.projectType))),
  ]);
  return {
    sectors: sectorRows,
    regions: regionRows,
    districts: districtRows,
    communes: communeRows,
    projectTypes: types.map((t) => t.type!).sort(),
  };
}

// Projets mis en avant sur l'accueil
export const featured = (limit: number) =>
  selectCards(db).where(published).orderBy(desc(opportunities.isFeatured), desc(opportunities.publishedAt)).limit(limit);

// Chiffres clés de l'accueil et de « À propos »
export async function keyFigures() {
  const [[opp], [sec], [reg], [req], [inv]] = await Promise.all([
    db
      .select({ n: count(), total: sum(opportunities.estimatedInvestment).mapWith(Number) })
      .from(opportunities)
      .where(published),
    db.select({ n: count() }).from(sectors).where(eq(sectors.isActive, true)),
    db.select({ n: sql<number>`count(distinct ${opportunities.regionId})::int` }).from(opportunities).where(published),
    db.select({ n: count() }).from(interestRequests),
    db.select({ n: count() }).from(user).where(eq(user.role, "investisseur")),
  ]);
  return {
    opportunities: opp.n,
    totalInvestment: opp.total ?? 0,
    sectors: sec.n,
    regions: reg.n,
    requests: req.n,
    investors: inv.n,
  };
}

// Fiche détaillée (section 13) avec médias, documents et opportunités similaires
export async function getBySlug(slug: string) {
  const [row] = await db
    .select({
      opportunity: opportunities,
      sector: sectors.name,
      sectorSlug: sectors.slug,
      region: regions.name,
      district: districts.name,
      commune: communes.name,
    })
    .from(opportunities)
    .innerJoin(sectors, eq(sectors.id, opportunities.sectorId))
    .innerJoin(regions, eq(regions.id, opportunities.regionId))
    .leftJoin(districts, eq(districts.id, opportunities.districtId))
    .leftJoin(communes, eq(communes.id, opportunities.communeId))
    .where(and(eq(opportunities.slug, slug), published))
    .limit(1);
  if (!row) throw new HttpError(404, "Opportunité introuvable");

  const o = row.opportunity;
  const [media, documents, similar] = await Promise.all([
    db
      .select()
      .from(opportunityMedia)
      .where(eq(opportunityMedia.opportunityId, o.id))
      .orderBy(desc(opportunityMedia.isCover), asc(opportunityMedia.sortOrder)),
    // Métadonnées seulement : l'accès aux fichiers privés est contrôlé par /api/files
    db
      .select({
        id: opportunityDocuments.id,
        name: opportunityDocuments.name,
        type: opportunityDocuments.type,
        fileKey: opportunityDocuments.fileKey,
        mimeType: opportunityDocuments.mimeType,
        isPublic: opportunityDocuments.isPublic,
        createdAt: opportunityDocuments.createdAt,
      })
      .from(opportunityDocuments)
      .where(eq(opportunityDocuments.opportunityId, o.id))
      .orderBy(desc(opportunityDocuments.createdAt)),
    // Même secteur, la même région d'abord
    selectCards(db)
      .where(and(published, ne(opportunities.id, o.id), eq(opportunities.sectorId, o.sectorId)))
      .orderBy(desc(sql`${opportunities.regionId} = ${o.regionId}`), desc(opportunities.publishedAt))
      .limit(3),
  ]);

  return {
    ...o,
    sector: row.sector,
    sectorSlug: row.sectorSlug,
    region: row.region,
    district: row.district,
    commune: row.commune,
    media,
    documents,
    similar,
  };
}

// Statistique de consultation (section 27), appelée depuis la fiche
export async function trackView(id: string, userId: string | undefined) {
  const [row] = await db
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(and(eq(opportunities.id, id), published))
    .limit(1);
  if (row) await db.insert(opportunityViews).values({ opportunityId: row.id, userId: userId ?? null });
}
