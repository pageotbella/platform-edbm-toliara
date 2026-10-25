import { Router } from "express";
import { optionalAuth, requireRole } from "@/middlewares/auth";
import { uploadSingle } from "@/middlewares/upload";
import { validate } from "@/middlewares/validate";
import * as controller from "./documents.controller";
import {
  documentUpdateSchema, fileParamsSchema, idParamsSchema, listQuerySchema, mediaUpdateSchema, uploadBodySchema,
} from "./documents.schemas";

// Monté directement sous /api : /upload, /files/*key, /documents…, /media/:id…
export const documentsRouter = Router();

const staff = requireRole("agent", "admin");
const byId = validate(idParamsSchema, "params");

documentsRouter.post("/upload", staff, uploadSingle, validate(uploadBodySchema), controller.upload);
documentsRouter.get("/files/*key", optionalAuth, validate(fileParamsSchema, "params"), controller.file);

documentsRouter.get("/documents", staff, validate(listQuerySchema, "query"), controller.list);
documentsRouter.get("/documents/recent", staff, controller.recent);
documentsRouter.patch("/documents/:id", staff, byId, validate(documentUpdateSchema), controller.updateDocument);
documentsRouter.delete("/documents/:id", staff, byId, controller.removeDocument);

documentsRouter.patch("/media/:id", staff, byId, validate(mediaUpdateSchema), controller.updateMedia);
documentsRouter.post("/media/:id/cover", staff, byId, controller.setCover);
documentsRouter.delete("/media/:id", staff, byId, controller.removeMedia);
