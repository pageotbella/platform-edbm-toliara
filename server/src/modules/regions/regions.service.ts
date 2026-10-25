import { and, asc, count, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { communes, districts, opportunities, regions } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slugify";
import { selectCards } from "@/modules/opportunities/opportunity-card";
import { isUniqueViolation } from "@/utils/db-errors";
import { HttpError } from "@/utils/http-error";

const published = eq(opportunities.status, "publiee");

// Hiérarchie Région → District → Commune (formulaires)
export async function tree() {
  const [r, d, c] = await Promise.all([
    db.select().from(regions).orderBy(asc(regions.name)),
    db.select().from(districts).orderBy(asc(districts.name)),
    db.select().from(communes).orderBy(asc(communes.name)),
  ]);
  return r.map((region) => ({
    ...region,
    districts: d
      .filter((x) => x.regionId === region.id)
      .map((district) => ({ ...district, communes: c.filter((x) => x.districtId === district.id) })),
  }));
}

// Régions avec le nombre de projets publiés, de districts et le volume estimé
export const summary = () =>
  db
    .select({
      id: regions.id,
      name: regions.name,
      code: regions.code,
      count: sql<number>`count(distinct ${opportunities.id})::int`,
      districts: sql<number>`(select count(*) from districts d where d.region_id = ${regions.id})::int`,
      total: sql<number>`coalesce(sum(${opportunities.estimatedInvestment}), 0)::float`,
    })
    .from(regions)
    .leftJoin(opportunities, and(eq(opportunities.regionId, regions.id), published))
    .groupBy(regions.id)
    .orderBy(desc(sql`count(distinct ${opportunities.id})`), asc(regions.name));

// Fiche région : districts et communes, répartition par secteur, opportunités publiées
export async function detail(id: string) {
  const [region] = await db.select().from(regions).where(eq(regions.id, id)).limit(1);
  if (!region) throw new HttpError(404, "Région introuvable");
  const [dists, comms, items] = await Promise.all([
    db.select().from(districts).where(eq(districts.regionId, id)).orderBy(asc(districts.name)),
    db
      .select({ id: communes.id, name: communes.name, districtId: communes.districtId })
      .from(communes)
      .innerJoin(districts, eq(districts.id, communes.districtId))
      .where(eq(districts.regionId, id))
      .orderBy(asc(communes.name)),
    selectCards(db).where(and(published, eq(opportunities.regionId, id))).orderBy(desc(opportunities.publishedAt)),
  ]);
  const bySector = new Map<string, number>();
  for (const o of items) bySector.set(o.sector, (bySector.get(o.sector) ?? 0) + 1);
  return {
    region,
    districts: dists.map((d) => ({
      ...d,
      communes: comms.filter((c) => c.districtId === d.id),
      count: items.filter((o) => o.district === d.name).length,
    })),
    sectors: [...bySector].map(([name, n]) => ({ name, count: n })).sort((a, b) => b.count - a.count),
    items,
  };
}

// ── Gestion (section 24) : agents avec la permission canManageRegions, administrateurs ──

// Arborescence complète avec le nombre d'opportunités (tous statuts) à chaque niveau
export async function manage() {
  const [regionRows, districtRows, communeRows, counts] = await Promise.all([
    db.select().from(regions).orderBy(asc(regions.name)),
    db.select().from(districts).orderBy(asc(districts.name)),
    db.select().from(communes).orderBy(asc(communes.name)),
    db
      .select({
        regionId: opportunities.regionId,
        districtId: opportunities.districtId,
        communeId: opportunities.communeId,
        n: count(),
      })
      .from(opportunities)
      .groupBy(opportunities.regionId, opportunities.districtId, opportunities.communeId),
  ]);
  const sum = (pred: (c: (typeof counts)[number]) => boolean) => counts.filter(pred).reduce((s, c) => s + c.n, 0);
  return regionRows.map((r) => ({
    ...r,
    opportunities: sum((c) => c.regionId === r.id),
    districts: districtRows
      .filter((d) => d.regionId === r.id)
      .map((d) => ({
        ...d,
        opportunities: sum((c) => c.districtId === d.id),
        communes: communeRows
          .filter((c) => c.districtId === d.id)
          .map((c) => ({ ...c, opportunities: sum((x) => x.communeId === c.id) })),
      })),
  }));
}

export async function saveRegion(id: string | undefined, input: { name: string; code?: string }, userId: string) {
  const values = { name: input.name, code: (input.code || slugify(input.name)).toUpperCase() };
  try {
    const [row] = id
      ? await db.update(regions).set(values).where(eq(regions.id, id)).returning()
      : await db.insert(regions).values(values).returning();
    if (!row) throw new HttpError(404, "Région introuvable");
    await logAudit({ userId, action: id ? "region.update" : "region.create", entity: "region", entityId: row.id, details: values });
    return row;
  } catch (e) {
    if (isUniqueViolation(e)) throw new HttpError(409, "Une région porte déjà ce nom ou ce code.");
    throw e;
  }
}

// Création (regionId) ou renommage (id) d'un district, sans doublon de nom dans la région
export async function saveDistrict(input: { id?: string; regionId?: string; name: string }, userId: string) {
  let regionId = input.regionId;
  if (input.id) {
    const [d] = await db.select({ regionId: districts.regionId }).from(districts).where(eq(districts.id, input.id)).limit(1);
    if (!d) throw new HttpError(404, "District introuvable");
    regionId = d.regionId;
  }
  const [dup] = await db
    .select({ id: districts.id })
    .from(districts)
    .where(
      and(
        eq(districts.regionId, regionId!),
        sql`lower(${districts.name}) = lower(${input.name})`,
        input.id ? ne(districts.id, input.id) : undefined,
      ),
    )
    .limit(1);
  if (dup) throw new HttpError(409, "Ce district existe déjà dans la région.");
  const [row] = input.id
    ? await db.update(districts).set({ name: input.name }).where(eq(districts.id, input.id)).returning()
    : await db.insert(districts).values({ regionId: regionId!, name: input.name }).returning();
  await logAudit({
    userId, action: input.id ? "district.update" : "district.create", entity: "district", entityId: row.id,
    details: { name: input.name },
  });
  return row;
}

// Création (districtId) ou renommage (id) d'une commune, sans doublon de nom dans le district
export async function saveCommune(input: { id?: string; districtId?: string; name: string }, userId: string) {
  let districtId = input.districtId;
  if (input.id) {
    const [c] = await db.select({ districtId: communes.districtId }).from(communes).where(eq(communes.id, input.id)).limit(1);
    if (!c) throw new HttpError(404, "Commune introuvable");
    districtId = c.districtId;
  }
  const [dup] = await db
    .select({ id: communes.id })
    .from(communes)
    .where(
      and(
        eq(communes.districtId, districtId!),
        sql`lower(${communes.name}) = lower(${input.name})`,
        input.id ? ne(communes.id, input.id) : undefined,
      ),
    )
    .limit(1);
  if (dup) throw new HttpError(409, "Cette commune existe déjà dans le district.");
  const [row] = input.id
    ? await db.update(communes).set({ name: input.name }).where(eq(communes.id, input.id)).returning()
    : await db.insert(communes).values({ districtId: districtId!, name: input.name }).returning();
  await logAudit({
    userId, action: input.id ? "commune.update" : "commune.create", entity: "commune", entityId: row.id,
    details: { name: input.name },
  });
  return row;
}

// Suppression refusée tant que des opportunités y sont rattachées
export async function remove(level: "region" | "district" | "commune", id: string, userId: string) {
  const column = { region: opportunities.regionId, district: opportunities.districtId, commune: opportunities.communeId }[level];
  const [{ n }] = await db.select({ n: count() }).from(opportunities).where(eq(column, id));
  if (n > 0) throw new HttpError(400, `Impossible : ${n} opportunité(s) y sont rattachées.`);
  const table = { region: regions, district: districts, commune: communes }[level];
  const deleted = await db.delete(table).where(eq(table.id, id)).returning({ id: table.id });
  if (!deleted.length) throw new HttpError(404, "Élément introuvable");
  await logAudit({ userId, action: `${level}.delete`, entity: level, entityId: id });
}
