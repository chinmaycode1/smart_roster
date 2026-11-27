import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { getBrands, createBrand } from './controller.js';

const router = Router();

router.get('/', asyncHandler(getBrands));
router.post('/', asyncHandler(createBrand));

export default router;
