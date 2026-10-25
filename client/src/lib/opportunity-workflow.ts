import type { OpportunityStatus } from "@/config/constants";

// Cycle de vie d'une opportunité (section 11) : transitions autorisées depuis chaque statut
export const TRANSITIONS: Record<OpportunityStatus, OpportunityStatus[]> = {
  brouillon: ["en_verification", "validee", "publiee", "archivee"],
  en_verification: ["brouillon", "validee", "publiee"],
  validee: ["publiee", "brouillon"],
  publiee: ["suspendue", "archivee"],
  suspendue: ["publiee", "brouillon", "archivee"],
  archivee: ["brouillon"],
};

/** Statuts qui exigent la permission de publication (« Publier selon permission », section 7). */
export const NEEDS_PUBLISH_PERMISSION: OpportunityStatus[] = ["validee", "publiee"];

// Libellés des actions de l'agent (étape 5 du formulaire, section 18)
export const ACTION_LABELS: Record<OpportunityStatus, string> = {
  brouillon: "Repasser en brouillon",
  en_verification: "Soumettre à validation",
  validee: "Valider",
  publiee: "Publier",
  suspendue: "Suspendre",
  archivee: "Archiver",
};

export function allowedTransitions(from: OpportunityStatus, canPublish: boolean) {
  return TRANSITIONS[from].filter((to) => canPublish || !NEEDS_PUBLISH_PERMISSION.includes(to));
}
