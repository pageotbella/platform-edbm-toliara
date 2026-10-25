import { Router } from "express";
import { z } from "zod";
import { requirePermission, requireRole } from "@/middlewares/auth";
import { validate } from "@/middlewares/validate";
import * as controller from "./sectors.controller";

const sectorSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(120),
  description: z.string().trim().max(1000).optional(),
});
const byId = validate(z.object({ id: z.uuid() }), "params");
const canManage = requirePermission("canManageSectors");

// Secteurs (section 23) : lecture publique des secteurs actifs, gestion selon permission
export const sectorsRouter = Router();

sectorsRouter.get("/", controller.list);
sectorsRouter.get("/summary", controller.summary);
sectorsRouter.get("/manage", requireRole("agent", "admin"), controller.manage);
sectorsRouter.get("/:slug", validate(z.object({ slug: z.string().min(1).max(120) }), "params"), controller.bySlug);
sectorsRouter.post("/", canManage, validate(sectorSchema), controller.create);
sectorsRouter.put("/:id", canManage, byId, validate(sectorSchema), controller.update);
sectorsRouter.patch("/:id/active", canManage, byId, validate(z.object({ isActive: z.boolean() })), controller.setActive);
