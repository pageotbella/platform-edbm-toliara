import { z } from "zod";
import { requestStatusValues } from "@/db/schema";

// Formulaire « Je suis intéressé » (section 14) — mêmes règles que client/src/features/interest-requests/schemas.ts
export const interestRequestSchema = z.object({
  opportunityId: z.uuid(),
  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().min(1, "Nom requis").max(80),
  email: z.email("Adresse e-mail invalide"),
  company: z.string().trim().min(2, "Entreprise requise").max(160),
  country: z.string().trim().min(2, "Pays requis").max(80),
  phone: z.string().trim().min(6, "Téléphone invalide").max(40),
  amount: z.number().positive("Montant invalide").optional(),
  message: z.string().trim().max(2000).optional(),
});
export type InterestRequestInput = z.infer<typeof interestRequestSchema>;

export const mineQuerySchema = z.object({ status: z.enum(requestStatusValues).optional() });

export const staffListQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(requestStatusValues).optional(),
  opportunityId: z.uuid().optional(),
  mine: z.stringbool().optional(),
});
export type StaffRequestQuery = z.infer<typeof staffListQuerySchema>;

// Traitement : statut, réponse visible par l'investisseur, note interne
export const processSchema = z.object({
  status: z.enum(requestStatusValues).optional(),
  edbmResponse: z.string().trim().max(4000).optional(),
  internalNote: z.string().trim().max(4000).optional(),
});
export type ProcessInput = z.infer<typeof processSchema>;

export const idParamsSchema = z.object({ id: z.uuid() });
