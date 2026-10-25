import { db } from "@/db";
import { auditLogs } from "@/db/schema";

type AuditEntry = {
  userId: string | null;
  action: string; // ex. "opportunity.create", "interest.status"
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
};

// Journal d'activité. L'historique des statuts d'une demande est reconstruit
// à partir des entrées `interest.status` : ne pas les supprimer.
export async function logAudit(entry: AuditEntry, tx: Pick<typeof db, "insert"> = db) {
  await tx.insert(auditLogs).values({
    userId: entry.userId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    details: entry.details ?? null,
  });
}
