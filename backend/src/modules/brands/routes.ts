import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { getBrands, createBrand, updateBrand, deleteBrand } from './controller.js';

const router = Router();

router.get('/', asyncHandler(getBrands));
router.post('/', asyncHandler(createBrand));
router.put('/:id', asyncHandler(updateBrand));
router.delete('/:id', asyncHandler(deleteBrand));

export default router;
