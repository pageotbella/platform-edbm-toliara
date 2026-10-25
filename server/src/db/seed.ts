// Données initiales, idempotent : ne modifie jamais une ligne existante.
//   npm run db:seed              → référentiels + comptes et opportunités de démonstration
//   npm run db:seed -- --no-demo → référentiels uniquement (secteurs, régions, contact)
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { db } from "./index";
import {
  account,
  agentPermissions,
  communes,
  districts,
  investorProfiles,
  opportunities,
  type OpportunityStatus,
  regions,
  sectors,
  settings,
  user,
} from "./schema";
import demoOpportunities from "./seed-data/opportunities.json";
import reference from "./seed-data/reference.json";

const withDemo = !process.argv.includes("--no-demo");

async function seedReference() {
  await db.insert(sectors).values(reference.sectors).onConflictDoNothing();

  for (const r of reference.regions) {
    await db.insert(regions).values({ name: r.name, code: r.code }).onConflictDoNothing();
    const [region] = await db.select().from(regions).where(eq(regions.code, r.code));

    for (const d of r.districts) {
      let [district] = await db
        .select()
        .from(districts)
        .where(and(eq(districts.regionId, region.id), eq(districts.name, d.name)));
      district ??= (await db.insert(districts).values({ regionId: region.id, name: d.name }).returning())[0];

      for (const name of d.communes) {
        const [exists] = await db
          .select({ id: communes.id })
          .from(communes)
          .where(and(eq(communes.districtId, district.id), eq(communes.name, name)));
        if (!exists) await db.insert(communes).values({ districtId: district.id, name });
      }
    }
  }

  await db.insert(settings).values({ key: "contact", value: reference.contact }).onConflictDoNothing();
}

const demoUsers = [
  { email: "admin@edbm.mg", name: "Administrateur EDBM", role: "admin", password: "Admin1234!" },
  { email: "agent@edbm.mg", name: "Agent EDBM Toliara", role: "agent", password: "Agent1234!", canPublish: true, canManageSectors: true },
  { email: "agent2@edbm.mg", name: "Agent EDBM 2", role: "agent", password: "Agent1234!" },
  { email: "investisseur@demo.mg", name: "Investisseur Démo", role: "investisseur", password: "Invest1234!" },
];

// Insertion directe (role et status ne passent pas par l'inscription Better Auth)
async function seedUsers() {
  for (const u of demoUsers) {
    const [exists] = await db.select({ id: user.id }).from(user).where(eq(user.email, u.email));
    if (exists) continue;

    const id = randomUUID().replaceAll("-", "");
    await db.transaction(async (tx) => {
      await tx.insert(user).values({ id, email: u.email, name: u.name, role: u.role, emailVerified: true });
      await tx.insert(account).values({
        id: randomUUID().replaceAll("-", ""),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: await hashPassword(u.password),
      });
      await tx.insert(investorProfiles).values({ userId: id }).onConflictDoNothing();
      if (u.role === "agent") {
        await tx.insert(agentPermissions).values({
          userId: id,
          canPublish: u.canPublish ?? false,
          canManageSectors: u.canManageSectors ?? false,
        });
      }
    });
    console.log(`  compte créé : ${u.email}`);
  }
}

async function seedOpportunities() {
  const [allSectors, allRegions, allDistricts, allCommunes, allUsers] = await Promise.all([
    db.select().from(sectors),
    db.select().from(regions),
    db.select().from(districts),
    db.select().from(communes),
    db.select({ id: user.id, email: user.email }).from(user),
  ]);

  for (const o of demoOpportunities) {
    const { sector, region, district, commune, createdBy, status, ...fields } = o;
    const regionId = allRegions.find((r) => r.code === region)!.id;
    const districtId = allDistricts.find((d) => d.regionId === regionId && d.name === district)?.id;
    const communeId = allCommunes.find((c) => c.districtId === districtId && c.name === commune)?.id;

    await db
      .insert(opportunities)
      .values({
        ...fields,
        sectorId: allSectors.find((s) => s.slug === sector)!.id,
        regionId,
        districtId,
        communeId,
        status: status as OpportunityStatus,
        publishedAt: status === "publiee" ? new Date() : null,
        createdBy: allUsers.find((u) => u.email === createdBy)!.id,
      })
      .onConflictDoNothing();
  }
}

console.log("Référentiels (secteurs, régions, contact)…");
await seedReference();
if (withDemo) {
  console.log("Données de démonstration…");
  await seedUsers();
  await seedOpportunities();
}
console.log("Seed terminé.");
process.exit(0);
