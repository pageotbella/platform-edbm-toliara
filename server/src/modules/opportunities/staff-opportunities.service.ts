import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  communes, districts, interestRequests, investorProfiles, type OpportunityStatus, opportunities, opportunityDocuments,
  opportunityMedia, regions, sectors, user,
} from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { notify, notifyStaff } from "@/lib/notify";
import { allowedTransitions, canTransition, needsPublishPermission } from "@/lib/opportunity-workflow";
import { type Actor, getPermissions } from "@/lib/permissions";
import { slugify } from "@/lib/slugify";
import { deleteUpload } from "@/middlewares/upload";
import { HttpError } from "@/utils/http-error";
import { type OpportunityInput, opportunityInputSchema } from "./opportunities.schemas";
import type { StaffListQuery } from "./staff-opportunities.schemas";
import { cardColumns } from "./opportunity-card";

const STATUS_LABELS: Record<OpportunityStatus, string> = {
  brouillon: "Brouillon",
  en_verification: "En vérification",
  validee: "Validée",
  publiee: "Publiée",
  suspendue: "Suspendue",
  archivee: "Archivée",
};

// Référence lisible : OPP-ATS-<année>-<numéro sur 3 chiffres>
export async function nextReference() {
  const year = new Date().getFullYear();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(opportunities)
    .where(sql`${opportunities.reference} like ${`OPP-ATS-${year}-%`}`);
  return `OPP-ATS-${year}-${String(n + 1).padStart(3, "0")}`;
}

// Portefeuille (sections 11 et 18) : tous statuts, avec compteurs de documents, médias, demandes et consultations
export async function list(input: StaffListQuery) {
  const like = input.q ? `%${input.q}%` : undefined;
  const base = and(
    input.sectorId ? eq(opportunities.sectorId, input.sectorId) : undefined,
    input.regionId ? eq(opportunities.regionId, input.regionId) : undefined,
    like ? or(ilike(opportunities.title, like), ilike(opportunities.reference, like), ilike(districts.name, like)) : undefined,
  );
  const where = and(base, input.status ? eq(opportunities.status, input.status) : undefined);

  const [items, counts] = await Promise.all([
    db
      .select({
        ...cardColumns,
        createdAt: opportunities.createdAt,
        updatedAt: opportunities.updatedAt,
        createdBy: user.name,
        createdByRole: user.role,
        commune: communes.name,
        documents: sql<number>`(select count(*) from opportunity_documents d where d.opportunity_id = ${opportunities.id})::int`,
        media: sql<number>`(select count(*) from opportunity_media m where m.opportunity_id = ${opportunities.id})::int`,
        requests: sql<number>`(select count(*) from interest_requests r where r.opportunity_id = ${opportunities.id})::int`,
        views: sql<number>`(select count(*) from opportunity_views v where v.opportunity_id = ${opportunities.id})::int`,
      })
      .from(opportunities)
      .innerJoin(sectors, eq(sectors.id, opportunities.sectorId))
      .innerJoin(regions, eq(regions.id, opportunities.regionId))
      .leftJoin(districts, eq(districts.id, opportunities.districtId))
      .leftJoin(communes, eq(communes.id, opportunities.communeId))
      .leftJoin(user, eq(user.id, opportunities.createdBy))
      .where(where)
      .orderBy(desc(opportunities.updatedAt))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize),
    db
      .select({ status: opportunities.status, n: sql<number>`count(*)::int` })
      .from(opportunities)
      .leftJoin(districts, eq(districts.id, opportunities.districtId))
      .where(base)
      .groupBy(opportunities.status),
  ]);
  const statusCounts = Object.fromEntries(counts.map((c) => [c.status, c.n])) as Partial<Record<OpportunityStatus, number>>;
  const all = counts.reduce((s, c) => s + c.n, 0);
  const total = input.status ? (statusCounts[input.status] ?? 0) : all;
  return { items, total, all, statusCounts, pageCount: Math.max(1, Math.ceil(total / input.pageSize)) };
}

// Fiche de gestion : médias, documents, compteurs et transitions autorisées pour l'agent connecté
export async function byId(id: string, actor: Actor) {
  const [row] = await db
    .select({
      o: opportunities,
      sector: sectors.name,
      sectorSlug: sectors.slug,
      region: regions.name,
      district: districts.name,
      commune: communes.name,
      createdByName: user.name,
      author: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        company: investorProfiles.company,
      },
    })
    .from(opportunities)
    .innerJoin(sectors, eq(sectors.id, opportunities.sectorId))
    .innerJoin(regions, eq(regions.id, opportunities.regionId))
    .leftJoin(districts, eq(districts.id, opportunities.districtId))
    .leftJoin(communes, eq(communes.id, opportunities.communeId))
    .leftJoin(user, eq(user.id, opportunities.createdBy))
    .leftJoin(investorProfiles, eq(investorProfiles.userId, opportunities.createdBy))
    .where(eq(opportunities.id, id))
    .limit(1);
  if (!row) throw new HttpError(404, "Opportunité introuvable");

  const [media, documents, [stats], perms] = await Promise.all([
    db
      .select()
      .from(opportunityMedia)
      .where(eq(opportunityMedia.opportunityId, id))
      .orderBy(desc(opportunityMedia.isCover), asc(opportunityMedia.sortOrder)),
    db
      .select({ d: opportunityDocuments, uploadedByName: user.name })
      .from(opportunityDocuments)
      .leftJoin(user, eq(user.id, opportunityDocuments.uploadedBy))
      .where(eq(opportunityDocuments.opportunityId, id))
      .orderBy(desc(opportunityDocuments.createdAt)),
    db
      .select({
        requests: sql<number>`(select count(*) from interest_requests r where r.opportunity_id = ${id})::int`,
        views: sql<number>`(select count(*) from opportunity_views v where v.opportunity_id = ${id})::int`,
        favorites: sql<number>`(select count(*) from favorites f where f.opportunity_id = ${id})::int`,
      })
      .from(sql`(select 1) as x`),
    getPermissions(actor),
  ]);
  return {
    ...row.o,
    sector: row.sector,
    sectorSlug: row.sectorSlug,
    region: row.region,
    district: row.district,
    commune: row.commune,
    createdByName: row.createdByName,
    // Coordonnées du porteur de projet (projets déposés en ligne) ; null pour un projet saisi par l'EDBM
    submitter: row.author?.role === "porteur" ? row.author : null,
    media,
    documents: documents.map((d) => ({ ...d.d, uploadedByName: d.uploadedByName })),
    stats,
    transitions: allowedTransitions(row.o.status, perms.canPublish),
    canPublish: perms.canPublish,
  };
}

// Création (statut « brouillon » par défaut)
export async function create(input: OpportunityInput, userId: string) {
  const [row] = await db
    .insert(opportunities)
    .values({
      ...input,
      slug: `${slugify(input.title)}-${randomUUID().slice(0, 6)}`,
      reference: await nextReference(),
      createdBy: userId,
    })
    .returning();
  await logAudit({ userId, action: "opportunity.create", entity: "opportunity", entityId: row.id, details: { title: row.title } });
  return row;
}

// Le formulaire envoie l'objet complet : un champ facultatif absent (vidé) devient NULL
export async function update(id: string, input: OpportunityInput, userId: string) {
  const data = Object.fromEntries(
    Object.keys(opportunityInputSchema.shape).map((k) => [k, input[k as keyof OpportunityInput] ?? null]),
  );
  const [row] = await db.update(opportunities).set(data).where(eq(opportunities.id, id)).returning();
  if (!row) throw new HttpError(404, "Opportunité introuvable");
  await logAudit({ userId, action: "opportunity.update", entity: "opportunity", entityId: id, details: { fields: Object.keys(input) } });
  return row;
}

// Étape 5 (section 18) : brouillon, soumission, validation, publication, suspension, archivage
export async function changeStatus(id: string, to: OpportunityStatus, actor: Actor, note?: string) {
  const [before] = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
  if (!before) throw new HttpError(404, "Opportunité introuvable");
  if (!canTransition(before.status, to)) {
    throw new HttpError(400, `Transition impossible : ${STATUS_LABELS[before.status]} → ${STATUS_LABELS[to]}`);
  }
  if (needsPublishPermission(to) && !(await getPermissions(actor)).canPublish) {
    throw new HttpError(403, "Permission de publication requise");
  }

  const [row] = await db
    .update(opportunities)
    .set({ status: to, publishedAt: to === "publiee" ? new Date() : before.publishedAt })
    .where(eq(opportunities.id, id))
    .returning();
  const label = STATUS_LABELS[to];
  const link = `/edbm/opportunites/${row.id}`;

  const [author] = await db.select({ role: user.role }).from(user).where(eq(user.id, before.createdBy)).limit(1);
  if (author?.role === "porteur") {
    // Projet déposé en ligne : le porteur suit chaque étape dans son espace et par e-mail
    const message = porteurMessage(to, row);
    if (message) await notify(before.createdBy, message, { email: true, quote: note || undefined });
  } else if (to === "en_verification") {
    await notifyStaff({ title: "Opportunité soumise à validation", content: `« ${row.title} » attend une validation.`, link }, actor.id);
  } else if (before.createdBy !== actor.id) {
    // Section 26 : informer l'auteur des changements importants
    await notify(before.createdBy, { title: `Opportunité : ${label}`, content: `« ${row.title} » est maintenant « ${label} ».`, link });
  }
  // Section 26 : nouvelle opportunité correspondant aux préférences des investisseurs
  if (to === "publiee" && before.status !== "publiee") {
    const interested = await db
      .select({ id: investorProfiles.userId })
      .from(investorProfiles)
      .innerJoin(user, eq(user.id, investorProfiles.userId))
      .where(and(eq(investorProfiles.interestSectorId, row.sectorId), eq(user.role, "investisseur"), eq(user.status, "actif")));
    await notify(
      interested.map((i) => i.id),
      { title: "Nouvelle opportunité dans votre secteur", content: `« ${row.title} » vient d'être publiée.`, link: `/opportunites/${row.slug}` },
    );
  }
  await logAudit({ userId: actor.id, action: "opportunity.status", entity: "opportunity", entityId: id, details: { from: before.status, status: to, note: note || undefined } });
  return row;
}

// Message adressé au porteur de projet pour chaque décision de l'EDBM
function porteurMessage(to: OpportunityStatus, o: { id: string; title: string; slug: string }) {
  const link = `/porteur/projets/${o.id}`;
  switch (to) {
    case "brouillon":
      return {
        title: "Votre projet nécessite des compléments",
        content: `L'EDBM vous renvoie « ${o.title} » pour compléments. Modifiez-le dans votre espace puis soumettez-le à nouveau.`,
        link,
      };
    case "validee":
      return { title: "Votre projet a été validé", content: `« ${o.title} » a été validé par l'EDBM et sera bientôt publié.`, link };
    case "publiee":
      return { title: "Votre projet est en ligne", content: `« ${o.title} » est publié dans le catalogue des opportunités.`, link: `/opportunites/${o.slug}` };
    case "suspendue":
      return { title: "Votre projet est suspendu", content: `« ${o.title} » n'est temporairement plus visible dans le catalogue.`, link };
    case "archivee":
      return { title: "Votre projet a été archivé", content: `« ${o.title} » a été archivé par l'EDBM.`, link };
    default:
      return null;
  }
}

// Suppression définitive : brouillons et archives uniquement, par l'auteur ou un administrateur
export async function remove(id: string, actor: Actor) {
  const [o] = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
  if (!o) throw new HttpError(404, "Opportunité introuvable");
  if (!["brouillon", "archivee"].includes(o.status)) {
    throw new HttpError(400, "Seuls les brouillons et les opportunités archivées peuvent être supprimés.");
  }
  if (actor.role !== "admin" && o.createdBy !== actor.id) {
    throw new HttpError(403, "Seul l'auteur ou un administrateur peut supprimer cette opportunité.");
  }
  const [docs, media, [{ n }]] = await Promise.all([
    db.select({ key: opportunityDocuments.fileKey }).from(opportunityDocuments).where(eq(opportunityDocuments.opportunityId, o.id)),
    db.select({ key: opportunityMedia.fileKey }).from(opportunityMedia).where(eq(opportunityMedia.opportunityId, o.id)),
    db.select({ n: sql<number>`count(*)::int` }).from(interestRequests).where(eq(interestRequests.opportunityId, o.id)),
  ]);
  if (n > 0) throw new HttpError(400, "Cette opportunité a reçu des demandes d'intérêt : archivez-la plutôt.");
  await db.delete(opportunities).where(eq(opportunities.id, o.id));
  await Promise.all([...docs, ...media].map((f) => deleteUpload(f.key)));
  await logAudit({ userId: actor.id, action: "opportunity.delete", entity: "opportunity", entityId: o.id, details: { title: o.title, reference: o.reference } });
}

// Opportunités en attente d'action (tableau de bord)
export const pending = () =>
  db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      status: opportunities.status,
      reference: opportunities.reference,
      updatedAt: opportunities.updatedAt,
    })
    .from(opportunities)
    .where(inArray(opportunities.status, ["en_verification", "validee"]))
    .orderBy(asc(opportunities.updatedAt))
    .limit(5);

// Liste minimale pour les sélecteurs (filtres des demandes, documents)
export const options = () =>
  db
    .select({ id: opportunities.id, title: opportunities.title, reference: opportunities.reference })
    .from(opportunities)
    .orderBy(asc(opportunities.title));
