import { contactMessageMail } from "@/lib/email-templates";
import { sendMail } from "@/lib/mailer";
import { contact } from "@/modules/settings/settings.service";
import { HttpError } from "@/utils/http-error";
import type { ContactMessageInput } from "./contact.schemas";

// Transmet le message à l'adresse de l'antenne (paramètres de contact), avec réponse directe à l'expéditeur
export async function send({ website, ...input }: ContactMessageInput) {
  if (website) return; // robot : ignoré sans le signaler
  const { email } = await contact();
  const sent = await sendMail(email, contactMessageMail(input));
  if (!sent) throw new HttpError(502, "Votre message n'a pas pu être envoyé. Réessayez plus tard ou écrivez-nous directement.");
}
