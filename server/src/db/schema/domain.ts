import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

// Les tableaux servent aussi à la validation Zod côté serveur
// (copie côté client : client/src/config/constants.ts)
export const opportunityStatusValues = [
  "brouillon",
  "en_verification",
  "validee",
  "publiee",
  "suspendue",
  "archivee",
] as const;
export type OpportunityStatus = (typeof opportunityStatusValues)[number];

export const requestStatusValues = [
  "nouvelle",
  "en_cours",
  "contact_etabli",
  "en_attente",
  "traitee",
  "cloturee",
] as const;
export type RequestStatus = (typeof requestStatusValues)[number];

export const opportunityStatus = pgEnum("opportunity_status", opportunityStatusValues);
export const requestStatus = pgEnum("request_status", requestStatusValues);

// ── Référentiels ──────────────────────────────────────────────

export const sectors = pgTable("sectors", {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 120 }).notNull().unique(),
  slug: varchar({ length: 120 }).notNull().unique(),
  description: text(),
  isActive: boolean().default(true).notNull(),
});

export const regions = pgTable("regions", {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 120 }).notNull().unique(),
  code: varchar({ length: 40 }).notNull().unique(),
});

export const districts = pgTable("districts", {
  id: uuid().defaultRandom().primaryKey(),
  regionId: uuid()
    .notNull()
    .references(() => regions.id, { onDelete: "cascade" }),
  name: varchar({ length: 120 }).notNull(),
});

export const communes = pgTable("communes", {
  id: uuid().defaultRandom().primaryKey(),
  districtId: uuid()
    .notNull()
    .references(() => districts.id, { onDelete: "cascade" }),
  name: varchar({ length: 120 }).notNull(),
});

// ── Utilisateurs ──────────────────────────────────────────────

export const investorProfiles = pgTable("investor_profiles", {
  id: uuid().defaultRandom().primaryKey(),
  userId: text()
    .notNull()
    .unique("investor_profiles_userId_unique")
    .references(() => user.id, { onDelete: "cascade" }),
  company: varchar({ length: 160 }),
  country: varchar({ length: 80 }),
  phone: varchar({ length: 40 }),
  interestSectorId: uuid().references(() => sectors.id, { onDelete: "set null" }),
  description: text(),
});

// Permissions « selon permission » d'un agent (l'admin a tous les droits)
export const agentPermissions = pgTable("agent_permissions", {
  userId: text()
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  canPublish: boolean().default(false).notNull(),
  canManageSectors: boolean().default(false).notNull(),
  canManageRegions: boolean().default(false).notNull(),
});

// ── Opportunités ──────────────────────────────────────────────

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid().defaultRandom().primaryKey(),
    reference: varchar({ length: 40 }).unique(),
    slug: varchar({ length: 220 }).notNull().unique(),
    title: varchar({ length: 200 }).notNull(),
    description: text().notNull(),
    sectorId: uuid()
      .notNull()
      .references(() => sectors.id),
    subSector: varchar({ length: 120 }),
    projectType: varchar({ length: 120 }),
    regionId: uuid()
      .notNull()
      .references(() => regions.id),
    districtId: uuid().references(() => districts.id, { onDelete: "set null" }),
    communeId: uuid().references(() => communes.id, { onDelete: "set null" }),
    latitude: doublePrecision(),
    longitude: doublePrecision(),
    estimatedInvestment: numeric({ precision: 18, scale: 2, mode: "number" }),
    currency: varchar({ length: 3 }).default("USD").notNull(),
    investmentModel: text(),
    potential: text(),
    targetMarket: text(),
    resources: text(),
    infrastructures: text(),
    zoneAdvantages: text(),
    isFeatured: boolean().default(false).notNull(),
    status: opportunityStatus().default("brouillon").notNull(),
    createdBy: text()
      .notNull()
      .references(() => user.id),
    publishedAt: timestamp(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (t) => [index().on(t.status), index().on(t.sectorId), index().on(t.regionId)],
);

// Projets financés par les partenaires techniques et financiers (PTF), déjà en cours dans la région :
// rubrique d'information, distincte du catalogue d'opportunités (pas de demande d'intérêt)
export const partnerProjects = pgTable(
  "partner_projects",
  {
    id: uuid().defaultRandom().primaryKey(),
    title: varchar({ length: 200 }).notNull(),
    fullName: varchar({ length: 300 }),
    donor: varchar({ length: 200 }).notNull(), // bailleur
    implementer: text(), // organisme de mise en œuvre (MOD)
    sectors: text(),
    duration: text(),
    startYear: integer(),
    endYear: integer(),
    funding: text(), // montant tel que communiqué (devise, répartition…)
    amountUsd: numeric({ precision: 18, scale: 2, mode: "number" }),
    beneficiaries: text(),
    contact: text(), // coordonnées / point focal
    source: text(),
    notes: text(), // informations et documents pertinents
    regionId: uuid()
      .notNull()
      .references(() => regions.id),
    isPublished: boolean().default(true).notNull(),
    createdBy: text().references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (t) => [index().on(t.regionId)],
);

export const opportunityMedia = pgTable("opportunity_media", {
  id: uuid().defaultRandom().primaryKey(),
  opportunityId: uuid()
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  fileKey: text().notNull(),
  title: varchar({ length: 160 }),
  isCover: boolean().default(false).notNull(),
  sortOrder: numeric({ mode: "number" }).default(sql`'0'`).notNull(),
});

// isPublic = false : réservé aux utilisateurs connectés
export const opportunityDocuments = pgTable("opportunity_documents", {
  id: uuid().defaultRandom().primaryKey(),
  opportunityId: uuid()
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  name: varchar({ length: 200 }).notNull(),
  type: varchar({ length: 60 }),
  fileKey: text().notNull(),
  mimeType: varchar({ length: 100 }),
  isPublic: boolean().default(true).notNull(),
  uploadedBy: text()
    .notNull()
    .references(() => user.id),
  createdAt: timestamp().defaultNow().notNull(),
});

export const opportunityViews = pgTable("opportunity_views", {
  id: uuid().defaultRandom().primaryKey(),
  opportunityId: uuid()
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  userId: text().references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp().defaultNow().notNull(),
});

// ── Investisseurs ─────────────────────────────────────────────

export const favorites = pgTable(
  "favorites",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    opportunityId: uuid()
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (t) => [unique("favorites_userId_opportunityId_unique").on(t.userId, t.opportunityId)],
);

// internalNote et handledBy : réservés au personnel (voir forInvestor())
export const interestRequests = pgTable("interest_requests", {
  id: uuid().defaultRandom().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  opportunityId: uuid()
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  firstName: varchar({ length: 80 }),
  lastName: varchar({ length: 80 }),
  email: varchar({ length: 160 }),
  company: varchar({ length: 160 }),
  country: varchar({ length: 80 }),
  phone: varchar({ length: 40 }),
  amount: numeric({ precision: 18, scale: 2, mode: "number" }),
  message: text(),
  status: requestStatus().default("nouvelle").notNull(),
  edbmResponse: text(),
  internalNote: text(),
  handledBy: text().references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull().$onUpdate(() => new Date()),
});

// ── Système ───────────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: uuid().defaultRandom().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: varchar({ length: 160 }).notNull(),
  content: text(),
  link: text(),
  isRead: boolean().default(false).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: text().references(() => user.id, { onDelete: "set null" }),
    action: varchar({ length: 80 }).notNull(),
    entity: varchar({ length: 80 }).notNull(),
    entityId: text(),
    details: jsonb(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  // Historique d'une entité (statuts d'une demande, remarques sur un projet porteur)
  (t) => [index().on(t.entity, t.entityId, t.createdAt)],
);

// Paramètres clé/valeur (clé `contact` : coordonnées affichées sur le portail)
export const settings = pgTable("settings", {
  key: varchar({ length: 80 }).primaryKey(),
  value: jsonb().notNull(),
  updatedAt: timestamp().defaultNow().notNull().$onUpdate(() => new Date()),
});
