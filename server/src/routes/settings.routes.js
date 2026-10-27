import { Router } from 'express';
import { fetchSettings, updateSettings } from '../controllers/settings.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
const router = Router();
router.get('/', authenticate, fetchSettings);
router.patch('/', authenticate, authorize('admin'), updateSettings);
export default router;
