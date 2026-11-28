import type { Request, Response } from 'express';
import { createCompOffSchema, updateCompOffSchema } from './schema.js';
import * as compOffService from './service.js';

export async function listCompOffs(req: Request, res: Response) {
  const { employeeId } = req.query;
  const compOffs = await compOffService.getCompOffs({
    employeeId: employeeId as string | undefined,
  });
  res.json({ data: compOffs });
}

export async function createCompOff(req: Request, res: Response) {
  const data = createCompOffSchema.parse(req.body);
  const compOff = await compOffService.createCompOff(data);
  res.status(201).json({ data: compOff });
}

export async function updateCompOff(req: Request, res: Response) {
  const data = updateCompOffSchema.parse(req.body);
  const compOff = await compOffService.updateCompOff(req.params.id, data);
  res.json({ data: compOff });
}

export async function deleteCompOff(req: Request, res: Response) {
  await compOffService.deleteCompOff(req.params.id);
  res.status(204).send();
}
