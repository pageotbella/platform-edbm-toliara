import { z } from "zod";

const optional = (max: number) => z.string().trim().max(max).optional().or(z.literal("").transform(() => undefined));

// « Mon profil » (sections 6.2 et 28 : USERS + INVESTOR_PROFILES)
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Nom complet requis").max(120),
  phone: optional(40),
  company: optional(160),
  country: optional(80),
  interestSectorId: z.uuid().nullable().optional(),
  description: optional(2000),
});
export type ProfileUpdateInput = z.input<typeof profileUpdateSchema>;

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "8 caractères minimum"),
  confirm: z.string(),
}).refine((v) => v.newPassword === v.confirm, { path: ["confirm"], message: "Les mots de passe ne correspondent pas" });
