import type { Request, Response } from "express";
import * as service from "./partner-projects.service";

export const list = async (_req: Request, res: Response) => {
  res.json(await service.listPublished());
};

export const manage = async (_req: Request, res: Response) => {
  res.json(await service.listAll());
};

export const create = async (req: Request, res: Response) => {
  res.status(201).json(await service.save(undefined, req.body, req.user!.id));
};

export const update = async (req: Request, res: Response) => {
  res.json(await service.save(res.locals.params.id, req.body, req.user!.id));
};

export const setPublished = async (req: Request, res: Response) => {
  await service.setPublished(res.locals.params.id, req.body.isPublished, req.user!.id);
  res.status(204).end();
};

export const remove = async (req: Request, res: Response) => {
  await service.remove(res.locals.params.id, req.user!.id);
  res.status(204).end();
};
