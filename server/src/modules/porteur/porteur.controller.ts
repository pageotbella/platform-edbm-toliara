import type { Request, Response } from "express";
import * as service from "./porteur.service";

export const list = async (req: Request, res: Response) => {
  res.json(await service.list(req.user!.id));
};

export const byId = async (req: Request, res: Response) => {
  res.json(await service.byId(res.locals.params.id, req.user!.id));
};

export const create = async (req: Request, res: Response) => {
  res.status(201).json(await service.create(req.body, req.user!.id));
};

export const update = async (req: Request, res: Response) => {
  await service.update(res.locals.params.id, req.body, req.user!.id);
  res.status(204).end();
};

export const submit = async (req: Request, res: Response) => {
  await service.submit(res.locals.params.id, req.user!.id);
  res.status(204).end();
};

export const remove = async (req: Request, res: Response) => {
  await service.remove(res.locals.params.id, req.user!.id);
  res.status(204).end();
};
