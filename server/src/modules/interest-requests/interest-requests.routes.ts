import { Router } from "express";
import { requireRole } from "@/middlewares/auth";
import { formLimiter } from "@/middlewares/rate-limit";
import { validate } from "@/middlewares/validate";
import * as controller from "./interest-requests.controller";
import {
  idParamsSchema, interestRequestSchema, mineQuerySchema, processSchema, staffListQuerySchema,
} from "./interest-requests.schemas";

// Demandes d'intérêt (sections 14 et 15)
export const interestRequestsRouter = Router();

const investor = requireRole("investisseur");
const staff = requireRole("agent", "admin");
const byId = validate(idParamsSchema, "params");

// Investisseur
interestRequestsRouter.post("/", formLimiter, investor, validate(interestRequestSchema), controller.create);
interestRequestsRouter.get("/mine", investor, validate(mineQuerySchema, "query"), controller.mine);
interestRequestsRouter.get("/mine/:id", investor, byId, controller.mineById);

// Espace EDBM
interestRequestsRouter.get("/", staff, validate(staffListQuerySchema, "query"), controller.staffList);
interestRequestsRouter.get("/:id", staff, byId, controller.staffById);
interestRequestsRouter.post("/:id/take", staff, byId, controller.take);
interestRequestsRouter.patch("/:id", staff, byId, validate(processSchema), controller.process);
