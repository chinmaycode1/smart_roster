import type { Request, Response } from 'express';
import * as rosterService from './service.js';
import { generateRosterSchema, updateEntrySchema, changeImpactSchema, approvalActionSchema, listRostersSchema } from './schema.js';

export async function listRosters(req: Request, res: Response) {
  const query = listRostersSchema.parse(req.query);
  const rosters = await rosterService.listRosters(query.month, query.year);
  res.json({ rosters });
}

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
  const data = changeImpactSchema.parse(req.body);
  const impact = await rosterService.analyzeChangeImpact(req.params.id, data);
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

export async function requestApproval(req: Request, res: Response) {
  const data = approvalActionSchema.parse(req.body);
  const roster = await rosterService.requestApproval(req.params.id, data.actorId);
  res.json(roster);
}

export async function approveRoster(req: Request, res: Response) {
  const data = approvalActionSchema.parse(req.body);
  const roster = await rosterService.approveRoster(req.params.id, data.actorId);
  res.json(roster);
}

export async function rejectRoster(req: Request, res: Response) {
  const data = approvalActionSchema.parse(req.body);
  const roster = await rosterService.rejectRoster(req.params.id, data.reason || 'No reason provided', data.actorId);
  res.json(roster);
}

export async function getAuditLogs(req: Request, res: Response) {
  const logs = await rosterService.getAuditLogs(req.params.id);
  res.json(logs);
}

export async function compareVersions(req: Request, res: Response) {
  const diff = await rosterService.compareVersions(req.params.id, req.params.compareToId);
  res.json(diff);
}

export async function exportCSV(req: Request, res: Response) {
  const csv = await rosterService.exportRosterCSV(req.params.id);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=roster-${req.params.id}.csv`);
  res.send(csv);
}

export async function getViewData(req: Request, res: Response) {
  const data = await rosterService.getRosterViewData(req.params.id);
  res.json(data);
}

export async function revalidateRoster(req: Request, res: Response) {
  const result = await rosterService.revalidateRoster(req.params.id);
  res.json(result);
}
