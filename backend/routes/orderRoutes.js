import express from "express";

import {
  authenticateUser,
  requireAdmin,
} from "../middleware/authMiddleware.js";

import {
  getOrders,
  getOrderStats,
  getOrderById,
  createPaymentOrder,
  verifyPayment,
  getAdminOrders,
  getAdminOrderStats,
  getAdminOrderById,
  updateOrderStatusAdmin
} from "../controllers/orderController.js";

const router = express.Router();

/* ============================================================
   AUTHENTICATION
============================================================ */

/*
 * Every order endpoint requires
 * an authenticated Clerk user.
 */
router.use(authenticateUser);

/* ============================================================
   ADMIN ROUTES
============================================================ */

// Must be placed before /:id routes to avoid parameter mismatch
router.get("/admin/stats", requireAdmin, getAdminOrderStats);
router.get("/admin", requireAdmin, getAdminOrders);
router.get("/admin/:id", requireAdmin, getAdminOrderById);
router.patch("/admin/:id/status", requireAdmin, updateOrderStatusAdmin);


/* ============================================================
   CUSTOMER: ORDER STATS
============================================================ */

/*
 * GET /api/orders/stats
 *
 * IMPORTANT:
 * This must stay BEFORE /:id.
 */
router.get(
  "/stats",
  getOrderStats
);

/* ============================================================
   CREATE PAYMENT
============================================================ */

/*
 * POST /api/orders/create-payment
 *
 * Backend calculates:
 * - cart items
 * - quantities
 * - print units
 * - prices
 * - subtotal
 * - delivery
 * - total
 *
 * The frontend must NOT send the amount.
 */
router.post(
  "/create-payment",
  createPaymentOrder
);

/* ============================================================
   VERIFY PAYMENT
============================================================ */

/*
 * POST /api/orders/verify-payment
 *
 * Successful payment = Confirmed
 * Failure/Cancellation updates paymentStatus, retains Not Completed.
 */
router.post(
  "/verify-payment",
  verifyPayment
);

/* ============================================================
   GET ALL USER ORDERS
============================================================ */

/*
 * GET /api/orders
 * Returns the authenticated user's orders only.
 */
router.get(
  "/",
  getOrders
);

/* ============================================================
   GET SINGLE USER ORDER
============================================================ */

/*
 * GET /api/orders/:id
 *
 * IMPORTANT:
 * getOrderById always queries using userId validation.
 */
router.get(
  "/:id",
  getOrderById
);

export default router;