import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { getAssignments, createAssignment, updateAssignment, deleteAssignment } from './controller.js';

const router = Router();

router.get('/', asyncHandler(getAssignments));
router.post('/', asyncHandler(createAssignment));
router.put('/:id', asyncHandler(updateAssignment));
router.delete('/:id', asyncHandler(deleteAssignment));

export default router;
