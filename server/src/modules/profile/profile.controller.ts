import type { Request, Response } from "express";
import * as service from "./profile.service";

export const get = async (req: Request, res: Response) => {
  res.json(await service.get(req.user!.id));
};

export const update = async (req: Request, res: Response) => {
  await service.update(req.user!.id, req.body);
  res.status(204).end();
};
