import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { DOCUMENT_TYPES, PORTEUR_FILE_STATUSES, STAFF_ROLES, type Role } from "@/config/constants";
import { db } from "@/db";
import { opportunities, opportunityDocuments, opportunityMedia, user } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import type { Actor } from "@/lib/permissions";
import { checkFile, deleteUpload, saveUpload, uploadPath } from "@/middlewares/upload";
import { HttpError } from "@/utils/http-error";
import type { DocumentListQuery, UploadBody } from "./documents.schemas";

const isStaff = (actor: Actor) => STAFF_ROLES.includes(actor.role as Role);

/**
 * Le personnel gère les fichiers de toutes les opportunités ; un porteur de projet seulement ceux
 * de ses propres projets, tant qu'ils sont en brouillon ou en vérification.
 */
async function assertCanEditFiles(opportunityId: string, actor: Actor) {
  if (isStaff(actor)) return;
  const [opp] = await db
    .select({ createdBy: opportunities.createdBy, status: opportunities.status })
    .from(opportunities)
    .where(eq(opportunities.id, opportunityId))
    .limit(1);
  if (!opp || opp.createdBy !== actor.id) throw new HttpError(404, "Opportunité introuvable");
  if (!PORTEUR_FILE_STATUSES.includes(opp.status)) {
    throw new HttpError(400, "Ce projet n'est plus modifiable : contactez l'EDBM pour changer ses fichiers.");
  }
}

// ── Téléversement (section 33) ────────────────────────────────

export async function upload(file: Express.Multer.File | undefined, body: UploadBody, actor: Actor) {
  const userId = actor.id;
  const { ext, mime } = checkFile(file, body.kind);
  const [opp] = await db
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(eq(opportunities.id, body.opportunityId))
    .limit(1);
  if (!opp) throw new HttpError(404, "Opportunité introuvable");
  await assertCanEditFiles(opp.id, actor);

  const fileKey = await saveUpload(file!, ext);
  const original = file!.originalname;
  const title = body.name?.slice(0, 200) || original.slice(0, original.length - ext.length).slice(0, 200);

  if (body.kind === "image") {
    // La première image devient la couverture
    const [{ n }] = await db.select({ n: count() }).from(opportunityMedia).where(eq(opportunityMedia.opportunityId, opp.id));
    const [row] = await db
      .insert(opportunityMedia)
      .values({ opportunityId: opp.id, fileKey, title, isCover: n === 0, sortOrder: n })
      .returning();
    await logAudit({
      userId, action: "media.upload", entity: "opportunity_media", entityId: row.id,
      details: { opportunityId: opp.id, name: title, size: file!.size },
    });
    return row;
  }

  const type = (DOCUMENT_TYPES as readonly string[]).includes(body.type ?? "") ? body.type! : "Document complémentaire";
  const [row] = await db
    .insert(opportunityDocuments)
    // Les pièces d'un porteur restent réservées aux membres connectés : l'EDBM décide de leur diffusion
    .values({ opportunityId: opp.id, fileKey, name: title, type, mimeType: mime, isPublic: isStaff(actor) && body.isPublic, uploadedBy: userId })
    .returning();
  await logAudit({
    userId, action: "document.upload", entity: "opportunity_document", entityId: row.id,
    details: { opportunityId: opp.id, name: title, size: file!.size },
  });
  return row;
}

// Un fichier n'est servi que s'il est référencé en base, avec les mêmes règles que la fiche :
// opportunité non publiée → personnel uniquement ; document privé → utilisateurs connectés
export async function resolveFile(key: string, viewer: Actor | undefined) {
  const staff = !!viewer && isStaff(viewer);

  const [doc] = await db
    .select({ isPublic: opportunityDocuments.isPublic, status: opportunities.status, createdBy: opportunities.createdBy, name: opportunityDocuments.name })
    .from(opportunityDocuments)
    .innerJoin(opportunities, eq(opportunities.id, opportunityDocuments.opportunityId))
    .where(eq(opportunityDocuments.fileKey, key));
  const [media] = doc
    ? []
    : await db
        .select({ status: opportunities.status, createdBy: opportunities.createdBy })
        .from(opportunityMedia)
        .innerJoin(opportunities, eq(opportunities.id, opportunityMedia.opportunityId))
        .where(eq(opportunityMedia.fileKey, key));

  const found = doc ?? media;
  if (!found) throw new HttpError(404, "Fichier introuvable");
  // Le porteur de projet voit toujours les fichiers de ses propres projets
  const owner = !!viewer && found.createdBy === viewer.id;
  if (found.status !== "publiee" && !staff && !owner) throw new HttpError(404, "Fichier introuvable");
  if (doc && !doc.isPublic && !viewer) throw new HttpError(401, "Connectez-vous pour consulter ce document");

  return { path: uploadPath(key), downloadName: doc?.name };
}

// ── Gestion documentaire (section 25) ─────────────────────────

export async function list(input: DocumentListQuery) {
  const like = input.q ? `%${input.q}%` : undefined;
  const where = and(
    input.opportunityId ? eq(opportunityDocuments.opportunityId, input.opportunityId) : undefined,
    input.visibility ? eq(opportunityDocuments.isPublic, input.visibility === "public") : undefined,
    like ? or(ilike(opportunityDocuments.name, like), ilike(opportunities.title, like), ilike(opportunityDocuments.type, like)) : undefined,
  );
  const [items, [{ total }], [stats]] = await Promise.all([
    db
      .select({
        id: opportunityDocuments.id,
        name: opportunityDocuments.name,
        type: opportunityDocuments.type,
        fileKey: opportunityDocuments.fileKey,
        mimeType: opportunityDocuments.mimeType,
        isPublic: opportunityDocuments.isPublic,
        createdAt: opportunityDocuments.createdAt,
        uploadedBy: user.name,
        opportunityId: opportunities.id,
        opportunity: opportunities.title,
        reference: opportunities.reference,
        opportunityStatus: opportunities.status,
      })
      .from(opportunityDocuments)
      .innerJoin(opportunities, eq(opportunities.id, opportunityDocuments.opportunityId))
      .leftJoin(user, eq(user.id, opportunityDocuments.uploadedBy))
      .where(where)
      .orderBy(desc(opportunityDocuments.createdAt))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize),
    db
      .select({ total: count() })
      .from(opportunityDocuments)
      .innerJoin(opportunities, eq(opportunities.id, opportunityDocuments.opportunityId))
      .where(where),
    db
      .select({
        documents: sql<number>`count(*)::int`,
        privateDocs: sql<number>`count(*) filter (where not ${opportunityDocuments.isPublic})::int`,
        media: sql<number>`(select count(*) from opportunity_media)::int`,
      })
      .from(opportunityDocuments),
  ]);
  return { items, total, stats, pageCount: Math.max(1, Math.ceil(total / input.pageSize)) };
}

// Derniers documents ajoutés (tableau de bord agent)
export const recent = () =>
  db
    .select({
      id: opportunityDocuments.id,
      name: opportunityDocuments.name,
      type: opportunityDocuments.type,
      fileKey: opportunityDocuments.fileKey,
      createdAt: opportunityDocuments.createdAt,
      opportunity: opportunities.title,
    })
    .from(opportunityDocuments)
    .innerJoin(opportunities, eq(opportunities.id, opportunityDocuments.opportunityId))
    .orderBy(desc(opportunityDocuments.createdAt))
    .limit(4);

export async function updateDocument(
  id: string,
  data: { name?: string; type?: (typeof DOCUMENT_TYPES)[number]; isPublic?: boolean },
  userId: string,
) {
  const [row] = await db.update(opportunityDocuments).set(data).where(eq(opportunityDocuments.id, id)).returning();
  if (!row) throw new HttpError(404, "Document introuvable");
  await logAudit({ userId, action: "document.update", entity: "opportunity_document", entityId: id, details: data });
}

export async function removeDocument(id: string, actor: Actor) {
  const userId = actor.id;
  const [doc] = await db
    .select({ opportunityId: opportunityDocuments.opportunityId })
    .from(opportunityDocuments)
    .where(eq(opportunityDocuments.id, id));
  if (!doc) throw new HttpError(404, "Document introuvable");
  await assertCanEditFiles(doc.opportunityId, actor);
  const [row] = await db.delete(opportunityDocuments).where(eq(opportunityDocuments.id, id)).returning();
  if (!row) throw new HttpError(404, "Document introuvable");
  await deleteUpload(row.fileKey);
  await logAudit({
    userId, action: "document.delete", entity: "opportunity_document", entityId: row.id,
    details: { name: row.name, opportunityId: row.opportunityId },
  });
}

// ── Galerie d'images (section 13 « Supports ») ────────────────

async function mediaOpportunity(id: string) {
  const [m] = await db.select({ opportunityId: opportunityMedia.opportunityId }).from(opportunityMedia).where(eq(opportunityMedia.id, id));
  if (!m) throw new HttpError(404, "Image introuvable");
  return m.opportunityId;
}

export async function updateMedia(id: string, title: string, actor: Actor) {
  await assertCanEditFiles(await mediaOpportunity(id), actor);
  const [row] = await db.update(opportunityMedia).set({ title: title || null }).where(eq(opportunityMedia.id, id)).returning();
  if (!row) throw new HttpError(404, "Image introuvable");
}

export async function setCover(id: string, actor: Actor) {
  const userId = actor.id;
  const [m] = await db.select().from(opportunityMedia).where(eq(opportunityMedia.id, id)).limit(1);
  if (!m) throw new HttpError(404, "Image introuvable");
  await assertCanEditFiles(m.opportunityId, actor);
  await db.transaction(async (tx) => {
    await tx.update(opportunityMedia).set({ isCover: false }).where(eq(opportunityMedia.opportunityId, m.opportunityId));
    await tx.update(opportunityMedia).set({ isCover: true }).where(eq(opportunityMedia.id, m.id));
  });
  await logAudit({ userId, action: "media.cover", entity: "opportunity_media", entityId: m.id, details: { opportunityId: m.opportunityId } });
}

export async function removeMedia(id: string, actor: Actor) {
  const userId = actor.id;
  await assertCanEditFiles(await mediaOpportunity(id), actor);
  const [row] = await db.delete(opportunityMedia).where(eq(opportunityMedia.id, id)).returning();
  if (!row) throw new HttpError(404, "Image introuvable");
  await deleteUpload(row.fileKey);
  // L'image de couverture supprimée est remplacée par la suivante
  if (row.isCover) {
    const [next] = await db
      .select({ id: opportunityMedia.id })
      .from(opportunityMedia)
      .where(eq(opportunityMedia.opportunityId, row.opportunityId))
      .orderBy(asc(opportunityMedia.sortOrder))
      .limit(1);
    if (next) await db.update(opportunityMedia).set({ isCover: true }).where(eq(opportunityMedia.id, next.id));
  }
  await logAudit({ userId, action: "media.delete", entity: "opportunity_media", entityId: row.id, details: { opportunityId: row.opportunityId } });
}
