import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { getCoverageOverrides, createCoverageOverride, deleteCoverageOverride } from './controller.js';

const router = Router();

router.get('/', asyncHandler(getCoverageOverrides));
router.post('/', asyncHandler(createCoverageOverride));
router.delete('/:id', asyncHandler(deleteCoverageOverride));

export default router;
