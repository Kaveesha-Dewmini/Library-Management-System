import { Router } from 'express';
import { getStaffList, createStaff, updateStaff } from '../controllers/staff.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
const router = Router();
router.get('/', authenticate, authorize('admin'), getStaffList);
router.post('/', authenticate, authorize('admin'), createStaff);
router.patch('/:id', authenticate, authorize('admin'), updateStaff);
export default router;
