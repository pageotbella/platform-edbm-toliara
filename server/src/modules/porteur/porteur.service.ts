import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { PORTEUR_EDIT_STATUSES, PORTEUR_FILE_STATUSES, PORTEUR_REMOVABLE_STATUSES } from "@/config/constants";
import { db } from "@/db";
import {
  auditLogs, communes, districts, type OpportunityStatus, opportunities, opportunityDocuments, opportunityMedia, regions, sectors,
} from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { notify, notifyStaff } from "@/lib/notify";
import { slugify } from "@/lib/slugify";
import { deleteUpload } from "@/middlewares/upload";
import { cardColumns } from "@/modules/opportunities/opportunity-card";
import { nextReference } from "@/modules/opportunities/staff-opportunities.service";
import { HttpError } from "@/utils/http-error";
import { type ProjectInput, projectInputSchema } from "./porteur.schemas";

// Espace porteur de projet : dépôt en ligne d'un projet, qui entre dans le cycle de vie des
// opportunités (brouillon → en vérification → validée → publiée) instruit par l'EDBM.

/** Projet du porteur connecté (404 si le projet appartient à quelqu'un d'autre). */
async function own(id: string, userId: string) {
  const [o] = await db
    .select()
    .from(opportunities)
    .where(and(eq(opportunities.id, id), eq(opportunities.createdBy, userId)))
    .limit(1);
  if (!o) throw new HttpError(404, "Projet introuvable");
  return o;
}

const rights = (o: { status: OpportunityStatus; publishedAt: Date | null }) => ({
  canEdit: PORTEUR_EDIT_STATUSES.includes(o.status),
  canSubmit: o.status === "brouillon",
  canEditFiles: PORTEUR_FILE_STATUSES.includes(o.status),
  canDelete: PORTEUR_REMOVABLE_STATUSES.includes(o.status) && !o.publishedAt,
});

/** Étapes du projet reconstituées depuis le journal (création, soumissions, décisions de l'EDBM). */
async function history(id: string) {
  const rows = await db
    .select({ action: auditLogs.action, details: auditLogs.details, at: auditLogs.createdAt })
    .from(auditLogs)
    .where(and(eq(auditLogs.entity, "opportunity"), eq(auditLogs.entityId, id), inArray(auditLogs.action, ["opportunity.create", "opportunity.status"])))
    .orderBy(asc(auditLogs.createdAt));
  return rows.map((r) => {
    const d = (r.details ?? {}) as { status?: OpportunityStatus; note?: string };
    return { status: r.action === "opportunity.create" ? "brouillon" : (d.status ?? "brouillon"), note: d.note ?? null, at: r.at };
  });
}

export async function list(userId: string) {
  return db
    .select({
      ...cardColumns,
      createdAt: opportunities.createdAt,
      updatedAt: opportunities.updatedAt,
      documents: sql<number>`(select count(*) from opportunity_documents d where d.opportunity_id = ${opportunities.id})::int`,
      media: sql<number>`(select count(*) from opportunity_media m where m.opportunity_id = ${opportunities.id})::int`,
      requests: sql<number>`(select count(*) from interest_requests r where r.opportunity_id = ${opportunities.id})::int`,
    })
    .from(opportunities)
    .innerJoin(sectors, eq(sectors.id, opportunities.sectorId))
    .innerJoin(regions, eq(regions.id, opportunities.regionId))
    .leftJoin(districts, eq(districts.id, opportunities.districtId))
    .where(eq(opportunities.createdBy, userId))
    .orderBy(desc(opportunities.updatedAt));
}

export async function byId(id: string, userId: string) {
  const o = await own(id, userId);
  const [names, media, documents, steps] = await Promise.all([
    db
      .select({ sector: sectors.name, region: regions.name, district: districts.name, commune: communes.name })
      .from(opportunities)
      .innerJoin(sectors, eq(sectors.id, opportunities.sectorId))
      .innerJoin(regions, eq(regions.id, opportunities.regionId))
      .leftJoin(districts, eq(districts.id, opportunities.districtId))
      .leftJoin(communes, eq(communes.id, opportunities.communeId))
      .where(eq(opportunities.id, id)),
    db
      .select({ id: opportunityMedia.id, fileKey: opportunityMedia.fileKey, title: opportunityMedia.title, isCover: opportunityMedia.isCover })
      .from(opportunityMedia)
      .where(eq(opportunityMedia.opportunityId, id))
      .orderBy(desc(opportunityMedia.isCover), asc(opportunityMedia.sortOrder)),
    db
      .select({
        id: opportunityDocuments.id, name: opportunityDocuments.name, type: opportunityDocuments.type,
        fileKey: opportunityDocuments.fileKey, createdAt: opportunityDocuments.createdAt,
      })
      .from(opportunityDocuments)
      .where(eq(opportunityDocuments.opportunityId, id))
      .orderBy(desc(opportunityDocuments.createdAt)),
    history(id),
  ]);
  // Dernière remarque de l'EDBM, affichée tant que le projet attend une correction
  const lastNote = o.status === "brouillon" ? ([...steps].reverse().find((s) => s.note)?.note ?? null) : null;
  const { isFeatured: _f, infrastructures: _i, zoneAdvantages: _z, createdBy: _c, ...fields } = o;
  return { ...fields, ...names[0], media, documents, history: steps, lastNote, ...rights(o) };
}

// Nouveau projet : enregistré en brouillon, le porteur le soumet quand il est prêt
export async function create(input: ProjectInput, userId: string) {
  const [row] = await db
    .insert(opportunities)
    .values({
      ...input,
      slug: `${slugify(input.title)}-${randomUUID().slice(0, 6)}`,
      reference: await nextReference(),
      createdBy: userId,
    })
    .returning({ id: opportunities.id });
  await logAudit({ userId, action: "opportunity.create", entity: "opportunity", entityId: row.id, details: { title: input.title, origin: "porteur" } });
  return row;
}

// Modification (brouillon uniquement) : un champ du formulaire laissé vide devient NULL
export async function update(id: string, input: ProjectInput, userId: string) {
  const o = await own(id, userId);
  if (!PORTEUR_EDIT_STATUSES.includes(o.status)) {
    throw new HttpError(400, "Ce projet est en cours d'instruction par l'EDBM : il n'est plus modifiable pour le moment.");
  }
  const data = Object.fromEntries(
    Object.keys(projectInputSchema.shape).map((k) => [k, input[k as keyof ProjectInput] ?? null]),
  );
  await db.update(opportunities).set(data).where(eq(opportunities.id, id));
  await logAudit({ userId, action: "opportunity.update", entity: "opportunity", entityId: id, details: { fields: Object.keys(input), origin: "porteur" } });
}

// Soumission à l'EDBM : brouillon → en vérification, accusé de réception au porteur et alerte à l'équipe
export async function submit(id: string, userId: string) {
  const o = await own(id, userId);
  if (o.status !== "brouillon") throw new HttpError(400, "Ce projet a déjà été transmis à l'EDBM.");
  await db.update(opportunities).set({ status: "en_verification" }).where(eq(opportunities.id, id));
  await logAudit({ userId, action: "opportunity.status", entity: "opportunity", entityId: id, details: { from: o.status, status: "en_verification", origin: "porteur" } });
  await notify(
    userId,
    {
      title: "Projet transmis à l'EDBM",
      content: `« ${o.title} » a bien été reçu. Un agent de l'antenne de Toliara va l'étudier ; vous serez informé de chaque étape.`,
      link: `/porteur/projets/${id}`,
    },
    { email: true },
  );
  await notifyStaff({
    title: "Nouveau projet déposé en ligne",
    content: `Un porteur de projet a soumis « ${o.title} » : il attend une vérification.`,
    link: `/edbm/opportunites/${id}`,
  });
}

// Retrait d'un projet jamais publié, avec ses fichiers
export async function remove(id: string, userId: string) {
  const o = await own(id, userId);
  if (!rights(o).canDelete) {
    throw new HttpError(400, "Un projet déjà publié ne peut plus être retiré : contactez l'EDBM.");
  }
  const [docs, media] = await Promise.all([
    db.select({ key: opportunityDocuments.fileKey }).from(opportunityDocuments).where(eq(opportunityDocuments.opportunityId, id)),
    db.select({ key: opportunityMedia.fileKey }).from(opportunityMedia).where(eq(opportunityMedia.opportunityId, id)),
  ]);
  await db.delete(opportunities).where(eq(opportunities.id, id));
  await Promise.all([...docs, ...media].map((f) => deleteUpload(f.key)));
  await logAudit({ userId, action: "opportunity.delete", entity: "opportunity", entityId: id, details: { title: o.title, reference: o.reference, origin: "porteur" } });
  // L'équipe est prévenue si le projet était déjà entre ses mains
  if (o.status !== "brouillon") {
    await notifyStaff({ title: "Projet retiré par son porteur", content: `« ${o.title} » (${o.reference ?? "sans référence"}) a été retiré.` });
  }
}
