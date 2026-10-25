import type { Request, Response } from "express";
import * as service from "./regions.service";

export const tree = async (_req: Request, res: Response) => {
  res.json(await service.tree());
};

export const summary = async (_req: Request, res: Response) => {
  res.json(await service.summary());
};

export const detail = async (_req: Request, res: Response) => {
  res.json(await service.detail(res.locals.params.id));
};

export const manage = async (_req: Request, res: Response) => {
  res.json(await service.manage());
};

export const createRegion = async (req: Request, res: Response) => {
  res.status(201).json(await service.saveRegion(undefined, req.body, req.user!.id));
};

export const updateRegion = async (req: Request, res: Response) => {
  res.json(await service.saveRegion(res.locals.params.id, req.body, req.user!.id));
};

export const createDistrict = async (req: Request, res: Response) => {
  res.status(201).json(await service.saveDistrict({ regionId: res.locals.params.id, name: req.body.name }, req.user!.id));
};

export const updateDistrict = async (req: Request, res: Response) => {
  res.json(await service.saveDistrict({ id: res.locals.params.id, name: req.body.name }, req.user!.id));
};

export const createCommune = async (req: Request, res: Response) => {
  res.status(201).json(await service.saveCommune({ districtId: res.locals.params.id, name: req.body.name }, req.user!.id));
};

export const updateCommune = async (req: Request, res: Response) => {
  res.json(await service.saveCommune({ id: res.locals.params.id, name: req.body.name }, req.user!.id));
};

// Suppression d'un niveau de la hiérarchie (région, district ou commune)
export const remove = (level: "region" | "district" | "commune") => async (req: Request, res: Response) => {
  await service.remove(level, res.locals.params.id, req.user!.id);
  res.status(204).end();
};
