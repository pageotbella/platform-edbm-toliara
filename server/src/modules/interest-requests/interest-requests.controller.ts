import type { Request, Response } from "express";
import * as service from "./interest-requests.service";

export const create = async (req: Request, res: Response) => {
  res.status(201).json(await service.create(req.body, req.user!.id));
};

export const mine = async (req: Request, res: Response) => {
  res.json(await service.mine(req.user!.id, res.locals.query.status));
};

export const mineById = async (req: Request, res: Response) => {
  res.json(await service.mineById(res.locals.params.id, req.user!.id));
};

export const staffList = async (req: Request, res: Response) => {
  res.json(await service.staffList(res.locals.query, req.user!.id));
};

export const staffById = async (_req: Request, res: Response) => {
  res.json(await service.staffById(res.locals.params.id));
};

export const take = async (req: Request, res: Response) => {
  await service.take(res.locals.params.id, req.user!.id);
  res.status(204).end();
};

export const process = async (req: Request, res: Response) => {
  await service.process(res.locals.params.id, req.body, req.user!.id);
  res.status(204).end();
};
