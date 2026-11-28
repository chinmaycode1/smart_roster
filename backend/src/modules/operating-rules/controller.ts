import type { Request, Response, NextFunction } from 'express';
import * as service from './service.js';

export async function getOperatingRules(_req: Request, res: Response, next: NextFunction) {
  try {
    const rules = await service.fetchOperatingRules();
    res.json({ data: rules });
  } catch (error) {
    next(error);
  }
}
