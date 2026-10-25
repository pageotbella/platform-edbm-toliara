// Copie client des énumérations serveur (server/src/db/schema/domain.ts) :
// mettre les deux à jour quand un statut change.

export const ROLES = ["investisseur", "agent", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  investisseur: "Investisseur",
  agent: "Agent EDBM",
  admin: "Administrateur",
};

// Espace d'arrivée après connexion
export const ROLE_HOME: Record<Role, string> = {
  investisseur: "/investisseur",
  agent: "/edbm",
  admin: "/admin",
};

export const OPPORTUNITY_STATUS_LABELS = {
  brouillon: "Brouillon",
  en_verification: "En vérification",
  validee: "Validée",
  publiee: "Publiée",
  suspendue: "Suspendue",
  archivee: "Archivée",
} as const;
export type OpportunityStatus = keyof typeof OPPORTUNITY_STATUS_LABELS;
export const OPPORTUNITY_STATUSES = Object.keys(OPPORTUNITY_STATUS_LABELS) as OpportunityStatus[];

export const REQUEST_STATUS_LABELS = {
  nouvelle: "Nouvelle",
  en_cours: "En cours de traitement",
  contact_etabli: "Contact établi",
  en_attente: "En attente",
  traitee: "Traitée",
  cloturee: "Clôturée",
} as const;
export type RequestStatus = keyof typeof REQUEST_STATUS_LABELS;
export const REQUEST_STATUSES = Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[];

// Permissions « selon permission » d'un agent (section 7)
export const PERM_LABELS = {
  canPublish: "Publier les opportunités",
  canManageSectors: "Gérer les secteurs",
  canManageRegions: "Gérer les régions",
} as const;

export const PROJECT_TYPES = [
  "Création",
  "Extension",
  "Partenariat public-privé",
  "Concession",
  "Joint-venture",
  "Reprise d'actifs",
] as const;

export const INVESTMENT_MODELS = [
  "Investissement direct étranger",
  "Investissement privé national",
  "Partenariat public-privé (PPP)",
  "Joint-venture",
  "Concession",
  "Bail emphytéotique",
] as const;

// Tranches de ticket d'investissement (USD), cf. « Investment Ticket Chips » du DESIGN.md
export const INVESTMENT_TRANCHES = [
  { id: "lt5", label: "< 5 M USD", min: undefined, max: 5_000_000 },
  { id: "5to15", label: "5 – 15 M USD", min: 5_000_000, max: 15_000_000 },
  { id: "gt15", label: "> 15 M USD", min: 15_000_000, max: undefined },
] as const;

export const DOCUMENT_TYPES = [
  "Fiche projet",
  "Étude",
  "Brochure",
  "Document technique",
  "Présentation",
  "Document complémentaire",
] as const;

// Valeurs par défaut des paramètres système (table `settings`)
export const DEFAULT_CONTACT = {
  name: "EDBM — Antenne régionale de Toliara",
  address: "Rue du Port, face Douanes, Toliara 601, Madagascar",
  email: "antenne.toliara@edbm.mg",
  phone: "+261 20 94 410 88",
  hours: "Lun – Ven : 08h00 – 16h30",
};
