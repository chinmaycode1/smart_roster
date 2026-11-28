import type { Request, Response } from 'express';
import * as reportsService from './service.js';

export async function getFairnessReport(req: Request, res: Response) {
  const report = await reportsService.generateFairnessReport(req.params.rosterId);
  res.json({ data: report });
}

export async function getCoverageReport(req: Request, res: Response) {
  const report = await reportsService.generateCoverageReport(req.params.rosterId);
  res.json({ data: report });
}

export async function exportRosterCSV(req: Request, res: Response) {
  const csv = await reportsService.exportToCSV(req.params.rosterId);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=roster-${req.params.rosterId}.csv`);
  res.send(csv);
}
