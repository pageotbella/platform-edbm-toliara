import { Router } from "express";
import { z } from "zod";
import { requireRole } from "@/middlewares/auth";
import { validate } from "@/middlewares/validate";
import * as controller from "./stats.controller";

// Tableaux de bord et statistiques (sections 19 à 21 et 27)
export const statsRouter = Router();

statsRouter.get(
  "/overview",
  requireRole("agent", "admin"),
  validate(z.object({ months: z.coerce.number().int().min(3).max(24).default(12) }), "query"),
  controller.overview,
);
statsRouter.get("/admin", requireRole("admin"), controller.admin);
statsRouter.get("/investor", requireRole("investisseur"), controller.investor);
