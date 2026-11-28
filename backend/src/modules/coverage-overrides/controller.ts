import type { Request, Response, NextFunction } from 'express';
import * as service from './service.js';
import type { CreateCoverageOverrideInput } from './schema.js';

export async function getCoverageOverrides(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandProcessId } = req.query;
    const overrides = await service.fetchCoverageOverrides(brandProcessId as string | undefined);
    res.json({ data: overrides });
  } catch (error) {
    next(error);
  }
}

export async function createCoverageOverride(req: Request, res: Response, next: NextFunction) {
  try {
    const override = await service.createCoverageOverride(req.body as CreateCoverageOverrideInput);
    res.status(201).json({ data: override });
  } catch (error) {
    next(error);
  }
}

export async function deleteCoverageOverride(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteCoverageOverride(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
