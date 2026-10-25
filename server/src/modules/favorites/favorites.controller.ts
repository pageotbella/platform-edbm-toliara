import type { Request, Response } from "express";
import * as service from "./favorites.service";

export const list = async (req: Request, res: Response) => {
  res.json(await service.list(req.user!.id));
};

export const ids = async (req: Request, res: Response) => {
  res.json(await service.ids(req.user!.id));
};

export const toggle = async (req: Request, res: Response) => {
  res.json(await service.toggle(req.user!.id, req.body.opportunityId));
};
