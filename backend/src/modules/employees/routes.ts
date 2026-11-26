import { Router } from 'express';
import { getEmployees, getEmployee, createEmployee, updateEmployee } from './controller.js';

const router = Router();

router.get('/', getEmployees);
router.get('/:id', getEmployee);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);

export default router;
