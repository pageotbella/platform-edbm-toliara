import { ROLE_HOME, type Role } from "@/config/constants";

/** Destination après connexion : `next` s'il est un chemin interne sûr, sinon l'espace du rôle. */
export function postLoginPath(next: string | null, role: string | null | undefined) {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) return next;
  return ROLE_HOME[(role as Role) ?? "investisseur"] ?? "/";
}

// Messages better-auth traduits en français
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Adresse e-mail ou mot de passe incorrect.",
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cette adresse e-mail.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Un compte existe déjà avec cette adresse e-mail.",
  PASSWORD_TOO_SHORT: "Le mot de passe doit contenir au moins 8 caractères.",
  INVALID_EMAIL: "Adresse e-mail invalide.",
  INVALID_PASSWORD: "Mot de passe incorrect.",
  EMAIL_NOT_VERIFIED: "Votre adresse e-mail n'est pas encore confirmée. Nous venons de vous renvoyer le lien de confirmation : vérifiez votre boîte de réception (et les courriers indésirables).",
  INVALID_TOKEN: "Ce lien n'est pas valide ou a déjà été utilisé.",
  TOKEN_EXPIRED: "Ce lien a expiré.",
  USER_NOT_FOUND: "Aucun compte ne correspond à ce lien.",
};

export function authErrorMessage(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return "Une erreur est survenue.";
  return (error.code && MESSAGES[error.code]) || error.message || "Une erreur est survenue.";
}
