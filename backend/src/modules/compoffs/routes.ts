import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as compOffController from './controller.js';

export const compOffRoutes = Router();

compOffRoutes.get('/', asyncHandler(compOffController.listCompOffs));
compOffRoutes.post('/', asyncHandler(compOffController.createCompOff));
compOffRoutes.put('/:id', asyncHandler(compOffController.updateCompOff));
compOffRoutes.delete('/:id', asyncHandler(compOffController.deleteCompOff));
