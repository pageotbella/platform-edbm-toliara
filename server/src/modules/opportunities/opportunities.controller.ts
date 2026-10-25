import type { Request, Response } from "express";
import * as service from "./opportunities.service";

export const list = async (_req: Request, res: Response) => {
  res.json(await service.list(res.locals.query));
};

export const mapPoints = async (_req: Request, res: Response) => {
  res.json(await service.mapPoints(res.locals.query));
};

export const mapData = async (_req: Request, res: Response) => {
  res.json(await service.mapData());
};

export const filterOptions = async (_req: Request, res: Response) => {
  res.json(await service.filterOptions());
};

export const featured = async (_req: Request, res: Response) => {
  res.json(await service.featured(res.locals.query.limit));
};

export const keyFigures = async (_req: Request, res: Response) => {
  res.json(await service.keyFigures());
};

export const detail = async (_req: Request, res: Response) => {
  res.json(await service.getBySlug(res.locals.params.slug));
};

export const trackView = async (req: Request, res: Response) => {
  await service.trackView(res.locals.params.id, req.user?.id);
  res.status(204).end();
};
