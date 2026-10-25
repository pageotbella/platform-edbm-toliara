import { and, count, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, user } from "@/db/schema";
import type { AuditFilters, AuditListQuery } from "./audit-logs.schemas";

// Colonnes d'une ligne du journal (liste, export, tableau de bord administrateur)
export const auditColumns = {
  id: auditLogs.id,
  action: auditLogs.action,
  entity: auditLogs.entity,
  entityId: auditLogs.entityId,
  details: auditLogs.details,
  createdAt: auditLogs.createdAt,
  userName: user.name,
  userEmail: user.email,
  userRole: user.role,
};

function auditWhere(input: AuditFilters) {
  const like = input.q ? `%${input.q}%` : undefined;
  return and(
    input.entity ? eq(auditLogs.entity, input.entity) : undefined,
    input.userId ? eq(auditLogs.userId, input.userId) : undefined,
    input.from ? gte(auditLogs.createdAt, input.from) : undefined,
    input.to ? lte(auditLogs.createdAt, input.to) : undefined,
    like
      ? or(
          ilike(auditLogs.action, like),
          ilike(auditLogs.entityId, like),
          ilike(user.name, like),
          ilike(user.email, like),
          sql`${auditLogs.details}::text ilike ${like}`,
        )
      : undefined,
  );
}

// Journal d'activité (section 5.1 « historique des actions importantes »)
export async function list(input: AuditListQuery) {
  const where = auditWhere(input);
  const [items, [{ total }], entities, actors] = await Promise.all([
    db
      .select(auditColumns)
      .from(auditLogs)
      .leftJoin(user, eq(user.id, auditLogs.userId))
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize),
    db.select({ total: count() }).from(auditLogs).leftJoin(user, eq(user.id, auditLogs.userId)).where(where),
    db.selectDistinct({ entity: auditLogs.entity }).from(auditLogs).orderBy(auditLogs.entity),
    db.selectDistinct({ id: user.id, name: user.name }).from(auditLogs).innerJoin(user, eq(user.id, auditLogs.userId)).orderBy(user.name),
  ]);
  return {
    items,
    total,
    pageCount: Math.max(1, Math.ceil(total / input.pageSize)),
    entities: entities.map((e) => e.entity),
    actors,
  };
}

// Export CSV (2 000 lignes maximum, mêmes filtres que la liste)
export const exportRows = (input: AuditFilters) =>
  db
    .select(auditColumns)
    .from(auditLogs)
    .leftJoin(user, eq(user.id, auditLogs.userId))
    .where(auditWhere(input))
    .orderBy(desc(auditLogs.createdAt))
    .limit(2000);
