import { Router } from 'express';
import { getDashboardStats, getMemberDashboard } from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
const router = Router();
router.get('/stats', authenticate, authorize('admin', 'librarian'), getDashboardStats);
router.get('/member', authenticate, getMemberDashboard);
export default router;
