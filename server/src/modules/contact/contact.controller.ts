import type { Request, Response } from "express";
import * as service from "./contact.service";

export const send = async (req: Request, res: Response) => {
  await service.send(req.body);
  res.status(204).end();
};
