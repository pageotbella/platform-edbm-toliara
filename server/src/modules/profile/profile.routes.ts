import { Router } from "express";
import { requireAuth } from "@/middlewares/auth";
import { validate } from "@/middlewares/validate";
import * as controller from "./profile.controller";
import { profileUpdateSchema } from "./profile.schemas";

// « Mon profil » : tous les rôles connectés
export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get("/", controller.get);
profileRouter.put("/", validate(profileUpdateSchema), controller.update);
