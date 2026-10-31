import type { Request, Response } from "express";
import * as service from "./staff-opportunities.service";

export const list = async (_req: Request, res: Response) => {
  res.json(await service.list(res.locals.query));
};

export const pending = async (_req: Request, res: Response) => {
  res.json(await service.pending());
};

export const options = async (_req: Request, res: Response) => {
  res.json(await service.options());
};

export const byId = async (req: Request, res: Response) => {
  res.json(await service.byId(res.locals.params.id, req.user!));
};

export const create = async (req: Request, res: Response) => {
  res.status(201).json(await service.create(req.body, req.user!.id));
};

export const update = async (req: Request, res: Response) => {
  res.json(await service.update(res.locals.params.id, req.body, req.user!.id));
};

export const changeStatus = async (req: Request, res: Response) => {
  res.json(await service.changeStatus(res.locals.params.id, req.body.status, req.user!, req.body.note));
};

export const remove = async (req: Request, res: Response) => {
  await service.remove(res.locals.params.id, req.user!);
  res.status(204).end();
};
