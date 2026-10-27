import { Router } from 'express';
import { getFines, getMyFines, payFine, waiveFine } from '../controllers/fine.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
const router = Router();
router.get('/', authenticate, authorize('admin', 'librarian'), getFines);
router.get('/mine', authenticate, getMyFines);
router.post('/:id/pay', authenticate, authorize('admin', 'librarian'), payFine);
router.post('/:id/waive', authenticate, authorize('admin', 'librarian'), waiveFine);
export default router;
