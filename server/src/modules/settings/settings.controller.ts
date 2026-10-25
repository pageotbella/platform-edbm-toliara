import type { Request, Response } from "express";
import * as service from "./settings.service";

export const contact = async (_req: Request, res: Response) => {
  res.json(await service.contact());
};

export const updateContact = async (req: Request, res: Response) => {
  await service.updateContact(req.body, req.user!.id);
  res.status(204).end();
};
