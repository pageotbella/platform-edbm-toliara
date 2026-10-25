import { eq } from "drizzle-orm";
import { db } from "@/db";
import { investorProfiles, sectors, user } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import type { ProfileUpdateInput } from "./profile.schemas";

// Profil de l'utilisateur connecté (tous rôles ; le volet entreprise concerne surtout les investisseurs)
export async function get(userId: string) {
  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      company: investorProfiles.company,
      country: investorProfiles.country,
      profilePhone: investorProfiles.phone,
      interestSectorId: investorProfiles.interestSectorId,
      interestSector: sectors.name,
      description: investorProfiles.description,
    })
    .from(user)
    .leftJoin(investorProfiles, eq(investorProfiles.userId, user.id))
    .leftJoin(sectors, eq(sectors.id, investorProfiles.interestSectorId))
    .where(eq(user.id, userId))
    .limit(1);
  const { profilePhone, ...profile } = row;
  return { ...profile, phone: row.phone ?? profilePhone };
}

export async function update(userId: string, input: ProfileUpdateInput) {
  const { name, phone, ...profile } = input;
  await db.update(user).set({ name, phone: phone ?? null, updatedAt: new Date() }).where(eq(user.id, userId));
  await db
    .insert(investorProfiles)
    .values({ userId, ...profile, phone })
    .onConflictDoUpdate({
      target: investorProfiles.userId,
      set: {
        company: profile.company ?? null,
        country: profile.country ?? null,
        phone: phone ?? null,
        interestSectorId: profile.interestSectorId ?? null,
        description: profile.description ?? null,
      },
    });
  await logAudit({ userId, action: "profile.update", entity: "user", entityId: userId });
}
