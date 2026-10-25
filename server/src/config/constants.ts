export const ROLES = ["investisseur", "agent", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ["actif", "desactive"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const STAFF_ROLES: Role[] = ["agent", "admin"];

export const UPLOAD_DIR = "uploads";

// Coordonnées par défaut de l'antenne (table `settings`, clé `contact`)
export const DEFAULT_CONTACT = {
  name: "EDBM — Antenne régionale de Toliara",
  address: "Rue du Port, face Douanes, Toliara 601, Madagascar",
  email: "antenne.toliara@edbm.mg",
  phone: "+261 20 94 410 88",
  hours: "Lun – Ven : 08h00 – 16h30",
};

// Types de documents d'une opportunité (section 25)
export const DOCUMENT_TYPES = [
  "Fiche projet",
  "Étude",
  "Brochure",
  "Document technique",
  "Présentation",
  "Document complémentaire",
] as const;

// Demandes encore « ouvertes » côté investisseur
export const OPEN_REQUEST_STATUSES = ["nouvelle", "en_cours", "contact_etabli", "en_attente"] as const;
