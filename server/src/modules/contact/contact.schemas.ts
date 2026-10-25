import { z } from "zod";

// Formulaire de la page Contact (mêmes règles que client/src/features/settings/schemas.ts)
export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(120),
  email: z.email("Adresse e-mail invalide"),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  subject: z.string().trim().min(3, "Objet requis").max(160),
  message: z.string().trim().min(10, "Message trop court").max(5000),
  // Champ piège invisible : rempli uniquement par les robots
  website: z.string().max(200).optional(),
});
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
