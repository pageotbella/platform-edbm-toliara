import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db, type DB } from "@/db";
import {
  auditLogs, districts, interestRequests, investorProfiles, opportunities, regions, type RequestStatus, sectors, user,
} from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { interestConfirmationMail } from "@/lib/email-templates";
import { sendMailLater } from "@/lib/mailer";
import { notify, notifyStaff } from "@/lib/notify";
import { HttpError } from "@/utils/http-error";
import type { InterestRequestInput, ProcessInput, StaffRequestQuery } from "./interest-requests.schemas";

const STATUS_LABELS: Record<RequestStatus, string> = {
  nouvelle: "Nouvelle",
  en_cours: "En cours de traitement",
  contact_etabli: "Contact établi",
  en_attente: "En attente",
  traitee: "Traitée",
  cloturee: "Clôturée",
};

/** Demandes avec les informations de l'opportunité concernée. */
export const selectRequests = (database: DB = db) =>
  database
    .select({
      id: interestRequests.id,
      status: interestRequests.status,
      createdAt: interestRequests.createdAt,
      updatedAt: interestRequests.updatedAt,
      amount: interestRequests.amount,
      message: interestRequests.message,
      edbmResponse: interestRequests.edbmResponse,
      firstName: interestRequests.firstName,
      lastName: interestRequests.lastName,
      email: interestRequests.email,
      company: interestRequests.company,
      country: interestRequests.country,
      phone: interestRequests.phone,
      userId: interestRequests.userId,
      handledBy: interestRequests.handledBy,
      opportunityId: opportunities.id,
      opportunity: opportunities.title,
      slug: opportunities.slug,
      reference: opportunities.reference,
      opportunityStatus: opportunities.status,
      estimatedInvestment: opportunities.estimatedInvestment,
      currency: opportunities.currency,
      sector: sectors.name,
      sectorSlug: sectors.slug,
      region: regions.name,
      district: districts.name,
    })
    .from(interestRequests)
    .innerJoin(opportunities, eq(opportunities.id, interestRequests.opportunityId))
    .innerJoin(sectors, eq(sectors.id, opportunities.sectorId))
    .innerJoin(regions, eq(regions.id, opportunities.regionId))
    .leftJoin(districts, eq(districts.id, opportunities.districtId))
    .$dynamic();

/** Retire les champs internes avant d'envoyer une demande à l'investisseur. */
export function forInvestor<T extends { handledBy: unknown }>(row: T): Omit<T, "handledBy"> {
  const { handledBy: _internal, ...rest } = row;
  return rest;
}

/** Historique des changements de statut, reconstitué depuis le journal d'audit. */
async function statusHistory(requestId: string) {
  const rows = await db
    .select({ details: auditLogs.details, createdAt: auditLogs.createdAt, by: user.name })
    .from(auditLogs)
    .leftJoin(user, eq(user.id, auditLogs.userId))
    .where(and(eq(auditLogs.entity, "interest_request"), eq(auditLogs.entityId, requestId), eq(auditLogs.action, "interest.status")))
    .orderBy(asc(auditLogs.createdAt));
  return rows.map((r) => ({ status: (r.details as { status?: string } | null)?.status ?? "", at: r.createdAt, by: r.by }));
}

// ── Investisseur ──────────────────────────────────────────────

export async function create(input: InterestRequestInput, userId: string) {
  const [opp] = await db
    .select({ id: opportunities.id, title: opportunities.title, reference: opportunities.reference, currency: opportunities.currency })
    .from(opportunities)
    .where(and(eq(opportunities.id, input.opportunityId), eq(opportunities.status, "publiee")))
    .limit(1);
  if (!opp) throw new HttpError(404, "Opportunité introuvable");

  const [req] = await db.insert(interestRequests).values({ ...input, userId }).returning();

  // Confirmation à l'investisseur (notification + e-mail à l'adresse saisie) et alerte à l'équipe EDBM (section 26)
  const link = `/investisseur/demandes/${req.id}`;
  await notify(userId, {
    title: "Demande d'intérêt enregistrée",
    content: `Votre demande pour « ${opp.title} » a bien été transmise à l'EDBM Toliara.`,
    link,
  });
  sendMailLater(
    input.email,
    interestConfirmationMail({
      firstName: input.firstName, opportunity: opp.title, reference: opp.reference ?? "—", company: input.company,
      amount: input.amount, currency: opp.currency, message: input.message, link,
    }),
  );
  await notifyStaff({
    title: "Nouvelle demande d'intérêt",
    content: `${input.firstName} ${input.lastName} (${input.company}) est intéressé(e) par « ${opp.title} »`,
    link: `/edbm/demandes/${req.id}`,
  });
  await logAudit({ userId, action: "interest.create", entity: "interest_request", entityId: req.id });
  return forInvestor(req);
}

// « Mes demandes » : historique et suivi (sections 6.2 et 15)
export async function mine(userId: string, status?: RequestStatus) {
  const rows = await selectRequests()
    .where(and(eq(interestRequests.userId, userId), status ? eq(interestRequests.status, status) : undefined))
    .orderBy(desc(interestRequests.createdAt));
  return rows.map(forInvestor);
}

export async function mineById(id: string, userId: string) {
  const [req] = await selectRequests()
    .where(and(eq(interestRequests.id, id), eq(interestRequests.userId, userId)))
    .limit(1);
  if (!req) throw new HttpError(404, "Demande introuvable");
  return { ...forInvestor(req), history: await statusHistory(req.id) };
}

// ── Espace EDBM : traitement des demandes (sections 6.3 et 15) ─

export async function staffList(input: StaffRequestQuery, userId: string) {
  const like = input.q ? `%${input.q}%` : undefined;
  const where = and(
    input.status ? eq(interestRequests.status, input.status) : undefined,
    input.opportunityId ? eq(interestRequests.opportunityId, input.opportunityId) : undefined,
    input.mine ? eq(interestRequests.handledBy, userId) : undefined,
    like
      ? or(
          ilike(interestRequests.company, like),
          ilike(interestRequests.lastName, like),
          ilike(interestRequests.firstName, like),
          ilike(interestRequests.email, like),
          ilike(opportunities.title, like),
          ilike(opportunities.reference, like),
        )
      : undefined,
  );
  const [items, counts] = await Promise.all([
    selectRequests().where(where).orderBy(desc(interestRequests.createdAt)).limit(300),
    db.select({ status: interestRequests.status, n: sql<number>`count(*)::int` }).from(interestRequests).groupBy(interestRequests.status),
  ]);
  // Nom de l'agent en charge (requête séparée : selectRequests a une sélection fixe)
  const handlerIds = [...new Set(items.map((i) => i.handledBy).filter(Boolean))] as string[];
  const handlers = handlerIds.length
    ? await db.select({ id: user.id, name: user.name }).from(user).where(inArray(user.id, handlerIds))
    : [];
  const names = new Map(handlers.map((h) => [h.id, h.name]));
  return {
    items: items.map((i) => ({
      ...i,
      handledByName: i.handledBy ? (names.get(i.handledBy) ?? null) : null,
      // Délai cible de prise en charge : 48 h
      late: i.status === "nouvelle" && Date.now() - i.createdAt.getTime() > 48 * 3600_000,
    })),
    counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) as Partial<Record<RequestStatus, number>>,
  };
}

export async function staffById(id: string) {
  const [req] = await selectRequests().where(eq(interestRequests.id, id)).limit(1);
  if (!req) throw new HttpError(404, "Demande introuvable");
  const [[extra], [investor], history] = await Promise.all([
    db
      .select({ internalNote: interestRequests.internalNote, handledByName: user.name })
      .from(interestRequests)
      .leftJoin(user, eq(user.id, interestRequests.handledBy))
      .where(eq(interestRequests.id, id))
      .limit(1),
    db
      .select({ name: user.name, email: user.email, since: user.createdAt, description: investorProfiles.description })
      .from(user)
      .leftJoin(investorProfiles, eq(investorProfiles.userId, user.id))
      .where(eq(user.id, req.userId))
      .limit(1),
    statusHistory(id),
  ]);
  return { ...req, ...extra, investor: investor ?? null, history };
}

// « Prendre en charge » : l'agent devient responsable et la demande passe en cours
export async function take(id: string, userId: string) {
  const [before] = await db.select().from(interestRequests).where(eq(interestRequests.id, id)).limit(1);
  if (!before) throw new HttpError(404, "Demande introuvable");
  const status = before.status === "nouvelle" ? "en_cours" : before.status;
  await db.update(interestRequests).set({ handledBy: userId, status }).where(eq(interestRequests.id, id));
  if (status !== before.status) {
    await notify(before.userId, {
      title: "Votre demande est en cours de traitement",
      content: "Un agent EDBM a pris en charge votre demande.",
      link: `/investisseur/demandes/${before.id}`,
    }, { email: true });
    await logAudit({ userId, action: "interest.status", entity: "interest_request", entityId: before.id, details: { status } });
  }
  await logAudit({ userId, action: "interest.take", entity: "interest_request", entityId: before.id });
}

export async function process(id: string, input: ProcessInput, userId: string) {
  const [before] = await db.select().from(interestRequests).where(eq(interestRequests.id, id)).limit(1);
  if (!before) throw new HttpError(404, "Demande introuvable");
  const statusChanged = !!input.status && input.status !== before.status;
  const responseChanged = input.edbmResponse !== undefined && input.edbmResponse !== (before.edbmResponse ?? "");
  await db
    .update(interestRequests)
    .set({
      status: input.status ?? before.status,
      edbmResponse: input.edbmResponse === undefined ? before.edbmResponse : input.edbmResponse || null,
      internalNote: input.internalNote === undefined ? before.internalNote : input.internalNote || null,
      handledBy: before.handledBy ?? userId,
    })
    .where(eq(interestRequests.id, id));

  if (statusChanged || responseChanged) {
    await notify(before.userId, {
      title: responseChanged ? "Réponse de l'EDBM à votre demande" : "Mise à jour de votre demande",
      content: statusChanged ? `Nouveau statut : ${STATUS_LABELS[input.status!]}` : "Un agent EDBM a répondu à votre demande.",
      link: `/investisseur/demandes/${before.id}`,
    }, { email: true, quote: responseChanged ? input.edbmResponse || undefined : undefined });
  }
  if (statusChanged) {
    await logAudit({ userId, action: "interest.status", entity: "interest_request", entityId: before.id, details: { status: input.status } });
  }
  if (responseChanged) await logAudit({ userId, action: "interest.respond", entity: "interest_request", entityId: before.id });
}
