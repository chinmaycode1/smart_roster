import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { getBrandProcesses, createBrandProcess, updateBrandProcess, deleteBrandProcess } from './controller.js';

const router = Router();

router.get('/', asyncHandler(getBrandProcesses));
router.post('/', asyncHandler(createBrandProcess));
router.put('/:id', asyncHandler(updateBrandProcess));
router.delete('/:id', asyncHandler(deleteBrandProcess));

export default router;
