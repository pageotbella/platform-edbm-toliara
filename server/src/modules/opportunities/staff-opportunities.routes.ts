import { Router } from "express";
import { requireRole } from "@/middlewares/auth";
import { validate } from "@/middlewares/validate";
import { changeStatusSchema, idParamsSchema, opportunityInputSchema } from "./opportunities.schemas";
import * as controller from "./staff-opportunities.controller";
import { staffListQuerySchema } from "./staff-opportunities.schemas";

// Gestion des opportunités par l'EDBM (sections 11 et 18) : agents et administrateurs
export const staffOpportunitiesRouter = Router();

staffOpportunitiesRouter.use(requireRole("agent", "admin"));

const byId = validate(idParamsSchema, "params");

staffOpportunitiesRouter.get("/", validate(staffListQuerySchema, "query"), controller.list);
staffOpportunitiesRouter.get("/pending", controller.pending);
staffOpportunitiesRouter.get("/options", controller.options);
staffOpportunitiesRouter.get("/:id", byId, controller.byId);
staffOpportunitiesRouter.post("/", validate(opportunityInputSchema), controller.create);
staffOpportunitiesRouter.put("/:id", byId, validate(opportunityInputSchema), controller.update);
staffOpportunitiesRouter.patch("/:id/status", byId, validate(changeStatusSchema), controller.changeStatus);
staffOpportunitiesRouter.delete("/:id", byId, controller.remove);
