import type { Request, Response } from 'express';
import * as rosterService from './service.js';
import { generateRosterSchema, updateEntrySchema } from './schema.js';

export async function generateRoster(req: Request, res: Response) {
  const data = generateRosterSchema.parse(req.body);
  const result = await rosterService.generateRoster(data);
  res.status(201).json(result);
}

export async function getRoster(req: Request, res: Response) {
  const roster = await rosterService.getRosterById(req.params.id);
  if (!roster) {
    return res.status(404).json({ error: 'Roster not found' });
  }
  res.json(roster);
}

export async function getRosterEntries(req: Request, res: Response) {
  const entries = await rosterService.getRosterEntries(req.params.id);
  res.json(entries);
}

export async function updateEntry(req: Request, res: Response) {
  const data = updateEntrySchema.parse(req.body);
  const entry = await rosterService.updateEntry(req.params.entryId, data);
  res.json(entry);
}

export async function analyzeImpact(req: Request, res: Response) {
  const impact = await rosterService.analyzeChangeImpact(req.params.id, req.body);
  res.json(impact);
}

export async function repairRoster(req: Request, res: Response) {
  const result = await rosterService.repairRoster(req.params.id);
  res.json(result);
}

export async function getConflicts(req: Request, res: Response) {
  const conflicts = await rosterService.getRosterConflicts(req.params.id);
  res.json(conflicts);
}

export async function publishRoster(req: Request, res: Response) {
  const roster = await rosterService.publishRoster(req.params.id);
  res.json(roster);
}
