import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agentPermissions } from "@/db/schema";

export type Permissions = { canPublish: boolean; canManageSectors: boolean; canManageRegions: boolean };
export type Permission = keyof Permissions;

const NONE: Permissions = { canPublish: false, canManageSectors: false, canManageRegions: false };
const ALL: Permissions = { canPublish: true, canManageSectors: true, canManageRegions: true };

export type Actor = { id: string; role?: string | null };

// L'administrateur a tous les droits ; un agent n'a que les droits cochés pour lui
export async function getPermissions(u: Actor): Promise<Permissions> {
  if (u.role === "admin") return ALL;
  if (u.role !== "agent") return NONE;
  const [row] = await db.select().from(agentPermissions).where(eq(agentPermissions.userId, u.id));
  return row
    ? { canPublish: row.canPublish, canManageSectors: row.canManageSectors, canManageRegions: row.canManageRegions }
    : NONE;
}
