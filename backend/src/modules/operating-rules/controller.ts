import type { Request, Response } from 'express';
import * as service from './service.js';

export async function listOperatingRules(_req: Request, res: Response) {
  const rules = await service.getAllOperatingRules();
  res.json({ data: rules });
}

export async function getOperatingRule(req: Request, res: Response) {
  const rule = await service.getOperatingRuleById(req.params.id);
  if (!rule) {
    return res.status(404).json({ error: 'Operating rule not found' });
  }
  res.json({ data: rule });
}

export async function createOperatingRule(req: Request, res: Response) {
  const rule = await service.createOperatingRule(req.body as { name: string; type: string; workingWeekdays: number[]; worksOnHolidays: boolean });
  res.status(201).json({ data: rule });
}

export async function updateOperatingRule(req: Request, res: Response) {
  const rule = await service.updateOperatingRule(req.params.id, req.body as { name?: string; type?: string; workingWeekdays?: number[]; worksOnHolidays?: boolean });
  res.json({ data: rule });
}

export async function deleteOperatingRule(req: Request, res: Response) {
  await service.deleteOperatingRule(req.params.id);
  res.status(204).send();
}
