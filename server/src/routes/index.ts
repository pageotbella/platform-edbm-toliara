import { Router } from "express";
import { auditLogsRouter } from "@/modules/audit-logs/audit-logs.routes";
import { contactRouter } from "@/modules/contact/contact.routes";
import { documentsRouter } from "@/modules/documents/documents.routes";
import { favoritesRouter } from "@/modules/favorites/favorites.routes";
import { interestRequestsRouter } from "@/modules/interest-requests/interest-requests.routes";
import { notificationsRouter } from "@/modules/notifications/notifications.routes";
import { opportunitiesRouter } from "@/modules/opportunities/opportunities.routes";
import { staffOpportunitiesRouter } from "@/modules/opportunities/staff-opportunities.routes";
import { permissionsRouter, staffRouter } from "@/modules/permissions/permissions.routes";
import { profileRouter } from "@/modules/profile/profile.routes";
import { communesRouter, districtsRouter, regionsRouter } from "@/modules/regions/regions.routes";
import { sectorsRouter } from "@/modules/sectors/sectors.routes";
import { settingsRouter } from "@/modules/settings/settings.routes";
import { statsRouter } from "@/modules/stats/stats.routes";
import { usersRouter } from "@/modules/users/users.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => res.json({ status: "ok" }));

// Portail public et investisseurs
apiRouter.use("/opportunities", opportunitiesRouter);
apiRouter.use("/sectors", sectorsRouter);
apiRouter.use("/regions", regionsRouter);
apiRouter.use("/districts", districtsRouter);
apiRouter.use("/communes", communesRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/contact", contactRouter);
apiRouter.use("/favorites", favoritesRouter);
apiRouter.use("/interest-requests", interestRequestsRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/profile", profileRouter);

// Espace EDBM et administration
apiRouter.use("/staff/opportunities", staffOpportunitiesRouter);
apiRouter.use("/staff", staffRouter);
apiRouter.use("/stats", statsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/permissions", permissionsRouter);
apiRouter.use("/audit-logs", auditLogsRouter);
apiRouter.use(documentsRouter); // /upload, /files/*key, /documents…, /media/:id…
