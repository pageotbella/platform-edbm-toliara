import { Router } from "express";
import { requireRole } from "@/middlewares/auth";
import { formLimiter } from "@/middlewares/rate-limit";
import { validate } from "@/middlewares/validate";
import * as controller from "./porteur.controller";
import { idParamsSchema, projectInputSchema } from "./porteur.schemas";

// Espace porteur de projet : dépôt et suivi de ses propres projets
// (photos et documents : routes /upload, /media et /documents du module documents)
export const porteurRouter = Router();

porteurRouter.use(requireRole("porteur"));

const byId = validate(idParamsSchema, "params");

porteurRouter.get("/projets", controller.list);
porteurRouter.get("/projets/:id", byId, controller.byId);
porteurRouter.post("/projets", formLimiter, validate(projectInputSchema), controller.create);
porteurRouter.put("/projets/:id", byId, validate(projectInputSchema), controller.update);
porteurRouter.post("/projets/:id/soumettre", byId, controller.submit);
porteurRouter.delete("/projets/:id", byId, controller.remove);
