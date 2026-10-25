import { Router } from "express";
import { z } from "zod";
import { requirePermission, requireRole } from "@/middlewares/auth";
import { validate } from "@/middlewares/validate";
import * as controller from "./regions.controller";

const nameSchema = z.object({ name: z.string().trim().min(2, "Nom trop court").max(120) });
const regionSchema = nameSchema.extend({ code: z.string().trim().min(2).max(40).optional() });
const byId = validate(z.object({ id: z.uuid() }), "params");
const canManage = requirePermission("canManageRegions");

// Géographie (section 24) : lecture publique, gestion selon permission
export const regionsRouter = Router();

regionsRouter.get("/", controller.tree);
regionsRouter.get("/summary", controller.summary);
regionsRouter.get("/manage", requireRole("agent", "admin"), controller.manage);
regionsRouter.get("/:id", byId, controller.detail);
regionsRouter.post("/", canManage, validate(regionSchema), controller.createRegion);
regionsRouter.put("/:id", canManage, byId, validate(regionSchema), controller.updateRegion);
regionsRouter.delete("/:id", canManage, byId, controller.remove("region"));
regionsRouter.post("/:id/districts", canManage, byId, validate(nameSchema), controller.createDistrict);

export const districtsRouter = Router();

districtsRouter.put("/:id", canManage, byId, validate(nameSchema), controller.updateDistrict);
districtsRouter.delete("/:id", canManage, byId, controller.remove("district"));
districtsRouter.post("/:id/communes", canManage, byId, validate(nameSchema), controller.createCommune);

export const communesRouter = Router();

communesRouter.put("/:id", canManage, byId, validate(nameSchema), controller.updateCommune);
communesRouter.delete("/:id", canManage, byId, controller.remove("commune"));
