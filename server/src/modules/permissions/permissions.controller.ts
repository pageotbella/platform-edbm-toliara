import type { Request, Response } from "express";
import * as service from "./permissions.service";

export const me = async (req: Request, res: Response) => {
  res.json(await service.me(req.user!));
};

export const agents = async (_req: Request, res: Response) => {
  res.json(await service.agents());
};

export const set = async (req: Request, res: Response) => {
  await service.set(res.locals.params.userId, req.body, req.user!.id);
  res.status(204).end();
};
