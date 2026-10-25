import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { OPEN_REQUEST_STATUSES } from "@/config/constants";
import { db } from "@/db";
import {
  auditLogs, favorites, interestRequests, notifications, opportunities, opportunityViews, regions, sectors, user,
} from "@/db/schema";
import { auditColumns } from "@/modules/audit-logs/audit-logs.service";
import { forInvestor, selectRequests } from "@/modules/interest-requests/interest-requests.service";
import { selectCards } from "@/modules/opportunities/opportunity-card";

// Série mensuelle (mois sans valeur inclus) : nombre de lignes de `table` par mois sur `months` mois
async function monthly(table: "interest_requests" | "user", months: number) {
  const rows = await db.execute<{ month: string; n: number }>(sql`
    select to_char(m, 'YYYY-MM') as month,
           (select count(*) from ${sql.identifier(table)} t where date_trunc('month', t.created_at) = m)::int as n
    from generate_series(date_trunc('month', now()) - make_interval(months => ${months - 1}), date_trunc('month', now()), interval '1 month') m
    order by m`);
  return [...rows].map((r) => ({ month: r.month, n: Number(r.n) }));
}

// Statistiques des agents et administrateurs (sections 20 et 27)
export async function overview(months: number) {
  const [byStatus, requestByStatus, bySector, byRegion, topViewed, sectorViews, monthlyRequests, [totals]] = await Promise.all([
    db.select({ status: opportunities.status, n: count() }).from(opportunities).groupBy(opportunities.status),
    db.select({ status: interestRequests.status, n: count() }).from(interestRequests).groupBy(interestRequests.status),
    db
      .select({ name: sectors.name, n: sql<number>`count(${opportunities.id})::int` })
      .from(sectors)
      .leftJoin(opportunities, eq(opportunities.sectorId, sectors.id))
      .groupBy(sectors.id)
      .orderBy(desc(sql`count(${opportunities.id})`)),
    db
      .select({ name: regions.name, n: sql<number>`count(${opportunities.id})::int` })
      .from(regions)
      .leftJoin(opportunities, eq(opportunities.regionId, regions.id))
      .groupBy(regions.id)
      .having(sql`count(${opportunities.id}) > 0`)
      .orderBy(desc(sql`count(${opportunities.id})`)),
    db
      .select({
        id: opportunities.id,
        title: opportunities.title,
        slug: opportunities.slug,
        sector: sectors.name,
        views: sql<number>`count(${opportunityViews.id})::int`,
        requests: sql<number>`(select count(*) from interest_requests r where r.opportunity_id = ${opportunities.id})::int`,
      })
      .from(opportunities)
      .innerJoin(sectors, eq(sectors.id, opportunities.sectorId))
      .leftJoin(opportunityViews, eq(opportunityViews.opportunityId, opportunities.id))
      .groupBy(opportunities.id, sectors.name)
      .orderBy(desc(sql`count(${opportunityViews.id})`))
      .limit(5),
    db
      .select({ name: sectors.name, n: sql<number>`count(${opportunityViews.id})::int` })
      .from(sectors)
      .leftJoin(opportunities, eq(opportunities.sectorId, sectors.id))
      .leftJoin(opportunityViews, eq(opportunityViews.opportunityId, opportunities.id))
      .groupBy(sectors.id)
      .orderBy(desc(sql`count(${opportunityViews.id})`)),
    monthly("interest_requests", months),
    db
      .select({
        views: sql<number>`(select count(*) from opportunity_views)::int`,
        views30: sql<number>`(select count(*) from opportunity_views where created_at > now() - interval '30 days')::int`,
        favorites: sql<number>`(select count(*) from ${favorites})::int`,
        investment: sql<number>`(select coalesce(sum(estimated_investment), 0) from opportunities where status = 'publiee')::float`,
      })
      .from(sql`(select 1) as x`),
  ]);
  const status = Object.fromEntries(byStatus.map((s) => [s.status, s.n])) as Record<string, number>;
  const req = Object.fromEntries(requestByStatus.map((s) => [s.status, s.n])) as Record<string, number>;
  return {
    opportunities: {
      total: byStatus.reduce((s, x) => s + x.n, 0),
      publiee: status.publiee ?? 0,
      brouillon: status.brouillon ?? 0,
      en_verification: status.en_verification ?? 0,
      validee: status.validee ?? 0,
      suspendue: status.suspendue ?? 0,
      archivee: status.archivee ?? 0,
    },
    requests: { total: requestByStatus.reduce((s, x) => s + x.n, 0), nouvelle: req.nouvelle ?? 0, byStatus: req },
    bySector,
    byRegion,
    topViewed,
    sectorViews,
    monthly: monthlyRequests,
    totals,
  };
}

// Tableau de bord administrateur (section 21)
export async function admin() {
  const open = inArray(interestRequests.status, [...OPEN_REQUEST_STATUSES]);
  const [roles, [opp], [sec], [reg], [req], recent, signups, requestsByRegion] = await Promise.all([
    db.select({ role: user.role, status: user.status, n: count() }).from(user).groupBy(user.role, user.status),
    db
      .select({ n: count(), published: sql<number>`count(*) filter (where ${opportunities.status} = 'publiee')::int` })
      .from(opportunities),
    db.select({ n: count(), active: sql<number>`count(*) filter (where ${sectors.isActive})::int` }).from(sectors),
    db
      .select({
        n: count(),
        districts: sql<number>`(select count(*) from districts)::int`,
        communes: sql<number>`(select count(*) from communes)::int`,
      })
      .from(regions),
    db.select({ n: count(), open: sql<number>`count(*) filter (where ${open})::int` }).from(interestRequests),
    db.select(auditColumns).from(auditLogs).leftJoin(user, eq(user.id, auditLogs.userId)).orderBy(desc(auditLogs.createdAt)).limit(8),
    monthly("user", 12),
    db
      .select({ name: regions.name, n: sql<number>`count(${interestRequests.id})::int` })
      .from(interestRequests)
      .innerJoin(opportunities, eq(opportunities.id, interestRequests.opportunityId))
      .innerJoin(regions, eq(regions.id, opportunities.regionId))
      .groupBy(regions.name)
      .orderBy(desc(sql`count(${interestRequests.id})`)),
  ]);
  const sum = (pred: (r: (typeof roles)[number]) => boolean) => roles.filter(pred).reduce((s, r) => s + r.n, 0);
  return {
    users: {
      total: sum(() => true),
      active: sum((r) => r.status === "actif"),
      inactive: sum((r) => r.status !== "actif"),
      investisseur: sum((r) => r.role === "investisseur"),
      agent: sum((r) => r.role === "agent"),
      admin: sum((r) => r.role === "admin"),
    },
    opportunities: { total: opp.n, published: opp.published },
    sectors: { total: sec.n, active: sec.active },
    regions: { total: reg.n, districts: reg.districts, communes: reg.communes },
    requests: { total: req.n, open: req.open },
    recent,
    signups,
    requestsByRegion,
  };
}

// Tableau de bord investisseur (section 19)
export async function investor(userId: string) {
  const published = eq(opportunities.status, "publiee");
  const [[opp], [fav], [req], [open], latest, favs, requests, notifs] = await Promise.all([
    db.select({ n: count() }).from(opportunities).where(published),
    db.select({ n: count() }).from(favorites).where(eq(favorites.userId, userId)),
    db.select({ n: count() }).from(interestRequests).where(eq(interestRequests.userId, userId)),
    db
      .select({ n: count() })
      .from(interestRequests)
      .where(and(eq(interestRequests.userId, userId), inArray(interestRequests.status, [...OPEN_REQUEST_STATUSES]))),
    selectCards(db).where(published).orderBy(desc(opportunities.publishedAt)).limit(4),
    selectCards(db)
      .innerJoin(favorites, eq(favorites.opportunityId, opportunities.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt))
      .limit(3),
    selectRequests().where(eq(interestRequests.userId, userId)).orderBy(desc(interestRequests.createdAt)).limit(5),
    db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(5),
  ]);
  return {
    stats: { opportunities: opp.n, favorites: fav.n, requests: req.n, openRequests: open.n },
    latest,
    favorites: favs,
    requests: requests.map(forInvestor),
    notifications: notifs,
  };
}
