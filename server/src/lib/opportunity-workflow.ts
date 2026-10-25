import type { OpportunityStatus } from "@/db/schema";

// Cycle de vie d'une opportunité (section 11) : transitions autorisées depuis chaque statut.
// Copie client : client/src/lib/opportunity-workflow.ts (affichage des boutons uniquement).
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

export const canTransition = (from: OpportunityStatus, to: OpportunityStatus) => TRANSITIONS[from].includes(to);

export const needsPublishPermission = (to: OpportunityStatus) => NEEDS_PUBLISH_PERMISSION.includes(to);

export const allowedTransitions = (from: OpportunityStatus, canPublish: boolean) =>
  TRANSITIONS[from].filter((to) => canPublish || !needsPublishPermission(to));
