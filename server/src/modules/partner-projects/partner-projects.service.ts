import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { partnerProjects, regions } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { HttpError } from "@/utils/http-error";
import type { PartnerProjectInput } from "./partner-projects.schemas";

// Colonnes exposées (l'auteur de la fiche reste interne : journal d'activité)
const columns = {
  id: partnerProjects.id,
  title: partnerProjects.title,
  fullName: partnerProjects.fullName,
  donor: partnerProjects.donor,
  implementer: partnerProjects.implementer,
  sectors: partnerProjects.sectors,
  duration: partnerProjects.duration,
  startYear: partnerProjects.startYear,
  endYear: partnerProjects.endYear,
  funding: partnerProjects.funding,
  amountUsd: partnerProjects.amountUsd,
  beneficiaries: partnerProjects.beneficiaries,
  contact: partnerProjects.contact,
  source: partnerProjects.source,
  notes: partnerProjects.notes,
  regionId: partnerProjects.regionId,
  region: regions.name,
  isPublished: partnerProjects.isPublished,
  createdAt: partnerProjects.createdAt,
  updatedAt: partnerProjects.updatedAt,
};
const select = () => db.select(columns).from(partnerProjects).innerJoin(regions, eq(regions.id, partnerProjects.regionId));
// Les projets les plus récents d'abord
const order = [desc(partnerProjects.startYear), asc(partnerProjects.title)];

// Portail public : projets publiés
export const listPublished = () => select().where(eq(partnerProjects.isPublished, true)).orderBy(...order);

// Espace EDBM et administration : tous les projets
export const listAll = () => select().orderBy(...order);

export async function save(id: string | undefined, input: PartnerProjectInput, userId: string) {
  // Champs facultatifs absents → NULL (le formulaire envoie l'objet complet) ;
  // isPublished absent → inchangé en modification, publié à la création
  const values = {
    title: input.title,
    fullName: input.fullName || null,
    donor: input.donor,
    implementer: input.implementer || null,
    sectors: input.sectors || null,
    duration: input.duration || null,
    startYear: input.startYear ?? null,
    endYear: input.endYear ?? null,
    funding: input.funding || null,
    amountUsd: input.amountUsd ?? null,
    beneficiaries: input.beneficiaries || null,
    contact: input.contact || null,
    source: input.source || null,
    notes: input.notes || null,
    regionId: input.regionId,
    ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
  };
  const [row] = id
    ? await db.update(partnerProjects).set(values).where(eq(partnerProjects.id, id)).returning()
    : await db.insert(partnerProjects).values({ ...values, createdBy: userId }).returning();
  if (!row) throw new HttpError(404, "Projet introuvable");
  await logAudit({
    userId,
    action: id ? "partner_project.update" : "partner_project.create",
    entity: "partner_project",
    entityId: row.id,
    details: { title: row.title, donor: row.donor },
  });
  return row;
}

export async function setPublished(id: string, isPublished: boolean, userId: string) {
  const [row] = await db.update(partnerProjects).set({ isPublished }).where(eq(partnerProjects.id, id)).returning();
  if (!row) throw new HttpError(404, "Projet introuvable");
  await logAudit({
    userId,
    action: isPublished ? "partner_project.publish" : "partner_project.unpublish",
    entity: "partner_project",
    entityId: id,
    details: { title: row.title },
  });
}

export async function remove(id: string, userId: string) {
  const [row] = await db.delete(partnerProjects).where(eq(partnerProjects.id, id)).returning();
  if (!row) throw new HttpError(404, "Projet introuvable");
  await logAudit({ userId, action: "partner_project.delete", entity: "partner_project", entityId: id, details: { title: row.title } });
}
