import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { getDashboardSummary } from './controller.js';

const router = Router();

router.get('/summary', asyncHandler(getDashboardSummary));

export default router;
