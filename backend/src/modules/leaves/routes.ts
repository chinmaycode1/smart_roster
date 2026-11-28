import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as leaveController from './controller.js';

export const leaveRoutes = Router();

leaveRoutes.get('/', asyncHandler(leaveController.listLeaves));
leaveRoutes.post('/', asyncHandler(leaveController.createLeave));
leaveRoutes.put('/:id', asyncHandler(leaveController.updateLeave));
leaveRoutes.delete('/:id', asyncHandler(leaveController.deleteLeave));
