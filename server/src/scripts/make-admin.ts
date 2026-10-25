// Passe un utilisateur existant en administrateur : npm run make-admin -- email@exemple.mg
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { session, user } from "@/db/schema";
import { logAudit } from "@/lib/audit";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage : npm run make-admin -- <email>");
  process.exit(1);
}

const [target] = await db.select().from(user).where(eq(user.email, email));
if (!target) {
  console.error(`Aucun utilisateur avec l'e-mail ${email}. Inscris-toi d'abord sur /inscription.`);
  process.exit(1);
}

await db.update(user).set({ role: "admin", status: "actif", updatedAt: new Date() }).where(eq(user.id, target.id));
// Les sessions existantes portent l'ancien rôle : on force une reconnexion
await db.delete(session).where(eq(session.userId, target.id));
await logAudit({
  userId: null,
  action: "user.role",
  entity: "user",
  entityId: target.id,
  details: { from: target.role, to: "admin", source: "make-admin" },
});

console.log(`${email} est maintenant administrateur (reconnexion nécessaire).`);
process.exit(0);
