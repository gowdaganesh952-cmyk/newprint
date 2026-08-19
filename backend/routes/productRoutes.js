import express from "express";

import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../controllers/productController.js";

import {
    authenticateUser,
    requireAdmin,
} from "../middleware/authMiddleware.js";

import {
    upload,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ============================================================
// GET ALL PRODUCTS
// POST CREATE PRODUCT
// ============================================================

router
    .route("/")
    .get(
        getProducts
    )
    .post(
        authenticateUser,
        upload.array(
            "images",
            10
        ),
        requireAdmin,
        createProduct
    );

// ============================================================
// GET / UPDATE / DELETE PRODUCT
// ============================================================

router
    .route("/:id")
    .get(
        getProduct
    )
    .put(
        authenticateUser,
        upload.array(
            "images",
            10
        ),
        requireAdmin,
        updateProduct
    )
    .delete(
        authenticateUser,
        requireAdmin,
        deleteProduct
    );

export default router;