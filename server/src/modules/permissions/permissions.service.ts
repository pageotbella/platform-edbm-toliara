import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { agentPermissions, interestRequests, user } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { type Actor, getPermissions } from "@/lib/permissions";
import { savePermissions } from "@/modules/users/users.service";
import type { PermissionsInput } from "@/modules/users/users.schemas";
import { HttpError } from "@/utils/http-error";

// Agent ou administrateur connecté : permissions (menus, actions) et nouvelles demandes à traiter
export async function me(actor: Actor) {
  const [perms, [{ n }]] = await Promise.all([
    getPermissions(actor),
    db.select({ n: count() }).from(interestRequests).where(eq(interestRequests.status, "nouvelle")),
  ]);
  return { ...perms, role: actor.role ?? "", newRequests: n };
}

// Rôles et permissions (section 7) : permissions étendues de chaque agent
export const agents = () =>
  db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      canPublish: sql<boolean>`coalesce(${agentPermissions.canPublish}, false)`,
      canManageSectors: sql<boolean>`coalesce(${agentPermissions.canManageSectors}, false)`,
      canManageRegions: sql<boolean>`coalesce(${agentPermissions.canManageRegions}, false)`,
    })
    .from(user)
    .leftJoin(agentPermissions, eq(agentPermissions.userId, user.id))
    .where(eq(user.role, "agent"))
    .orderBy(user.name);

export async function set(userId: string, perms: PermissionsInput, actorId: string) {
  const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId)).limit(1);
  if (u?.role !== "agent") throw new HttpError(400, "Les permissions ne s'appliquent qu'aux agents.");
  await savePermissions(userId, "agent", perms);
  await logAudit({ userId: actorId, action: "permission.update", entity: "user", entityId: userId, details: perms });
}
