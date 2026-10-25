import { Router } from "express";
import { z } from "zod";
import { requireRole } from "@/middlewares/auth";
import { validate } from "@/middlewares/validate";
import * as controller from "./settings.controller";

// Coordonnées de l'antenne (même règles que client/src/features/users/schemas.ts)
const contactSchema = z.object({
  name: z.string().trim().min(2).max(160),
  address: z.string().trim().min(2).max(300),
  email: z.email("Adresse e-mail invalide"),
  phone: z.string().trim().min(6).max(40),
  hours: z.string().trim().min(2).max(120),
});

export const settingsRouter = Router();

// Lecture publique (en-tête et pied de page du portail) ; modification par l'administrateur
settingsRouter.get("/contact", controller.contact);
settingsRouter.put("/contact", requireRole("admin"), validate(contactSchema), controller.updateContact);
