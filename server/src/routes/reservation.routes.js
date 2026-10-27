import { Router } from 'express';
import { createReservation, getReservations, getMyReservations, cancelReservation } from '../controllers/reservation.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
const router = Router();
router.get('/', authenticate, authorize('admin', 'librarian'), getReservations);
router.get('/mine', authenticate, getMyReservations);
router.post('/', authenticate, createReservation);
router.post('/:id/cancel', authenticate, cancelReservation);
export default router;
