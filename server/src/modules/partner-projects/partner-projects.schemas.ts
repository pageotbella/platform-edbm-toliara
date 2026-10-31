import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional();
const year = z.number().int().min(1990).max(2100).optional();

export const partnerProjectSchema = z
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
    amountUsd: z.number().nonnegative().optional(),
    beneficiaries: optionalText(4000),
    contact: optionalText(1000),
    source: optionalText(1000),
    notes: optionalText(6000),
    regionId: z.uuid(),
    isPublished: z.boolean().optional(),
  })
  .refine((v) => !v.startYear || !v.endYear || v.endYear >= v.startYear, {
    message: "L'année de fin précède l'année de début",
    path: ["endYear"],
  });

export type PartnerProjectInput = z.infer<typeof partnerProjectSchema>;
