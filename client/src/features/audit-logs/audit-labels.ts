import { OPPORTUNITY_STATUS_LABELS, REQUEST_STATUS_LABELS, ROLE_LABELS } from "@/config/constants";

// Libellés lisibles des actions enregistrées par logAudit
const ACTIONS: Record<string, string> = {
  "opportunity.create": "Création d'une opportunité",
  "opportunity.update": "Modification d'une opportunité",
  "opportunity.status": "Changement de statut d'une opportunité",
  "opportunity.delete": "Suppression d'une opportunité",
  "document.upload": "Ajout d'un document",
  "document.update": "Modification d'un document",
  "document.delete": "Suppression d'un document",
  "media.upload": "Ajout d'une image",
  "media.cover": "Changement d'image de couverture",
  "media.delete": "Suppression d'une image",
  "interest.create": "Nouvelle demande d'intérêt",
  "interest.status": "Changement de statut d'une demande",
  "interest.respond": "Réponse à une demande",
  "interest.take": "Prise en charge d'une demande",
  "sector.create": "Création d'un secteur",
  "sector.update": "Modification d'un secteur",
  "sector.activate": "Réactivation d'un secteur",
  "sector.deactivate": "Désactivation d'un secteur",
  "region.create": "Création d'une région",
  "region.update": "Modification d'une région",
  "region.delete": "Suppression d'une région",
  "district.create": "Création d'un district",
  "district.update": "Modification d'un district",
  "district.delete": "Suppression d'un district",
  "commune.create": "Création d'une commune",
  "commune.update": "Modification d'une commune",
  "commune.delete": "Suppression d'une commune",
  "user.create": "Création d'un compte",
  "user.update": "Modification d'un compte",
  "user.role": "Changement de rôle",
  "user.activate": "Réactivation d'un compte",
  "user.deactivate": "Désactivation d'un compte",
  "user.password_reset": "Réinitialisation de mot de passe",
  "user.invite": "Envoi du lien d'accès",
  "permission.update": "Modification des permissions",
  "profile.update": "Mise à jour du profil",
  "settings.update": "Modification des paramètres",
};

export const ENTITY_LABELS: Record<string, string> = {
  opportunity: "Opportunité",
  opportunity_document: "Document",
  opportunity_media: "Image",
  interest_request: "Demande d'intérêt",
  sector: "Secteur",
  region: "Région",
  district: "District",
  commune: "Commune",
  user: "Utilisateur",
  settings: "Paramètres",
};

export const actionLabel = (a: string) => ACTIONS[a] ?? a;

/** Résumé court des détails (statut, rôle, nom…) */
export function detailSummary(action: string, details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const d = details as Record<string, unknown>;
  if (action === "opportunity.status" && typeof d.status === "string") {
    const to = OPPORTUNITY_STATUS_LABELS[d.status as keyof typeof OPPORTUNITY_STATUS_LABELS] ?? d.status;
    const from = typeof d.from === "string" ? OPPORTUNITY_STATUS_LABELS[d.from as keyof typeof OPPORTUNITY_STATUS_LABELS] ?? d.from : null;
    return from ? `${from} → ${to}` : `→ ${to}`;
  }
  if (action === "interest.status" && typeof d.status === "string") return `→ ${REQUEST_STATUS_LABELS[d.status as keyof typeof REQUEST_STATUS_LABELS] ?? d.status}`;
  if (typeof d.role === "string") return `Rôle : ${ROLE_LABELS[d.role as keyof typeof ROLE_LABELS] ?? d.role}`;
  for (const k of ["title", "name", "email", "reference"]) if (typeof d[k] === "string") return d[k] as string;
  return null;
}
