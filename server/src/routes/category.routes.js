import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
const router = Router();
router.get('/', authenticate, getCategories);
router.post('/', authenticate, authorize('admin', 'librarian'), createCategory);
router.patch('/:id', authenticate, authorize('admin', 'librarian'), updateCategory);
router.delete('/:id', authenticate, authorize('admin', 'librarian'), deleteCategory);
export default router;
