import type { Request, Response } from "express";
import * as service from "./audit-logs.service";

export const list = async (_req: Request, res: Response) => {
  res.json(await service.list(res.locals.query));
};

export const exportRows = async (_req: Request, res: Response) => {
  res.json(await service.exportRows(res.locals.query));
};
