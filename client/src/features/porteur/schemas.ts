import { z } from "zod";

// Projet déposé par un porteur (mêmes règles que server/src/modules/porteur/porteur.schemas.ts)
export const projectInputSchema = z.object({
  title: z.string().trim().min(3, "Donnez un titre à votre projet").max(200),
  description: z.string().trim().min(20, "Décrivez votre projet en 20 caractères au moins"),
  sectorId: z.uuid("Choisissez un secteur"),
  projectType: z.string().trim().max(120).optional(),
  regionId: z.uuid("Choisissez une région"),
  districtId: z.uuid().optional(),
  communeId: z.uuid().optional(),
  latitude: z.number().min(-26).max(-11).optional(),
  longitude: z.number().min(43).max(51).optional(),
  estimatedInvestment: z.number({ error: "Montant invalide" }).positive("Le montant doit être positif").optional(),
  currency: z.enum(["USD", "EUR", "MGA"]).default("USD"),
  investmentModel: z.string().trim().max(5000).optional(),
  potential: z.string().trim().max(5000).optional(),
  targetMarket: z.string().trim().max(5000).optional(),
  resources: z.string().trim().max(5000).optional(),
});
export type ProjectInput = z.input<typeof projectInputSchema>;
export type ProjectOutput = z.output<typeof projectInputSchema>;
