import { Router } from "express";
import { optionalAuth } from "@/middlewares/auth";
import { validate } from "@/middlewares/validate";
import * as controller from "./opportunities.controller";
import {
  featuredQuerySchema, idParamsSchema, listQuerySchema, mapPointsQuerySchema, slugParamsSchema,
} from "./opportunities.schemas";

// Portail public : opportunités publiées uniquement
export const opportunitiesRouter = Router();

opportunitiesRouter.get("/", validate(listQuerySchema, "query"), controller.list);
opportunitiesRouter.get("/map-points", validate(mapPointsQuerySchema, "query"), controller.mapPoints);
opportunitiesRouter.get("/map", controller.mapData);
opportunitiesRouter.get("/filter-options", controller.filterOptions);
opportunitiesRouter.get("/featured", validate(featuredQuerySchema, "query"), controller.featured);
opportunitiesRouter.get("/key-figures", controller.keyFigures);
opportunitiesRouter.get("/:slug", validate(slugParamsSchema, "params"), controller.detail);
opportunitiesRouter.post("/:id/views", optionalAuth, validate(idParamsSchema, "params"), controller.trackView);
