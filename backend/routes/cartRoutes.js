import express from "express";

import {
  authenticateUser,
} from "../middleware/authMiddleware.js";

import {
  upload,
} from "../middleware/uploadMiddleware.js";

import {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  mergeCart,

  uploadPrintImage,
  updatePrintCustomization,
} from "../controllers/cartController.js";

const router =
  express.Router();

/* ============================================================
   AUTHENTICATION
============================================================ */

/*
 * Every cart endpoint requires
 * the user to be authenticated.
 */

router.use(
  authenticateUser
);

/* ============================================================
   CART
============================================================ */

/*
 * GET /api/cart
 *
 * Get current user's cart.
 *
 * DELETE /api/cart
 *
 * Clear current user's cart.
 */

router
  .route("/")
  .get(getCart)
  .delete(clearCart);

/* ============================================================
   ADD CART ITEM
============================================================ */

/*
 * POST /api/cart/items
 */

router
  .route("/items")
  .post(addItem);

/* ============================================================
   UPDATE / REMOVE CART ITEM
============================================================ */

/*
 * PATCH /api/cart/items/:itemId
 *
 * Update quantity.
 *
 * DELETE /api/cart/items/:itemId
 *
 * Remove item.
 */

router
  .route("/items/:itemId")
  .patch(updateItemQuantity)
  .delete(removeItem);

/* ============================================================
   MERGE GUEST CART
============================================================ */

/*
 * POST /api/cart/merge
 */

router.post(
  "/merge",
  mergeCart
);

/* ============================================================
   UPLOAD PRINT IMAGE
============================================================ */

/*
 * POST /api/cart/print-image
 *
 * Upload ONE image.
 *
 * FormData:
 *
 * image = File
 *
 * Response:
 *
 * {
 *   success: true,
 *   image: {
 *     url: "...",
 *     publicId: "..."
 *   }
 * }
 *
 * IMPORTANT:
 *
 * This only uploads the image to
 * Cloudinary.
 *
 * It does NOT decide which
 * product/unit receives the image.
 *
 * The frontend handles that.
 */

router.post(
  "/print-image",

  upload.single("image"),

  uploadPrintImage
);

/* ============================================================
   SAVE PRINT CUSTOMIZATION
============================================================ */

/*
 * PATCH
 * /api/cart/items/:itemId/print-customization
 *
 * Body:
 *
 * {
 *   printUnits: [
 *     {
 *       unitId: "...",
 *       images: [
 *         {
 *           url: "...",
 *           publicId: "..."
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * Rules:
 *
 * - printUnits count must equal quantity
 * - every product needs minimum 1 image
 * - every product can have maximum 3 images
 */

router.patch(
  "/items/:itemId/print-customization",

  updatePrintCustomization
);

/* ============================================================
   EXPORT
============================================================ */

export default router;