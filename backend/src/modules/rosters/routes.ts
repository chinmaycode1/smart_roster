import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as rosterController from './controller.js';

export const rosterRoutes = Router();

rosterRoutes.get('/', asyncHandler(rosterController.listRosters));
rosterRoutes.post('/generate', asyncHandler(rosterController.generateRoster));
rosterRoutes.get('/:id', asyncHandler(rosterController.getRoster));
rosterRoutes.get('/:id/entries', asyncHandler(rosterController.getRosterEntries));
rosterRoutes.put('/:id/entries/:entryId', asyncHandler(rosterController.updateEntry));
rosterRoutes.post('/:id/impact', asyncHandler(rosterController.analyzeImpact));
rosterRoutes.post('/:id/repair', asyncHandler(rosterController.repairRoster));
rosterRoutes.get('/:id/conflicts', asyncHandler(rosterController.getConflicts));
rosterRoutes.post('/:id/publish', asyncHandler(rosterController.publishRoster));
rosterRoutes.post('/:id/request-approval', asyncHandler(rosterController.requestApproval));
rosterRoutes.post('/:id/approve', asyncHandler(rosterController.approveRoster));
rosterRoutes.post('/:id/reject', asyncHandler(rosterController.rejectRoster));
rosterRoutes.get('/:id/audit-logs', asyncHandler(rosterController.getAuditLogs));
rosterRoutes.get('/:id/compare/:compareToId', asyncHandler(rosterController.compareVersions));
rosterRoutes.get('/:id/export/csv', asyncHandler(rosterController.exportCSV));
rosterRoutes.get('/:id/view-data', asyncHandler(rosterController.getViewData));
rosterRoutes.get('/:id/view', asyncHandler(rosterController.getViewData));
rosterRoutes.post('/:id/revalidate', asyncHandler(rosterController.revalidateRoster));
