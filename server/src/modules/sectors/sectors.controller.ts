import type { Request, Response } from "express";
import * as service from "./sectors.service";

export const list = async (_req: Request, res: Response) => {
  res.json(await service.listActive());
};

export const summary = async (_req: Request, res: Response) => {
  res.json(await service.summary());
};

export const bySlug = async (_req: Request, res: Response) => {
  res.json(await service.bySlug(res.locals.params.slug));
};

export const manage = async (_req: Request, res: Response) => {
  res.json(await service.manage());
};

export const create = async (req: Request, res: Response) => {
  res.status(201).json(await service.save(undefined, req.body, req.user!.id));
};

export const update = async (req: Request, res: Response) => {
  res.json(await service.save(res.locals.params.id, req.body, req.user!.id));
};

export const setActive = async (req: Request, res: Response) => {
  await service.setActive(res.locals.params.id, req.body.isActive, req.user!.id);
  res.status(204).end();
};
