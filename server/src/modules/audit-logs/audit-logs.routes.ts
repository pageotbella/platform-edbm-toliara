import { Router } from "express";
import { requireRole } from "@/middlewares/auth";
import { validate } from "@/middlewares/validate";
import * as controller from "./audit-logs.controller";
import { auditFiltersSchema, auditListQuerySchema } from "./audit-logs.schemas";

export const auditLogsRouter = Router();

auditLogsRouter.use(requireRole("admin"));

auditLogsRouter.get("/", validate(auditListQuerySchema, "query"), controller.list);
auditLogsRouter.get("/export", validate(auditFiltersSchema, "query"), controller.exportRows);
