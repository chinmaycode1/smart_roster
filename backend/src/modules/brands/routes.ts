import { Router } from 'express';
import { getBrands, createBrand } from './controller.js';

const router = Router();

router.get('/', getBrands);
router.post('/', createBrand);

export default router;
