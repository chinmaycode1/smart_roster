import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { getOperatingRules } from './controller.js';

const router = Router();

router.get('/', asyncHandler(getOperatingRules));

export default router;
