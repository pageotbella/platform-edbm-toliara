import { and, eq, inArray, ne } from "drizzle-orm";
import { STAFF_ROLES } from "@/config/constants";
import { db } from "@/db";
import { notifications, user } from "@/db/schema";
import { notificationMail } from "./email-templates";
import { sendMailLater } from "./mailer";

type Notification = { title: string; content?: string; link?: string };
type Options = {
  /** Envoie aussi la notification par e-mail aux comptes actifs */
  email?: boolean;
  /** Texte cité dans l'e-mail seulement (ex. réponse de l'EDBM) */
  quote?: string;
};

// Notification interne, doublée d'un e-mail si demandé
export async function notify(userIds: string | string[], n: Notification, options: Options = {}) {
  const ids = [...new Set([userIds].flat())];
  if (!ids.length) return;
  await db.insert(notifications).values(ids.map((userId) => ({ userId, ...n })));
  if (options.email) {
    const recipients = await db
      .select({ email: user.email })
      .from(user)
      .where(and(inArray(user.id, ids), eq(user.status, "actif")));
    sendMailLater(
      recipients.map((r) => r.email),
      notificationMail({ ...n, quote: options.quote }),
    );
  }
}

// Notifie tous les agents et administrateurs actifs, sauf l'auteur de l'action (in-app + e-mail)
export async function notifyStaff(n: Notification, exceptUserId?: string) {
  const staff = await db
    .select({ id: user.id })
    .from(user)
    .where(
      and(
        inArray(user.role, STAFF_ROLES),
        eq(user.status, "actif"),
        exceptUserId ? ne(user.id, exceptUserId) : undefined,
      ),
    );
  await notify(
    staff.map((s) => s.id),
    n,
    { email: true },
  );
}
