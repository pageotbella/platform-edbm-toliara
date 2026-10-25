import type { Request, Response } from "express";
import * as service from "./stats.service";

export const overview = async (_req: Request, res: Response) => {
  res.json(await service.overview(res.locals.query.months));
};

export const admin = async (_req: Request, res: Response) => {
  res.json(await service.admin());
};

export const investor = async (req: Request, res: Response) => {
  res.json(await service.investor(req.user!.id));
};
