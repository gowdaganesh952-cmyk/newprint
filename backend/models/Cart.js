import mongoose from "mongoose";

/* ============================================================
   CONSTANTS
============================================================ */

/*
 * ONE physical product can have
 * maximum 6 print images.
 *
 * Example:
 *
 * quantity: 2
 *
 * Product 1:
 *   images: 1–6
 *
 * Product 2:
 *   images: 1–6
 */

const MAX_PRINT_IMAGES = 6;

/* ============================================================
   PRINT IMAGE SCHEMA
============================================================ */

const printImageSchema =
  new mongoose.Schema(
    {
      /*
       * Cloudinary secure URL.
       */

      url: {
        type: String,

        required: true,

        trim: true,
      },

      /*
       * Cloudinary public ID.
       *
       * Used later if an uploaded
       * image needs to be deleted.
       */

      publicId: {
        type: String,

        required: true,

        trim: true,
      },
    },

    {
      /*
       * Do not create a separate
       * MongoDB _id for every image.
       */

      _id: false,
    }
  );

/* ============================================================
   PRINT UNIT SCHEMA
============================================================ */

/*
 * IMPORTANT:
 *
 * ONE printUnit = ONE physical product.
 *
 * Example:
 *
 * quantity: 2
 *
 * printUnits: [
 *
 *   {
 *     unitId: "unit_xxx",
 *
 *     images: [
 *       { url, publicId },
 *       { url, publicId }
 *     ]
 *   },
 *
 *   {
 *     unitId: "unit_yyy",
 *
 *     images: [
 *       { url, publicId }
 *     ]
 *   }
 *
 * ]
 *
 *
 * Therefore:
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
 *
 * Each physical product:
 *
 * minimum:
 *   0 images while editing cart
 *
 * maximum:
 *   6 images
 *
 * The minimum 1 image requirement
 * is intentionally NOT enforced here.
 *
 * This allows a newly-added product
 * to exist in the cart before the
 * customer uploads their print image.
 *
 * The cart controller / checkout
 * validation will enforce:
 *
 *   minimum 1 image
 *   maximum 6 images
 */

const printUnitSchema =
  new mongoose.Schema(
    {
      /* ======================================================
         UNIT ID
      ====================================================== */

      unitId: {
        type: String,

        required: true,

        trim: true,
      },

      /* ======================================================
         PRINT IMAGES
      ====================================================== */

      images: {
        type: [
          printImageSchema,
        ],

        default: [],

        validate: {
          validator(images) {
            return (
              Array.isArray(
                images
              ) &&
              images.length <=
                MAX_PRINT_IMAGES
            );
          },

          message:
            `Maximum ${MAX_PRINT_IMAGES} print images are allowed per physical product.`,
        },
      },
    },

    {
      /*
       * printUnit itself does not
       * need an automatic MongoDB _id.
       *
       * unitId is our own stable
       * identifier.
       */

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
       * Identifies the exact
       * product + selected variant.
       *
       * Examples:
       *
       * productId
       *
       * productId|Size:M
       *
       * productId|Color:Black|Size:M
       *
       * The controller generates this
       * value from the validated
       * selections.
       */

      itemKey: {
        type: String,

        required: true,

        trim: true,
      },

      /* ======================================================
         PRODUCT INFORMATION SNAPSHOT
      ====================================================== */

      /*
       * Product name at the time the
       * item is stored in the cart.
       *
       * Controller reconciles this
       * with the current Product.
       */

      name: {
        type: String,

        required: true,

        trim: true,
      },

      /*
       * Main product image.
       *
       * This is only the normal product
       * image.
       *
       * Customer print images are stored
       * separately inside printUnits.
       */

      image: {
        type: String,

        default: "",
      },

      /* ======================================================
         PRICE
      ====================================================== */

      /*
       * Price of the exact selected
       * product / variant.
       *
       * Backend calculates and validates
       * this price.
       *
       * Never trust a frontend price.
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
       *
       * Stored as a Map in MongoDB.
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
       * Example:
       *
       * quantity = 1
       *
       * printUnits = [
       *   Product 1
       * ]
       *
       *
       * quantity = 2
       *
       * printUnits = [
       *   Product 1,
       *   Product 2
       * ]
       *
       *
       * quantity = 5
       *
       * printUnits = [
       *   Product 1,
       *   Product 2,
       *   Product 3,
       *   Product 4,
       *   Product 5
       * ]
       *
       *
       * Each physical product can have:
       *
       *   1–6 images before checkout.
       *
       * New products may temporarily
       * contain zero images until the
       * customer customizes them.
       *
       * The controller enforces the
       * minimum 1 image requirement
       * before checkout / saving final
       * customization.
       */

      printUnits: {
        type: [
          printUnitSchema,
        ],

        default: [],
      },
    },

    {
      /*
       * Cart item itself needs its
       * own _id because the frontend
       * and backend use it to update
       * quantity / remove an item.
       */

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
        type: [
          cartItemSchema,
        ],

        default: [],
      },
    },

    {
      /*
       * createdAt
       * updatedAt
       */

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