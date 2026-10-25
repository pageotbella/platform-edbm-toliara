import { fromNodeHeaders } from "better-auth/node";
import type { Request, RequestHandler } from "express";
import type { Role } from "@/config/constants";
import { auth } from "@/lib/auth";
import { getPermissions, type Permission } from "@/lib/permissions";
import { HttpError } from "@/utils/http-error";

async function loadUser(req: Request) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  return session && session.user.status === "actif" ? session.user : undefined;
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const user = await loadUser(req);
  if (!user) throw new HttpError(401, "Non authentifié");
  req.user = user;
  next();
};

// Routes publiques dont la réponse dépend de la connexion (documents privés, favoris…)
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  req.user = await loadUser(req);
  next();
};

export const requireRole = (...roles: Role[]): RequestHandler[] => [
  requireAuth,
  (req, _res, next) => {
    if (!roles.includes(req.user!.role as Role)) throw new HttpError(403, "Accès refusé");
    next();
  },
];

// Agent avec la permission demandée, ou administrateur
export const requirePermission = (permission: Permission): RequestHandler[] => [
  ...requireRole("agent", "admin"),
  async (req, _res, next) => {
    const permissions = await getPermissions(req.user!);
    if (!permissions[permission]) throw new HttpError(403, "Permission insuffisante");
    next();
  },
];
