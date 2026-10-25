import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { opportunities, sectors } from "@/db/schema";
import { selectCards } from "@/modules/opportunities/opportunity-card";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slugify";
import { isUniqueViolation } from "@/utils/db-errors";
import { HttpError } from "@/utils/http-error";

const published = eq(opportunities.status, "publiee");

export const listActive = () =>
  db.select().from(sectors).where(eq(sectors.isActive, true)).orderBy(asc(sectors.name));

// Secteurs actifs avec le nombre et le volume des opportunités publiées
export const summary = () =>
  db
    .select({
      id: sectors.id,
      name: sectors.name,
      slug: sectors.slug,
      description: sectors.description,
      count: sql<number>`count(${opportunities.id})::int`,
      total: sql<number>`coalesce(sum(${opportunities.estimatedInvestment}), 0)::float`,
    })
    .from(sectors)
    .leftJoin(opportunities, and(eq(opportunities.sectorId, sectors.id), published))
    .where(eq(sectors.isActive, true))
    .groupBy(sectors.id)
    .orderBy(asc(sectors.name));

export async function bySlug(slug: string) {
  const [sector] = await db
    .select()
    .from(sectors)
    .where(and(eq(sectors.slug, slug), eq(sectors.isActive, true)))
    .limit(1);
  if (!sector) throw new HttpError(404, "Secteur introuvable");
  const items = await selectCards(db)
    .where(and(published, eq(opportunities.sectorId, sector.id)))
    .orderBy(desc(opportunities.publishedAt));
  return { sector, items };
}

// ── Gestion (section 23) : agents avec la permission canManageSectors, administrateurs ──

// Secteurs actifs et désactivés, avec les opportunités associées
export const manage = () =>
  db
    .select({
      id: sectors.id,
      name: sectors.name,
      slug: sectors.slug,
      description: sectors.description,
      isActive: sectors.isActive,
      opportunities: sql<number>`count(${opportunities.id})::int`,
      published: sql<number>`count(${opportunities.id}) filter (where ${opportunities.status} = 'publiee')::int`,
      investment: sql<number>`coalesce(sum(${opportunities.estimatedInvestment}) filter (where ${opportunities.status} = 'publiee'), 0)::float`,
    })
    .from(sectors)
    .leftJoin(opportunities, eq(opportunities.sectorId, sectors.id))
    .groupBy(sectors.id)
    .orderBy(asc(sectors.name));

export async function save(id: string | undefined, input: { name: string; description?: string }, userId: string) {
  const values = { name: input.name, slug: slugify(input.name), description: input.description || null };
  try {
    const [row] = id
      ? await db.update(sectors).set(values).where(eq(sectors.id, id)).returning()
      : await db.insert(sectors).values(values).returning();
    if (!row) throw new HttpError(404, "Secteur introuvable");
    await logAudit({ userId, action: id ? "sector.update" : "sector.create", entity: "sector", entityId: row.id, details: { name: row.name } });
    return row;
  } catch (e) {
    if (isUniqueViolation(e)) throw new HttpError(409, "Un secteur porte déjà ce nom.");
    throw e;
  }
}

export async function setActive(id: string, isActive: boolean, userId: string) {
  const [row] = await db.update(sectors).set({ isActive }).where(eq(sectors.id, id)).returning();
  if (!row) throw new HttpError(404, "Secteur introuvable");
  await logAudit({ userId, action: isActive ? "sector.activate" : "sector.deactivate", entity: "sector", entityId: id });
}
