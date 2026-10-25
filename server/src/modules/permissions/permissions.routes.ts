import { Router } from "express";
import { z } from "zod";
import { requireRole } from "@/middlewares/auth";
import { validate } from "@/middlewares/validate";
import { permissionsSchema } from "@/modules/users/users.schemas";
import * as controller from "./permissions.controller";

// /api/staff : informations de l'agent connecté pour l'interface (menus, actions autorisées)
export const staffRouter = Router();

staffRouter.get("/me", requireRole("agent", "admin"), controller.me);

// /api/permissions : rôles et permissions des agents (administrateurs)
export const permissionsRouter = Router();

permissionsRouter.use(requireRole("admin"));

permissionsRouter.get("/agents", controller.agents);
permissionsRouter.put(
  "/:userId",
  validate(z.object({ userId: z.string().min(1) }), "params"),
  validate(permissionsSchema),
  controller.set,
);
