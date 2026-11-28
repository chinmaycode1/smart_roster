import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as holidayController from './controller.js';

export const holidayRoutes = Router();

holidayRoutes.get('/', asyncHandler(holidayController.listHolidays));
holidayRoutes.post('/', asyncHandler(holidayController.createHoliday));
holidayRoutes.delete('/:id', asyncHandler(holidayController.deleteHoliday));
