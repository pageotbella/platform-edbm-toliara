import type { Request, Response } from "express";
import * as service from "./users.service";

export const list = async (_req: Request, res: Response) => {
  res.json(await service.list(res.locals.query));
};

export const create = async (req: Request, res: Response) => {
  res.status(201).json(await service.create(req.body, req.user!.id));
};

export const update = async (req: Request, res: Response) => {
  await service.update(res.locals.params.id, req.body, req.user!.id);
  res.status(204).end();
};

export const setStatus = async (req: Request, res: Response) => {
  await service.setStatus(res.locals.params.id, req.body.status, req.user!.id);
  res.status(204).end();
};

export const resendWelcome = async (req: Request, res: Response) => {
  await service.resendWelcome(res.locals.params.id, req.user!.id);
  res.status(204).end();
};

export const resetPassword =async (req: Request, res: Response) => {
  await service.resetPassword(res.locals.params.id, req.body.password, req.user!.id);
  res.status(204).end();
};
