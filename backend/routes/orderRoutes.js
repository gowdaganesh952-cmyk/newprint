import express from "express";

import {
  authenticateUser,
} from "../middleware/authMiddleware.js";

import {
  getOrders,
  getOrderStats,
  getOrderById,
  createPaymentOrder,
  verifyPayment,
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
   ORDER STATS
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
 * Body:
 *
 * {
 *   addressId: "..."
 * }
 *
 * Backend calculates:
 *
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
 * Body:
 *
 * {
 *   razorpay_payment_id,
 *   razorpay_order_id,
 *   razorpay_signature
 * }
 *
 * Backend:
 *
 * 1. Finds the user's order
 * 2. Verifies Razorpay signature
 * 3. Marks payment as Paid
 * 4. Changes order status to Processing
 * 5. Clears the cart
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
 *
 * Optional:
 *
 * GET /api/orders?limit=10
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
 *
 * getOrderById must always query using:
 *
 * {
 *   _id: req.params.id,
 *   userId: req.auth.userId
 * }
 *
 * This prevents one user from reading
 * another user's order.
 */
router.get(
  "/:id",
  getOrderById
);

export default router;