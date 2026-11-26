import type { Request, Response, NextFunction } from 'express';
import * as service from './service.js';

export async function getDashboardSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const summary = await service.getDashboardSummary(month, year);
    res.json({ data: summary });
  } catch (error) {
    next(error);
  }
}
