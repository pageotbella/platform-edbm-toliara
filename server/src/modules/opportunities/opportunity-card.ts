import { eq, sql } from "drizzle-orm";
import type { DB } from "@/db";
import { districts, opportunities, regions, sectors } from "@/db/schema";

// Colonnes communes aux cartes d'opportunité (catalogue, accueil, favoris, carte…)
export const cardColumns = {
  id: opportunities.id,
  slug: opportunities.slug,
  reference: opportunities.reference,
  title: opportunities.title,
  description: opportunities.description,
  status: opportunities.status,
  estimatedInvestment: opportunities.estimatedInvestment,
  currency: opportunities.currency,
  investmentModel: opportunities.investmentModel,
  projectType: opportunities.projectType,
  isFeatured: opportunities.isFeatured,
  latitude: opportunities.latitude,
  longitude: opportunities.longitude,
  publishedAt: opportunities.publishedAt,
  sectorId: opportunities.sectorId,
  regionId: opportunities.regionId,
  sector: sectors.name,
  sectorSlug: sectors.slug,
  region: regions.name,
  district: districts.name,
  coverKey: sql<string | null>`(
    select m.file_key from opportunity_media m
    where m.opportunity_id = ${opportunities.id}
    order by m.is_cover desc, m.sort_order asc limit 1
  )`,
};

/** select des cartes avec les jointures nécessaires ; compléter avec .where(), .orderBy()… */
export const selectCards = (db: DB) =>
  db
    .select(cardColumns)
    .from(opportunities)
    .innerJoin(sectors, eq(sectors.id, opportunities.sectorId))
    .innerJoin(regions, eq(regions.id, opportunities.regionId))
    .leftJoin(districts, eq(districts.id, opportunities.districtId))
    .$dynamic();
