import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "@/middlewares/auth";
import { validate } from "@/middlewares/validate";
import * as controller from "./notifications.controller";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

const byId = validate(z.object({ id: z.uuid() }), "params");
const listQuery = z.object({
  unreadOnly: z.stringbool().default(false),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

notificationsRouter.get("/", validate(listQuery, "query"), controller.list);
notificationsRouter.get("/unread-count", controller.unreadCount);
notificationsRouter.patch("/:id/read", byId, controller.markRead);
notificationsRouter.post("/read-all", controller.markAllRead);
notificationsRouter.delete("/:id", byId, controller.remove);
