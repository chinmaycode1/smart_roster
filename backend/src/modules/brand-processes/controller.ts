import type { Request, Response, NextFunction } from 'express';
import * as service from './service.js';
import type { CreateBrandProcessInput, UpdateBrandProcessInput } from './schema.js';

export async function getBrandProcesses(_req: Request, res: Response, next: NextFunction) {
  try {
    const brandProcesses = await service.fetchBrandProcesses();
    res.json({ data: brandProcesses });
  } catch (error) {
    next(error);
  }
}

export async function createBrandProcess(req: Request, res: Response, next: NextFunction) {
  try {
    const brandProcess = await service.createBrandProcess(req.body as CreateBrandProcessInput);
    res.status(201).json({ data: brandProcess });
  } catch (error) {
    next(error);
  }
}

export async function updateBrandProcess(req: Request, res: Response, next: NextFunction) {
  try {
    const brandProcess = await service.updateBrandProcess(req.params.id, req.body as UpdateBrandProcessInput);
    res.json({ data: brandProcess });
  } catch (error) {
    next(error);
  }
}

export async function deleteBrandProcess(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteBrandProcess(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
