import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as podController from './controller.js';

export const podRoutes = Router();

podRoutes.get('/', asyncHandler(podController.listPods));
podRoutes.get('/:id', asyncHandler(podController.getPod));
podRoutes.post('/', asyncHandler(podController.createPod));
podRoutes.put('/:id', asyncHandler(podController.updatePod));
podRoutes.delete('/:id', asyncHandler(podController.deletePod));
