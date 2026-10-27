import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
const router = Router();
router.get('/', authenticate, authorize('admin'), getAuditLogs);
export default router;
