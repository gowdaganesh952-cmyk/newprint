import mongoose from "mongoose";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_PRINT_IMAGES = 3;

/* ============================================================
   PRINT IMAGE SCHEMA
============================================================ */

const printImageSchema =
  new mongoose.Schema(
    {
      url: {
        type: String,
        required: true,
        trim: true,
      },

      publicId: {
        type: String,
        required: true,
        trim: true,
      },
    },
    {
      _id: false,
    }
  );

/* ============================================================
   PRINT UNIT SCHEMA
============================================================ */

/*
 * ONE printUnit = ONE physical product.
 *
 * Example:
 *
 * quantity: 2
 *
 * printUnits: [
 *   {
 *     unitId: "unit_xxx",
 *     images: [
 *       { url, publicId },
 *       { url, publicId }
 *     ]
 *   },
 *
 *   {
 *     unitId: "unit_yyy",
 *     images: [
 *       { url, publicId }
 *     ]
 *   }
 * ]
 *
 * Product 1 and Product 2 therefore
 * have completely separate images.
 */

const printUnitSchema =
  new mongoose.Schema(
    {
      unitId: {
        type: String,
        required: true,
        trim: true,
      },

      images: {
        type: [printImageSchema],

        default: [],

        validate: {
          validator(images) {
            return (
              Array.isArray(images) &&
              images.length <=
                MAX_PRINT_IMAGES
            );
          },

          message:
            `Maximum ${MAX_PRINT_IMAGES} print images are allowed per product.`,
        },
      },
    },

    {
      _id: false,
    }
  );

/* ============================================================
   CART ITEM SCHEMA
============================================================ */

const cartItemSchema =
  new mongoose.Schema(
    {
      /* ======================================================
         PRODUCT
      ====================================================== */

      productId: {
        type: mongoose.Schema.Types.ObjectId,

        ref: "Product",

        required: true,
      },

      /* ======================================================
         ITEM KEY
      ====================================================== */

      /*
       * Identifies the exact product + variant.
       *
       * Example:
       *
       * productId
       *
       * productId|Capacity:500ml
       *
       * productId|Capacity:1000ml
       */

      itemKey: {
        type: String,

        required: true,

        trim: true,
      },

      /* ======================================================
         PRODUCT INFORMATION SNAPSHOT
      ====================================================== */

      name: {
        type: String,

        required: true,

        trim: true,
      },

      image: {
        type: String,

        default: "",
      },

      /* ======================================================
         PRICE
      ====================================================== */

      /*
       * Price of the exact selected
       * product variant.
       */

      price: {
        type: Number,

        required: true,

        min: 0,
      },

      /* ======================================================
         QUANTITY
      ====================================================== */

      quantity: {
        type: Number,

        required: true,

        min: 1,

        validate: {
          validator:
            Number.isInteger,

          message:
            "Quantity must be an integer.",
        },
      },

      /* ======================================================
         PRODUCT SELECTIONS
      ====================================================== */

      /*
       * Example:
       *
       * {
       *   Size: "M",
       *   Color: "Black"
       * }
       */

      selections: {
        type: Map,

        of: String,

        default: {},
      },

      /* ======================================================
         PRINT UNITS
      ====================================================== */

      /*
       * IMPORTANT:
       *
       * There is ONE printUnit for
       * EVERY physical product.
       *
       * quantity = 1
       * printUnits.length = 1
       *
       * quantity = 2
       * printUnits.length = 2
       *
       * quantity = 3
       * printUnits.length = 3
       *
       * Each unit can contain
       * maximum 3 images.
       *
       * Minimum 1 image is NOT enforced
       * at MongoDB schema level because
       * newly added products initially
       * have zero images.
       *
       * The cart/checkout controller
       * will enforce minimum 1 image
       * before checkout.
       */

      printUnits: {
        type: [printUnitSchema],

        default: [],
      },
    },

    {
      _id: true,
    }
  );

/* ============================================================
   CART SCHEMA
============================================================ */

const cartSchema =
  new mongoose.Schema(
    {
      /* ======================================================
         USER
      ====================================================== */

      userId: {
        type: String,

        required: true,

        unique: true,

        index: true,

        trim: true,
      },

      /* ======================================================
         ITEMS
      ====================================================== */

      items: {
        type: [cartItemSchema],

        default: [],
      },
    },

    {
      timestamps: true,
    }
  );

/* ============================================================
   EXPORT
============================================================ */

export default mongoose.model(
  "Cart",
  cartSchema
);