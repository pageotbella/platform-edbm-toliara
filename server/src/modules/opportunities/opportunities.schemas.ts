import { z } from "zod";
import { opportunityStatusValues } from "@/db/schema";

// Mêmes règles que client/src/features/opportunities/schemas.ts
export const opportunitySortValues = ["recent", "montant_desc", "montant_asc", "titre"] as const;

// Recherche (section 12.3) et filtres (section 12.4) du catalogue ; paramètres de requête → nombres coercés
export const listQuerySchema = z.object({
  q: z.string().trim().optional(),
  sectorId: z.uuid().optional(),
  regionId: z.uuid().optional(),
  districtId: z.uuid().optional(),
  communeId: z.uuid().optional(),
  projectType: z.string().optional(),
  minInvestment: z.coerce.number().nonnegative().optional(),
  maxInvestment: z.coerce.number().nonnegative().optional(),
  sort: z.enum(opportunitySortValues).default("recent"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export const mapPointsQuerySchema = listQuerySchema.omit({ sort: true, page: true, pageSize: true });
export type MapPointsQuery = z.infer<typeof mapPointsQuerySchema>;

export const featuredQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(12).default(3) });

export const slugParamsSchema = z.object({ slug: z.string().min(1).max(220) });
export const idParamsSchema = z.object({ id: z.uuid() });

const optionalText = z.string().trim().max(5000).optional();

export const opportunityInputSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court").max(200),
  description: z.string().trim().min(20, "Description trop courte (20 caractères minimum)"),
  sectorId: z.uuid("Secteur requis"),
  subSector: z.string().trim().max(120).optional(),
  projectType: z.string().trim().max(120).optional(),
  regionId: z.uuid("Région requise"),
  districtId: z.uuid().optional(),
  communeId: z.uuid().optional(),
  latitude: z.number().min(-26).max(-11).optional(), // bornes approximatives de Madagascar
  longitude: z.number().min(43).max(51).optional(),
  estimatedInvestment: z.number().positive().optional(),
  currency: z.enum(["USD", "EUR", "MGA"]).default("USD"),
  investmentModel: optionalText,
  potential: optionalText,
  targetMarket: optionalText,
  resources: optionalText,
  infrastructures: optionalText,
  zoneAdvantages: optionalText,
  isFeatured: z.boolean().default(false),
});
export type OpportunityInput = z.infer<typeof opportunityInputSchema>;

// `note` : remarque transmise au porteur de projet (ex. compléments demandés lors d'un renvoi en brouillon)
export const changeStatusSchema = z.object({
  status: z.enum(opportunityStatusValues),
  note: z.string().trim().max(2000).optional(),
});
