import express from "express";

import {
    getInventory,
    updateProductStock,
    updateVariantStock,
} from "../controllers/stockController.js";

import {
    authenticateUser,
    requireAdmin,
} from "../middleware/authMiddleware.js";

const router =
    express.Router();

/* ============================================================
   ADMIN STOCK
============================================================ */

/*
 * GET /api/stock
 */

router.get(
    "/",
    authenticateUser,
    requireAdmin,
    getInventory
);

/*
 * PUT /api/stock/:id
 *
 * Fixed product stock.
 */

router.put(
    "/:id",
    authenticateUser,
    requireAdmin,
    updateProductStock
);

/*
 * PUT /api/stock/:id/variant/:variantId
 *
 * Variant stock.
 */

router.put(
    "/:id/variant/:variantId",
    authenticateUser,
    requireAdmin,
    updateVariantStock
);

export default router;