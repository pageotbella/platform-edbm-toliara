import { z } from "zod";
import { ROLES } from "@/config/constants";

export const permissionsSchema = z.object({
  canPublish: z.boolean(),
  canManageSectors: z.boolean(),
  canManageRegions: z.boolean(),
});

// Gestion des utilisateurs par l'administrateur (section 22)
export const userCreateSchema = z.object({
  name: z.string().trim().min(2, "Nom complet requis").max(120),
  email: z.email("Adresse e-mail invalide"),
  phone: z.string().trim().max(40).optional(),
  role: z.enum(ROLES),
  permissions: permissionsSchema.optional(),
});
export type UserCreateInput = z.input<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Nom complet requis").max(120),
  phone: z.string().trim().max(40).optional(),
  role: z.enum(ROLES),
  permissions: permissionsSchema.optional(),
});
export type UserUpdateInput = z.input<typeof userUpdateSchema>;

export const contactSettingsSchema = z.object({
  name: z.string().trim().min(2).max(160),
  address: z.string().trim().min(2).max(300),
  email: z.email("Adresse e-mail invalide"),
  phone: z.string().trim().min(6).max(40),
  hours: z.string().trim().min(2).max(120),
});
