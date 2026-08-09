import express from 'express';

import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';

import {
    authenticateUser,
    requireAdmin
} from '../middleware/authMiddleware.js';

import {
    upload
} from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getProducts)
    .post(
        authenticateUser,
        upload.array('images', 10),
        requireAdmin,
        createProduct
    );

router.route('/:id')
    .get(getProduct)
    .put(
        authenticateUser,
        upload.array('images', 10),
        requireAdmin,
        updateProduct
    )
    .delete(
        authenticateUser,
        requireAdmin,
        deleteProduct
    );

export default router;