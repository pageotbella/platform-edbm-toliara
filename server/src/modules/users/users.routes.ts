import { Router } from "express";
import { requireRole } from "@/middlewares/auth";
import { validate } from "@/middlewares/validate";
import * as controller from "./users.controller";
import {
  idParamsSchema, listQuerySchema, passwordSchema, statusSchema, userCreateSchema, userUpdateSchema,
} from "./users.schemas";

// Gestion des utilisateurs (section 22) : administrateurs uniquement
export const usersRouter = Router();

usersRouter.use(requireRole("admin"));

const byId = validate(idParamsSchema, "params");

usersRouter.get("/", validate(listQuerySchema, "query"), controller.list);
usersRouter.post("/", validate(userCreateSchema), controller.create);
usersRouter.put("/:id", byId, validate(userUpdateSchema), controller.update);
usersRouter.patch("/:id/status", byId, validate(statusSchema), controller.setStatus);
usersRouter.post("/:id/password", byId, validate(passwordSchema), controller.resetPassword);
usersRouter.post("/:id/invite", byId, controller.resendWelcome);
