import { z } from "zod";

const optional = (max: number) => z.string().trim().max(max).optional().or(z.literal("").transform(() => undefined));

// « Mon profil » (sections 6.2 et 28 : USERS + INVESTOR_PROFILES) — mêmes règles que le client
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Nom complet requis").max(120),
  phone: optional(40),
  company: optional(160),
  country: optional(80),
  interestSectorId: z.uuid().nullable().optional(),
  description: optional(2000),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
