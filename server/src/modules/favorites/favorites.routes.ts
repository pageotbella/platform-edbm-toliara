import { Router } from "express";
import { z } from "zod";
import { requireRole } from "@/middlewares/auth";
import { validate } from "@/middlewares/validate";
import * as controller from "./favorites.controller";

// Favoris de l'investisseur connecté (section 16)
export const favoritesRouter = Router();

favoritesRouter.use(requireRole("investisseur"));

favoritesRouter.get("/", controller.list);
favoritesRouter.get("/ids", controller.ids);
favoritesRouter.post("/toggle", validate(z.object({ opportunityId: z.uuid() })), controller.toggle);
