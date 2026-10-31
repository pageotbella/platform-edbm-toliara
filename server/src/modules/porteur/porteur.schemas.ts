import { z } from "zod";

const optionalText = z.string().trim().max(5000).optional();

// Projet déposé par un porteur : sous-ensemble du formulaire EDBM (mêmes règles que
// client/src/features/porteur/schemas.ts). Les champs éditoriaux (mise en avant, infrastructures,
// atouts de la zone) restent à la main de l'EDBM.
export const projectInputSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court").max(200),
  description: z.string().trim().min(20, "Décrivez votre projet en 20 caractères au moins"),
  sectorId: z.uuid("Secteur requis"),
  projectType: z.string().trim().max(120).optional(),
  regionId: z.uuid("Région requise"),
  districtId: z.uuid().optional(),
  communeId: z.uuid().optional(),
  latitude: z.number().min(-26).max(-11).optional(),
  longitude: z.number().min(43).max(51).optional(),
  estimatedInvestment: z.number().positive().optional(),
  currency: z.enum(["USD", "EUR", "MGA"]).default("USD"),
  investmentModel: optionalText,
  potential: optionalText,
  targetMarket: optionalText,
  resources: optionalText,
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const idParamsSchema = z.object({ id: z.uuid() });
