import { rateLimit } from "express-rate-limit";

const message = { message: "Trop de requêtes, réessayez dans quelques minutes" };

// Connexion / inscription : limite les tentatives par adresse IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message,
});

// Formulaires publics (demandes d'intérêt, contact)
export const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message,
});
