import { Resend } from "resend";
import { env } from "@/config/env";

export type Mail = { subject: string; html: string; text: string; replyTo?: string };

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Envoie un e-mail (un envoi par destinataire : les adresses ne sont jamais visibles entre elles).
 * Renvoie false en cas d'échec ; sans clé Resend, l'e-mail est affiché dans la console
 * (considéré comme envoyé hors production).
 */
export async function sendMail(to: string | string[], mail: Mail): Promise<boolean> {
  const recipients = [...new Set([to].flat())];
  if (!recipients.length) return true;
  if (!resend) {
    console.info(`[e-mail non envoyé : RESEND_API_KEY absente] « ${mail.subject} » → ${recipients.join(", ")}\n${mail.text}`);
    return env.NODE_ENV !== "production";
  }
  const messages = recipients.map((address) => ({ from: env.MAIL_FROM, to: address, ...mail }));
  try {
    // Resend accepte jusqu'à 100 e-mails par envoi groupé
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      const { error } = chunk.length === 1 ? await resend.emails.send(chunk[0]) : await resend.batch.send(chunk);
      if (error) throw new Error(error.message);
    }
    return true;
  } catch (err) {
    console.error(`[e-mail] échec de « ${mail.subject} » → ${recipients.join(", ")} :`, err instanceof Error ? err.message : err);
    // En développement, l'expéditeur de test de Resend n'écrit qu'au titulaire du compte :
    // le contenu (liens de confirmation, de réinitialisation…) est affiché pour pouvoir tester
    if (env.NODE_ENV !== "production") console.info(`[e-mail non remis, contenu pour le développement]\n${mail.text}`);
    return false;
  }
}

/** Envoi en arrière-plan : une panne du service d'e-mail ne fait pas échouer l'action en cours. */
export function sendMailLater(to: string | string[], mail: Mail) {
  void sendMail(to, mail);
}
