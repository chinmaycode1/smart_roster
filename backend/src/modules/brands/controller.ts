import type { Request, Response, NextFunction } from 'express';
import * as service from './service.js';
import type { CreateBrandInput, UpdateBrandInput } from './schema.js';

export async function getBrands(_req: Request, res: Response, next: NextFunction) {
  try {
    const brands = await service.fetchBrands();
    res.json({ data: brands });
  } catch (error) {
    next(error);
  }
}

export async function createBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const brand = await service.createBrand(req.body as CreateBrandInput);
    res.status(201).json({ data: brand });
  } catch (error) {
    next(error);
  }
}

export async function updateBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const brand = await service.updateBrand(req.params.id, req.body as UpdateBrandInput);
    res.json({ data: brand });
  } catch (error) {
    next(error);
  }
}

export async function deleteBrand(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteBrand(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
