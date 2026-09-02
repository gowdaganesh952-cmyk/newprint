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
  updateOrderStatusAdmin,
} from "../controllers/orderController.js";

const router = express.Router();

/* ============================================================
   AUTHENTICATION
============================================================ */

/*
 * Every order-related endpoint requires
 * an authenticated Clerk user.
 *
 * This protects:
 * - customer orders
 * - payment creation
 * - payment verification
 * - order statistics
 * - admin routes
 */
router.use(authenticateUser);

/* ============================================================
   ADMIN ROUTES
============================================================ */

/*
 * IMPORTANT:
 * These routes must stay ABOVE /:id.
 *
 * Admin access is protected by requireAdmin.
 */

/* GET /api/orders/admin/stats */
router.get(
  "/admin/stats",
  requireAdmin,
  getAdminOrderStats
);

/* GET /api/orders/admin */
router.get(
  "/admin",
  requireAdmin,
  getAdminOrders
);

/* GET /api/orders/admin/:id */
router.get(
  "/admin/:id",
  requireAdmin,
  getAdminOrderById
);

/* PATCH /api/orders/admin/:id/status */
router.patch(
  "/admin/:id/status",
  requireAdmin,
  updateOrderStatusAdmin
);

/* ============================================================
   CUSTOMER ORDER STATS
============================================================ */

/*
 * GET /api/orders/stats
 *
 * IMPORTANT:
 * Keep this BEFORE /:id.
 */
router.get(
  "/stats",
  getOrderStats
);

/* ============================================================
   CREATE RAZORPAY PAYMENT ORDER
============================================================ */

/*
 * POST /api/orders/create-payment
 *
 * The backend must calculate:
 *
 * - cart contents
 * - product prices
 * - quantities
 * - selections
 * - print units
 * - subtotal
 * - delivery fee
 * - final amount
 *
 * NEVER trust an amount sent by the frontend.
 */
router.post(
  "/create-payment",
  createPaymentOrder
);

/* ============================================================
   VERIFY RAZORPAY PAYMENT
============================================================ */

/*
 * POST /api/orders/verify-payment
 *
 * Backend must verify the Razorpay signature.
 *
 * Only after successful server-side verification:
 *
 * paymentStatus -> Paid
 * status        -> Confirmed
 *
 * Failed/cancelled payments must NOT become confirmed orders.
 */
router.post(
  "/verify-payment",
  verifyPayment
);

/* ============================================================
   CUSTOMER ORDERS
============================================================ */

/*
 * GET /api/orders
 *
 * Controller must return ONLY orders belonging
 * to the authenticated Clerk user.
 */
router.get(
  "/",
  getOrders
);

/* ============================================================
   CUSTOMER SINGLE ORDER
============================================================ */

/*
 * GET /api/orders/:id
 *
 * Controller MUST verify:
 *
 * order._id + authenticated userId
 *
 * so one customer cannot access another customer's order.
 *
 * IMPORTANT:
 * This route must remain LAST because /:id
 * catches any unmatched path.
 */
router.get(
  "/:id",
  getOrderById
);

/* ============================================================
   EXPORT
============================================================ */

export default router;