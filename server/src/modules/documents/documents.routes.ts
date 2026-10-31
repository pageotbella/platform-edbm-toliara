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
// Fichiers d'un projet : le personnel, ou le porteur pour ses propres projets (vérifié dans le service)
const filesEditor = requireRole("agent", "admin", "porteur");
const byId = validate(idParamsSchema, "params");

documentsRouter.post("/upload", filesEditor, uploadSingle, validate(uploadBodySchema), controller.upload);
documentsRouter.get("/files/*key", optionalAuth, validate(fileParamsSchema, "params"), controller.file);

documentsRouter.get("/documents", staff, validate(listQuerySchema, "query"), controller.list);
documentsRouter.get("/documents/recent", staff, controller.recent);
documentsRouter.patch("/documents/:id", staff, byId, validate(documentUpdateSchema), controller.updateDocument);
documentsRouter.delete("/documents/:id", filesEditor, byId, controller.removeDocument);

documentsRouter.patch("/media/:id", filesEditor, byId, validate(mediaUpdateSchema), controller.updateMedia);
documentsRouter.post("/media/:id/cover", filesEditor, byId, controller.setCover);
documentsRouter.delete("/media/:id", filesEditor, byId, controller.removeMedia);
