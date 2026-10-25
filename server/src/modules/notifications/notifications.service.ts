import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";

type ListInput = { unreadOnly: boolean; page: number; pageSize: number };

// Notifications internes (section 26), pour tous les rôles connectés
export async function list(userId: string, input: ListInput) {
  const where = and(eq(notifications.userId, userId), input.unreadOnly ? eq(notifications.isRead, false) : undefined);
  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize),
    db.select({ total: count() }).from(notifications).where(where),
  ]);
  return { items, total, pageCount: Math.max(1, Math.ceil(total / input.pageSize)) };
}

export async function unreadCount(userId: string) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return n;
}

// Toujours restreint aux notifications de l'utilisateur connecté
export const markRead = (userId: string, id: string) =>
  db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

export const markAllRead = (userId: string) =>
  db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

export const remove = (userId: string, id: string) =>
  db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
