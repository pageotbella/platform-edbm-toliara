import { eq } from "drizzle-orm";
import { DEFAULT_CONTACT } from "@/config/constants";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { logAudit } from "@/lib/audit";

// Coordonnées de l'antenne : valeurs enregistrées, complétées par les valeurs par défaut
export async function contact() {
  const [row] = await db.select().from(settings).where(eq(settings.key, "contact")).limit(1);
  return { ...DEFAULT_CONTACT, ...((row?.value as object) ?? {}), updatedAt: row?.updatedAt ?? null };
}

export async function updateContact(input: Record<string, string>, userId: string) {
  await db
    .insert(settings)
    .values({ key: "contact", value: input })
    .onConflictDoUpdate({ target: settings.key, set: { value: input, updatedAt: new Date() } });
  await logAudit({ userId, action: "settings.update", entity: "settings", entityId: "contact", details: input });
}
