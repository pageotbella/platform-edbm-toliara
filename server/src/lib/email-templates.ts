import { env } from "@/config/env";
import type { Mail } from "./mailer";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Lien absolu vers le portail à partir d'un chemin interne (« /investisseur/… »). */
export const appUrl = (path: string) => new URL(path, env.CLIENT_URL).toString();

type Content = {
  subject: string;
  greeting?: string;
  paragraphs: string[];
  /** Lignes « libellé : valeur » (récapitulatif) */
  details?: [string, string][];
  /** Texte libre cité tel quel (message de l'investisseur, réponse de l'EDBM…) */
  quote?: string;
  cta?: { label: string; url: string };
  footnote?: string;
  replyTo?: string;
};

// Mise en page commune : tableaux et styles en ligne pour les clients de messagerie
function render(c: Content): Mail {
  const p = (t: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#1f2937">${esc(t)}</p>`;
  const details = c.details?.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;border:1px solid #e5e7eb;border-radius:8px;border-collapse:separate">${c.details
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 14px;font-size:13px;color:#6b7280;width:38%;vertical-align:top">${esc(k)}</td><td style="padding:8px 14px;font-size:14px;color:#111827;font-weight:600">${esc(v)}</td></tr>`,
        )
        .join("")}</table>`
    : "";
  const quote = c.quote
    ? `<div style="margin:0 0 20px;padding:12px 16px;border-left:3px solid #7a3f7a;background:#f9f3f8;font-size:14px;line-height:22px;color:#1f2937;white-space:pre-line">${esc(c.quote)}</div>`
    : "";
  const cta = c.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:6px;background:#7a3f7a"><a href="${esc(c.cta.url)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">${esc(c.cta.label)}</a></td></tr></table>
       <p style="margin:0 0 16px;font-size:12px;line-height:18px;color:#6b7280">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${esc(c.cta.url)}" style="color:#7a3f7a;word-break:break-all">${esc(c.cta.url)}</a></p>`
    : "";
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Plus Jakarta Sans',Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb">
<tr><td style="background:#5d3b6e;background-image:linear-gradient(120deg,#5d3b6e,#974d92);padding:20px 28px"><span style="font-size:18px;font-weight:700;color:#ffffff">EDBM Toliara</span><span style="font-size:13px;color:#ecc8e6"> · Opportunités d'investissement</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 20px;font-size:20px;line-height:28px;color:#4a2858">${esc(c.subject)}</h1>
${c.greeting ? p(c.greeting) : ""}${c.paragraphs.map(p).join("")}${details}${quote}${cta}
<p style="margin:0;font-size:15px;line-height:24px;color:#1f2937">L'équipe EDBM Toliara</p>
</td></tr>
<tr><td style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;line-height:18px;color:#6b7280">${esc(c.footnote ?? "Cet e-mail vous est envoyé automatiquement par la plateforme de l'EDBM Toliara. Merci de ne pas y répondre directement.")}</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    c.greeting,
    ...c.paragraphs,
    c.details?.map(([k, v]) => `${k} : ${v}`).join("\n"),
    c.quote,
    c.cta && `${c.cta.label} : ${c.cta.url}`,
    "L'équipe EDBM Toliara",
  ]
    .filter(Boolean)
    .join("\n\n");
  return { subject: c.subject, html, text, replyTo: c.replyTo };
}

const hello = (name?: string | null) => (name ? `Bonjour ${name},` : "Bonjour,");

// ── Comptes ───────────────────────────────────────────────────

export const verifyEmailMail = (name: string, url: string) =>
  render({
    subject: "Confirmez votre adresse e-mail",
    greeting: hello(name),
    paragraphs: [
      "Merci d'avoir créé votre compte investisseur sur la plateforme de l'EDBM Toliara.",
      "Pour l'activer, confirmez votre adresse e-mail. Ce lien est valable 24 heures.",
    ],
    cta: { label: "Confirmer mon adresse", url },
    footnote: "Vous n'êtes pas à l'origine de cette inscription ? Ignorez cet e-mail : aucun compte ne sera activé.",
  });

export const resetPasswordMail = (name: string, url: string) =>
  render({
    subject: "Réinitialisation de votre mot de passe",
    greeting: hello(name),
    paragraphs: [
      "Une demande de réinitialisation du mot de passe de votre compte a été effectuée.",
      "Choisissez un nouveau mot de passe avec le lien ci-dessous. Il est valable 1 heure et ne peut servir qu'une fois.",
    ],
    cta: { label: "Choisir un nouveau mot de passe", url },
    footnote: "Vous n'avez rien demandé ? Ignorez cet e-mail : votre mot de passe actuel reste inchangé.",
  });

export const accountCreatedMail = (name: string, roleLabel: string, url: string) =>
  render({
    subject: "Votre compte EDBM Toliara a été créé",
    greeting: hello(name),
    paragraphs: [
      `Un administrateur de l'EDBM Toliara vous a créé un compte « ${roleLabel} » sur la plateforme des opportunités d'investissement.`,
      "Pour y accéder, définissez votre mot de passe avec le lien ci-dessous. Il est valable 72 heures ; passé ce délai, utilisez « Mot de passe oublié » sur la page de connexion.",
    ],
    cta: { label: "Définir mon mot de passe", url },
  });

// ── Demandes d'intérêt et notifications ───────────────────────

export const interestConfirmationMail = (r: {
  firstName: string; opportunity: string; reference: string; company: string; amount?: number | null; currency: string; message?: string | null; link: string;
}) =>
  render({
    subject: "Votre demande d'intérêt a bien été reçue",
    greeting: hello(r.firstName),
    paragraphs: [
      `Votre demande d'intérêt pour l'opportunité « ${r.opportunity} » a bien été transmise à l'EDBM Toliara.`,
      "Un agent va l'étudier et vous recontacter. Vous pouvez suivre son avancement à tout moment depuis votre espace investisseur.",
    ],
    details: [
      ["Opportunité", `${r.opportunity} (${r.reference})`],
      ["Société", r.company],
      ...(r.amount ? [["Montant envisagé", `${new Intl.NumberFormat("fr-FR").format(r.amount)} ${r.currency}`] as [string, string]] : []),
    ],
    quote: r.message ?? undefined,
    cta: { label: "Suivre ma demande", url: appUrl(r.link) },
  });

/** E-mail jumeau d'une notification interne. */
export const notificationMail = (n: { title: string; content?: string; link?: string; quote?: string }) =>
  render({
    subject: n.title,
    greeting: "Bonjour,",
    paragraphs: n.content ? [n.content] : [],
    quote: n.quote,
    cta: n.link ? { label: "Voir sur la plateforme", url: appUrl(n.link) } : undefined,
    footnote: "Vous recevez cet e-mail car vous avez un compte sur la plateforme de l'EDBM Toliara. Retrouvez toutes vos notifications dans votre espace.",
  });

// ── Formulaire de contact ─────────────────────────────────────

export const contactMessageMail = (m: { name: string; email: string; phone?: string; company?: string; subject: string; message: string }) =>
  render({
    subject: `Contact : ${m.subject}`,
    paragraphs: ["Nouveau message reçu depuis le formulaire de contact du portail. Répondez directement à cet e-mail pour écrire à l'expéditeur."],
    details: [
      ["Nom", m.name],
      ["E-mail", m.email],
      ...(m.phone ? [["Téléphone", m.phone] as [string, string]] : []),
      ...(m.company ? [["Organisation", m.company] as [string, string]] : []),
    ],
    quote: m.message,
    footnote: "Message envoyé depuis le formulaire de contact du portail EDBM Toliara.",
    replyTo: m.email,
  });
