import { z } from "zod";

// Formulaire « Je suis intéressé » (section 14 du cahier des charges)
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
