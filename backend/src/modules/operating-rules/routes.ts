import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as controller from './controller.js';

export const operatingRulesRoutes = Router();

operatingRulesRoutes.get('/', asyncHandler(controller.listOperatingRules));
operatingRulesRoutes.get('/:id', asyncHandler(controller.getOperatingRule));
operatingRulesRoutes.post('/', asyncHandler(controller.createOperatingRule));
operatingRulesRoutes.put('/:id', asyncHandler(controller.updateOperatingRule));
operatingRulesRoutes.delete('/:id', asyncHandler(controller.deleteOperatingRule));
