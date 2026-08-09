import express from 'express';
import { 
    getCategories, getCategory, createCategory, 
    updateCategory, updateCategoryStatus, deleteCategory 
} from '../controllers/categoryController.js';
import { authenticateUser, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getCategories) // Public
    .post(authenticateUser, requireAdmin, createCategory);

router.route('/:id')
    .get(getCategory) // Public
    .put(authenticateUser, requireAdmin, updateCategory)
    .delete(authenticateUser, requireAdmin, deleteCategory);

router.route('/:id/status')
    .patch(authenticateUser, requireAdmin, updateCategoryStatus);

export default router;