import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { districts, favorites, opportunities, regions, sectors } from "@/db/schema";
import { cardColumns } from "@/modules/opportunities/opportunity-card";
import { HttpError } from "@/utils/http-error";

// Section 16 : projets enregistrés avec secteur, région, date d'ajout et lien vers la fiche
export const list = (userId: string) =>
  db
    .select({ ...cardColumns, favoriteId: favorites.id, addedAt: favorites.createdAt })
    .from(opportunities)
    .innerJoin(favorites, eq(favorites.opportunityId, opportunities.id))
    .innerJoin(sectors, eq(sectors.id, opportunities.sectorId))
    .innerJoin(regions, eq(regions.id, opportunities.regionId))
    .leftJoin(districts, eq(districts.id, opportunities.districtId))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));

// Identifiants des favoris, pour l'état des boutons cœur
export async function ids(userId: string) {
  const rows = await db.select({ id: favorites.opportunityId }).from(favorites).where(eq(favorites.userId, userId));
  return rows.map((r) => r.id);
}

export async function toggle(userId: string, opportunityId: string) {
  const where = and(eq(favorites.userId, userId), eq(favorites.opportunityId, opportunityId));
  const [existing] = await db.select({ id: favorites.id }).from(favorites).where(where).limit(1);
  if (existing) {
    await db.delete(favorites).where(where);
    return { favorited: false };
  }
  const [opp] = await db
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(and(eq(opportunities.id, opportunityId), eq(opportunities.status, "publiee")))
    .limit(1);
  if (!opp) throw new HttpError(404, "Opportunité introuvable");
  await db.insert(favorites).values({ userId, opportunityId }).onConflictDoNothing();
  return { favorited: true };
}
