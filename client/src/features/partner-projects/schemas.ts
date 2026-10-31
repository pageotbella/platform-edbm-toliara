import { z } from "zod";

// Aligné sur server/src/modules/partner-projects/partner-projects.schemas.ts
const optionalText = (max: number) => z.string().trim().max(max).optional();
const year = z.number().int("Année invalide").min(1990, "Année invalide").max(2100, "Année invalide").optional();

export const partnerProjectInputSchema = z
  .object({
    title: z.string().trim().min(2, "Nom trop court").max(200),
    fullName: optionalText(300),
    donor: z.string().trim().min(2, "Bailleur requis").max(200),
    implementer: optionalText(1000),
    sectors: optionalText(1000),
    duration: optionalText(500),
    startYear: year,
    endYear: year,
    funding: optionalText(1000),
    amountUsd: z.number().nonnegative("Montant invalide").optional(),
    beneficiaries: optionalText(4000),
    contact: optionalText(1000),
    source: optionalText(1000),
    notes: optionalText(6000),
    regionId: z.uuid("Région requise"),
    isPublished: z.boolean(),
  })
  .refine((v) => !v.startYear || !v.endYear || v.endYear >= v.startYear, {
    message: "L'année de fin précède l'année de début",
    path: ["endYear"],
  });

export type PartnerProjectInput = z.input<typeof partnerProjectInputSchema>;
export type PartnerProjectOutput = z.output<typeof partnerProjectInputSchema>;
