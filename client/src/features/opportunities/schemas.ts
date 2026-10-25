import { z } from "zod";
import { OPPORTUNITY_STATUSES } from "@/config/constants";

export const opportunitySortValues = ["recent", "montant_desc", "montant_asc", "titre"] as const;

export const opportunityFilterSchema = z.object({
  q: z.string().trim().optional(),
  sectorId: z.uuid().optional(),
  regionId: z.uuid().optional(),
  districtId: z.uuid().optional(),
  communeId: z.uuid().optional(),
  projectType: z.string().optional(),
  minInvestment: z.number().nonnegative().optional(),
  maxInvestment: z.number().nonnegative().optional(),
  sort: z.enum(opportunitySortValues).default("recent"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(12),
});
export type OpportunityFilters = z.input<typeof opportunityFilterSchema>;

export const mapFilterSchema = z.object({
  sectorId: z.uuid().optional(),
  regionId: z.uuid().optional(),
});

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
  latitude: z.number().min(-26).max(-11).optional(),   // bornes approximatives de Madagascar
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
export type OpportunityInput = z.input<typeof opportunityInputSchema>;

// Portefeuille de l'espace EDBM (tous statuts)
export const staffListSchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(OPPORTUNITY_STATUSES).optional(),
  sectorId: z.uuid().optional(),
  regionId: z.uuid().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
});
export type StaffListInput = z.input<typeof staffListSchema>;
