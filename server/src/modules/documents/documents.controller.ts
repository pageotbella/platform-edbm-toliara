import path from "node:path";
import type { Request, Response } from "express";
import * as service from "./documents.service";

export const upload = async (req: Request, res: Response) => {
  res.status(201).json(await service.upload(req.file, req.body, req.user!.id));
};

export const file = async (req: Request, res: Response) => {
  const key = (res.locals.params.key as string[]).join("/");
  const { path: filePath, downloadName } = await service.resolveFile(key, req.user);
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (downloadName) {
    const ext = path.extname(key);
    res.attachment(downloadName.endsWith(ext) ? downloadName : downloadName + ext);
  }
  res.sendFile(filePath);
};

export const list = async (_req: Request, res: Response) => {
  res.json(await service.list(res.locals.query));
};

export const recent = async (_req: Request, res: Response) => {
  res.json(await service.recent());
};

export const updateDocument = async (req: Request, res: Response) => {
  await service.updateDocument(res.locals.params.id, req.body, req.user!.id);
  res.status(204).end();
};

export const removeDocument = async (req: Request, res: Response) => {
  await service.removeDocument(res.locals.params.id, req.user!.id);
  res.status(204).end();
};

export const updateMedia = async (req: Request, res: Response) => {
  await service.updateMedia(res.locals.params.id, req.body.title);
  res.status(204).end();
};

export const setCover = async (req: Request, res: Response) => {
  await service.setCover(res.locals.params.id, req.user!.id);
  res.status(204).end();
};

export const removeMedia = async (req: Request, res: Response) => {
  await service.removeMedia(res.locals.params.id, req.user!.id);
  res.status(204).end();
};
