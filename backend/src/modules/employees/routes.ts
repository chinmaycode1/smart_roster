import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { getEmployees, getEmployee, createEmployee, updateEmployee } from './controller.js';

const router = Router();

router.get('/', asyncHandler(getEmployees));
router.get('/:id', asyncHandler(getEmployee));
router.post('/', asyncHandler(createEmployee));
router.put('/:id', asyncHandler(updateEmployee));

export default router;
