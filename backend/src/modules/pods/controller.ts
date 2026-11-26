import type { Request, Response } from 'express';
import { createPodSchema, updatePodSchema } from './schema.js';
import * as podService from './service.js';

export async function listPods(_req: Request, res: Response) {
  const pods = await podService.getAllPods();
  res.json(pods);
}

export async function getPod(req: Request, res: Response) {
  const pod = await podService.getPodById(req.params.id);
  if (!pod) {
    return res.status(404).json({ error: 'Pod not found' });
  }
  res.json(pod);
}

export async function createPod(req: Request, res: Response) {
  const data = createPodSchema.parse(req.body);
  const pod = await podService.createPod(data);
  res.status(201).json(pod);
}

export async function updatePod(req: Request, res: Response) {
  const data = updatePodSchema.parse(req.body);
  const pod = await podService.updatePod(req.params.id, data);
  res.json(pod);
}

export async function deletePod(req: Request, res: Response) {
  await podService.deletePod(req.params.id);
  res.status(204).send();
}
