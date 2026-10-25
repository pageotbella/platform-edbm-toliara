import { Router } from "express";
import { formLimiter } from "@/middlewares/rate-limit";
import { validate } from "@/middlewares/validate";
import * as controller from "./contact.controller";
import { contactMessageSchema } from "./contact.schemas";

// Formulaire de contact du portail public
export const contactRouter = Router();

contactRouter.post("/", formLimiter, validate(contactMessageSchema), controller.send);
