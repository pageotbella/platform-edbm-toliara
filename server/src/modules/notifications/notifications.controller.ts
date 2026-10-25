import type { Request, Response } from "express";
import * as service from "./notifications.service";

export const list = async (req: Request, res: Response) => {
  res.json(await service.list(req.user!.id, res.locals.query));
};

export const unreadCount = async (req: Request, res: Response) => {
  res.json(await service.unreadCount(req.user!.id));
};

export const markRead = async (req: Request, res: Response) => {
  await service.markRead(req.user!.id, res.locals.params.id);
  res.status(204).end();
};

export const markAllRead = async (req: Request, res: Response) => {
  await service.markAllRead(req.user!.id);
  res.status(204).end();
};

export const remove = async (req: Request, res: Response) => {
  await service.remove(req.user!.id, res.locals.params.id);
  res.status(204).end();
};
