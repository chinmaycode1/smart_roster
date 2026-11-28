import type { Request, Response } from 'express';
import { createProcessSchema, updateProcessSchema } from './schema.js';
import * as processService from './service.js';

export async function listProcesses(_req: Request, res: Response) {
  const processes = await processService.getAllProcesses();
  res.json({ data: processes });
}

export async function getProcess(req: Request, res: Response) {
  const process = await processService.getProcessById(req.params.id);
  if (!process) {
    return res.status(404).json({ error: 'Process not found' });
  }
  res.json({ data: process });
}

export async function createProcess(req: Request, res: Response) {
  const data = createProcessSchema.parse(req.body);
  const process = await processService.createProcess(data);
  res.status(201).json({ data: process });
}

export async function updateProcess(req: Request, res: Response) {
  const data = updateProcessSchema.parse(req.body);
  const process = await processService.updateProcess(req.params.id, data);
  res.json({ data: process });
}

export async function deleteProcess(req: Request, res: Response) {
  await processService.deleteProcess(req.params.id);
  res.status(204).send();
}
