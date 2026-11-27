import type { Request, Response, NextFunction } from 'express';
import * as service from './service.js';
import type { CreateBrandInput } from './schema.js';

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
