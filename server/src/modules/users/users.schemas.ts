import { z } from "zod";
import { ROLES, USER_STATUSES } from "@/config/constants";

// Mêmes règles que client/src/features/users/schemas.ts
export const permissionsSchema = z.object({
  canPublish: z.boolean(),
  canManageSectors: z.boolean(),
  canManageRegions: z.boolean(),
});
export type PermissionsInput = z.infer<typeof permissionsSchema>;

export const listQuerySchema = z.object({
  q: z.string().trim().optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});
export type UserListQuery = z.infer<typeof listQuerySchema>;

// Gestion des utilisateurs par l'administrateur (section 22)
export const userCreateSchema = z.object({
  name: z.string().trim().min(2, "Nom complet requis").max(120),
  email: z.email("Adresse e-mail invalide"),
  phone: z.string().trim().max(40).optional(),
  role: z.enum(ROLES),
  permissions: permissionsSchema.optional(),
});
export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2, "Nom complet requis").max(120),
  phone: z.string().trim().max(40).optional(),
  role: z.enum(ROLES),
  permissions: permissionsSchema.optional(),
});
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const statusSchema = z.object({ status: z.enum(USER_STATUSES) });
export const passwordSchema = z.object({ password: z.string().min(8, "8 caractères minimum") });
export const idParamsSchema = z.object({ id: z.string().min(1) });
