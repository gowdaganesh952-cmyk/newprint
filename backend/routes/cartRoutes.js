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

/* ============================================================
   ROUTER
============================================================ */

const router =
  express.Router();

/* ============================================================
   AUTHENTICATION
============================================================ */

/*
 * Every cart endpoint requires
 * an authenticated Clerk user.
 */

router.use(
  authenticateUser
);

/* ============================================================
   GET /api/cart
   DELETE /api/cart
============================================================ */

router
  .route("/")
  .get(getCart)
  .delete(clearCart);

/* ============================================================
   POST /api/cart/items
============================================================ */

/*
 * Add a product / variant
 * to the authenticated user's cart.
 *
 * Body example:
 *
 * {
 *   "productId": "...",
 *   "quantity": 2,
 *   "selections": {
 *     "Size": "M",
 *     "Color": "Black"
 *   }
 * }
 */

router.post(
  "/items",
  addItem
);

/* ============================================================
   PATCH /api/cart/items/:itemId
   DELETE /api/cart/items/:itemId
============================================================ */

/*
 * PATCH
 * Update quantity.
 *
 * DELETE
 * Remove cart item.
 */

router
  .route(
    "/items/:itemId"
  )
  .patch(
    updateItemQuantity
  )
  .delete(
    removeItem
  );

/* ============================================================
   POST /api/cart/merge
============================================================ */

/*
 * Merge the frontend guest cart
 * into the authenticated user's
 * server-side cart.
 */

router.post(
  "/merge",
  mergeCart
);

/* ============================================================
   POST /api/cart/print-image
============================================================ */

/*
 * Upload ONE customer print image.
 *
 * IMPORTANT:
 *
 * upload.single("image") uses the
 * updated multer middleware.
 *
 * Current upload limit:
 *
 *   10 MB per image
 *
 * The controller then uploads
 * the image to Cloudinary.
 *
 * Example FormData:
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
 * This endpoint does NOT decide
 * which physical product receives
 * the image.
 *
 * The frontend associates the
 * returned image with a printUnit.
 */

router.post(
  "/print-image",

  upload.single(
    "image"
  ),

  uploadPrintImage
);

/* ============================================================
   PATCH /api/cart/items/:itemId/print-customization
============================================================ */

/*
 * Save print images for every
 * physical product in the cart item.
 *
 * Body example:
 *
 * {
 *   "printUnits": [
 *     {
 *       "unitId": "unit_1",
 *       "images": [
 *         {
 *           "url": "...",
 *           "publicId": "..."
 *         }
 *       ]
 *     },
 *
 *     {
 *       "unitId": "unit_2",
 *       "images": [
 *         {
 *           "url": "...",
 *           "publicId": "..."
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * Rules enforced by controller:
 *
 * quantity = number of printUnits
 *
 * Every physical product:
 *
 *   minimum 1 image
 *   maximum 6 images
 *
 * Example:
 *
 * quantity = 2
 *
 * printUnits = 2
 *
 * Product 1 = 1–6 images
 * Product 2 = 1–6 images
 *
 * IMPORTANT:
 *
 * The customer never sends or
 * controls product weight here.
 *
 * Shipping is calculated on the
 * backend from the Product model.
 */

router.patch(
  "/items/:itemId/print-customization",

  updatePrintCustomization
);

/* ============================================================
   EXPORT
============================================================ */

export default router;