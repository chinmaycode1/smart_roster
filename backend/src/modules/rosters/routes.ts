import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as rosterController from './controller.js';

export const rosterRoutes = Router();

rosterRoutes.post('/generate', asyncHandler(rosterController.generateRoster));
rosterRoutes.get('/:id', asyncHandler(rosterController.getRoster));
rosterRoutes.get('/:id/entries', asyncHandler(rosterController.getRosterEntries));
rosterRoutes.put('/:id/entries/:entryId', asyncHandler(rosterController.updateEntry));
rosterRoutes.post('/:id/impact', asyncHandler(rosterController.analyzeImpact));
rosterRoutes.post('/:id/repair', asyncHandler(rosterController.repairRoster));
rosterRoutes.get('/:id/conflicts', asyncHandler(rosterController.getConflicts));
rosterRoutes.post('/:id/publish', asyncHandler(rosterController.publishRoster));
