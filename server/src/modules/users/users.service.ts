import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { account, agentPermissions, investorProfiles, session, user } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { accountCreatedMail, appUrl } from "@/lib/email-templates";
import { sendMail } from "@/lib/mailer";
import { isUniqueViolation } from "@/utils/db-errors";
import { HttpError } from "@/utils/http-error";
import type { PermissionsInput, UserCreateInput, UserListQuery, UserUpdateInput } from "./users.schemas";

const newId = () => randomUUID().replaceAll("-", "");

/** Enregistre les permissions d'un agent ; les retire si l'utilisateur n'est pas agent. */
export async function savePermissions(userId: string, role: string, perms?: PermissionsInput) {
  if (role !== "agent") {
    await db.delete(agentPermissions).where(eq(agentPermissions.userId, userId));
    return;
  }
  const values = perms ?? { canPublish: false, canManageSectors: false, canManageRegions: false };
  await db.insert(agentPermissions).values({ userId, ...values }).onConflictDoUpdate({ target: agentPermissions.userId, set: values });
}

/** L'administrateur ne peut pas se retirer ses propres droits ni se désactiver. */
function forbidSelf(actorId: string, targetId: string, what: string) {
  if (actorId === targetId) throw new HttpError(400, `Vous ne pouvez pas ${what} votre propre compte.`);
}

export async function list(input: UserListQuery) {
  const like = input.q ? `%${input.q}%` : undefined;
  const search = like ? or(ilike(user.name, like), ilike(user.email, like), ilike(investorProfiles.company, like)) : undefined;
  const where = and(search, input.role ? eq(user.role, input.role) : undefined, input.status ? eq(user.status, input.status) : undefined);
  const [items, [{ total }], byRole] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        company: investorProfiles.company,
        country: investorProfiles.country,
        canPublish: agentPermissions.canPublish,
        canManageSectors: agentPermissions.canManageSectors,
        canManageRegions: agentPermissions.canManageRegions,
        lastActive: sql<Date | null>`(select max(s.updated_at) from session s where s.user_id = ${user.id})`,
        requests: sql<number>`(select count(*) from interest_requests r where r.user_id = ${user.id})::int`,
        opportunities: sql<number>`(select count(*) from opportunities o where o.created_by = ${user.id})::int`,
      })
      .from(user)
      .leftJoin(investorProfiles, eq(investorProfiles.userId, user.id))
      .leftJoin(agentPermissions, eq(agentPermissions.userId, user.id))
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize),
    db.select({ total: count() }).from(user).leftJoin(investorProfiles, eq(investorProfiles.userId, user.id)).where(where),
    db
      .select({ role: user.role, status: user.status, n: count() })
      .from(user)
      .leftJoin(investorProfiles, eq(investorProfiles.userId, user.id))
      .where(search)
      .groupBy(user.role, user.status),
  ]);
  const sum = (pred: (r: (typeof byRole)[number]) => boolean) => byRole.filter(pred).reduce((s, r) => s + r.n, 0);
  return {
    items,
    total,
    pageCount: Math.max(1, Math.ceil(total / input.pageSize)),
    counts: {
      all: sum(() => true),
      investisseur: sum((r) => r.role === "investisseur"),
      porteur: sum((r) => r.role === "porteur"),
      agent: sum((r) => r.role === "agent"),
      admin: sum((r) => r.role === "admin"),
      desactive: sum((r) => r.status === "desactive"),
    },
  };
}

const ROLE_LABELS = { investisseur: "Investisseur", porteur: "Porteur de projet", agent: "Agent EDBM", admin: "Administrateur" } as const;
const WELCOME_LINK_TTL = 72 * 3600_000;

/**
 * Lien « Définir mon mot de passe » : jeton de réinitialisation Better Auth (même format que
 * POST /api/auth/request-password-reset), avec une durée de validité plus longue.
 */
async function sendWelcomeLink(u: { id: string; name: string; email: string; role: keyof typeof ROLE_LABELS }) {
  const token = randomBytes(24).toString("base64url");
  const ctx = await auth.$context;
  await ctx.internalAdapter.createVerificationValue({
    identifier: `reset-password:${token}`,
    value: u.id,
    expiresAt: new Date(Date.now() + WELCOME_LINK_TTL),
  });
  return sendMail(u.email, accountCreatedMail(u.name, ROLE_LABELS[u.role], appUrl(`/reinitialiser-mot-de-passe?token=${token}&bienvenue=1`)));
}

// Création d'un compte : insertion directe (role/status ne passent pas par l'inscription Better Auth).
// Le mot de passe initial est aléatoire et jamais communiqué : l'utilisateur choisit le sien
// via le lien reçu par e-mail (section 22)
export async function create(input: UserCreateInput, actorId: string) {
  const id = newId();
  try {
    await db.insert(user).values({
      id,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone || null,
      role: input.role,
      emailVerified: true,
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw new HttpError(409, "Un compte existe déjà avec cette adresse e-mail.");
    throw e;
  }
  await db.insert(account).values({
    id: newId(),
    accountId: id,
    providerId: "credential",
    userId: id,
    password: await hashPassword(randomBytes(32).toString("base64url")),
  });
  await db.insert(investorProfiles).values({ userId: id, phone: input.phone || null }).onConflictDoNothing();
  await savePermissions(id, input.role, input.permissions);
  await logAudit({ userId: actorId, action: "user.create", entity: "user", entityId: id, details: { email: input.email, role: input.role } });
  const emailSent = await sendWelcomeLink({ id, name: input.name, email: input.email.toLowerCase(), role: input.role });
  return { id, emailSent };
}

// Renvoie le lien « Définir mon mot de passe » (e-mail perdu ou lien expiré)
export async function resendWelcome(id: string, actorId: string) {
  const [u] = await db.select().from(user).where(eq(user.id, id)).limit(1);
  if (!u) throw new HttpError(404, "Utilisateur introuvable");
  const sent = await sendWelcomeLink({ id: u.id, name: u.name, email: u.email, role: u.role as keyof typeof ROLE_LABELS });
  if (!sent) throw new HttpError(502, "L'e-mail n'a pas pu être envoyé. Réessayez plus tard.");
  await logAudit({ userId: actorId, action: "user.invite", entity: "user", entityId: id, details: { email: u.email } });
}

export async function update(id: string, input: UserUpdateInput, actorId: string) {
  const [before] = await db.select().from(user).where(eq(user.id, id)).limit(1);
  if (!before) throw new HttpError(404, "Utilisateur introuvable");
  const roleChanged = before.role !== input.role;
  if (roleChanged) forbidSelf(actorId, id, "changer le rôle de");
  await db.update(user).set({ name: input.name, phone: input.phone || null, role: input.role, updatedAt: new Date() }).where(eq(user.id, id));
  await savePermissions(id, input.role, input.permissions);
  // Un changement de rôle prend effet à la prochaine connexion : on ferme les sessions ouvertes
  if (roleChanged) await db.delete(session).where(eq(session.userId, id));
  await logAudit({
    userId: actorId,
    action: roleChanged ? "user.role" : "user.update",
    entity: "user",
    entityId: id,
    details: { role: input.role, previousRole: before.role, permissions: input.role === "agent" ? input.permissions : undefined },
  });
}

// Désactivation / réactivation (section 22) : la désactivation ferme immédiatement les sessions
export async function setStatus(id: string, status: "actif" | "desactive", actorId: string) {
  forbidSelf(actorId, id, "désactiver");
  const [row] = await db.update(user).set({ status, updatedAt: new Date() }).where(eq(user.id, id)).returning();
  if (!row) throw new HttpError(404, "Utilisateur introuvable");
  if (status === "desactive") await db.delete(session).where(eq(session.userId, id));
  await logAudit({
    userId: actorId,
    action: status === "desactive" ? "user.deactivate" : "user.activate",
    entity: "user",
    entityId: id,
    details: { email: row.email },
  });
}

export async function resetPassword(id: string, password: string, actorId: string) {
  const [acc] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, id), eq(account.providerId, "credential")))
    .limit(1);
  if (!acc) throw new HttpError(404, "Compte introuvable");
  await db.update(account).set({ password: await hashPassword(password), updatedAt: new Date() }).where(eq(account.id, acc.id));
  await db.delete(session).where(eq(session.userId, id));
  await logAudit({ userId: actorId, action: "user.password_reset", entity: "user", entityId: id });
}
