import type { Request, Response } from 'express';
import { createLeaveSchema, updateLeaveSchema } from './schema.js';
import * as leaveService from './service.js';

export async function listLeaves(req: Request, res: Response) {
  const { employeeId, status } = req.query;
  const leaves = await leaveService.getLeaves({
    employeeId: employeeId as string | undefined,
    status: status as string | undefined,
  });
  res.json({ data: leaves });
}

export async function createLeave(req: Request, res: Response) {
  const data = createLeaveSchema.parse(req.body);
  const leave = await leaveService.createLeave(data);
  res.status(201).json({ data: leave });
}

export async function updateLeave(req: Request, res: Response) {
  const data = updateLeaveSchema.parse(req.body);
  const result = await leaveService.updateLeave(req.params.id, data);
  
  // Check if leave was approved and has affected rosters
  if ('_affectedRosterIds' in result && Array.isArray(result._affectedRosterIds)) {
    const { _affectedRosterIds, ...leave } = result;
    res.json({ data: leave, affectedRosterIds: _affectedRosterIds });
  } else {
    res.json({ data: result });
  }
}

export async function deleteLeave(req: Request, res: Response) {
  await leaveService.deleteLeave(req.params.id);
  res.status(204).send();
}
