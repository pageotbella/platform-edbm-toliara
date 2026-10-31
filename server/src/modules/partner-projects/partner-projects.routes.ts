import { Router } from "express";
import { z } from "zod";
import { requireRole } from "@/middlewares/auth";
import { validate } from "@/middlewares/validate";
import * as controller from "./partner-projects.controller";
import { partnerProjectSchema } from "./partner-projects.schemas";

const byId = validate(z.object({ id: z.uuid() }), "params");
const staff = requireRole("agent", "admin");

// Projets financés par les PTF : lecture publique des projets publiés, gestion par le personnel EDBM
export const partnerProjectsRouter = Router();

partnerProjectsRouter.get("/", controller.list);
partnerProjectsRouter.get("/manage", staff, controller.manage);
partnerProjectsRouter.post("/", staff, validate(partnerProjectSchema), controller.create);
partnerProjectsRouter.put("/:id", staff, byId, validate(partnerProjectSchema), controller.update);
partnerProjectsRouter.patch("/:id/published", staff, byId, validate(z.object({ isPublished: z.boolean() })), controller.setPublished);
partnerProjectsRouter.delete("/:id", staff, byId, controller.remove);
