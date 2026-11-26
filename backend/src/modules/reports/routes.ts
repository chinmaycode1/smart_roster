import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as reportsController from './controller.js';

export const reportsRoutes = Router();

reportsRoutes.get('/fairness/:rosterId', asyncHandler(reportsController.getFairnessReport));
reportsRoutes.get('/coverage/:rosterId', asyncHandler(reportsController.getCoverageReport));
reportsRoutes.get('/export/:rosterId', asyncHandler(reportsController.exportRosterCSV));
