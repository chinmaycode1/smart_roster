import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as processController from './controller.js';

export const processRoutes = Router();

processRoutes.get('/', asyncHandler(processController.listProcesses));
processRoutes.get('/:id', asyncHandler(processController.getProcess));
processRoutes.post('/', asyncHandler(processController.createProcess));
processRoutes.put('/:id', asyncHandler(processController.updateProcess));
processRoutes.delete('/:id', asyncHandler(processController.deleteProcess));
