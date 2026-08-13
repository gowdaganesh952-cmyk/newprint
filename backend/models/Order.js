import mongoose from "mongoose";

/* ============================================================
   PRINT IMAGE
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
   PRINT UNIT
============================================================ */

/*
 * ONE printUnit = ONE physical product.
 *
 * Example:
 *
 * Product quantity = 2
 *
 * printUnits:
 *
 * [
 *   {
 *     unitId: "unit_1",
 *     images: [
 *       image1,
 *       image2
 *     ]
 *   },
 *
 *   {
 *     unitId: "unit_2",
 *     images: [
 *       image1
 *     ]
 *   }
 * ]
 *
 * These images are copied from the cart
 * into the permanent order snapshot.
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
              images.length >= 1 &&
              images.length <= 3
            );
          },

          message:
            "Each physical product must have 1 to 3 print images.",
        },
      },
    },
    {
      _id: false,
    }
  );

/* ============================================================
   ORDER ITEM
============================================================ */

const orderItemSchema =
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

      /*
       * Exact cart-line identifier.
       *
       * Useful when the same product has
       * different variants.
       */

      itemKey: {
        type: String,

        required: true,

        trim: true,
      },

      /* ======================================================
         PRODUCT SNAPSHOT
      ====================================================== */

      /*
       * These values are copied from the cart
       * when the order is created.
       *
       * The order should NOT depend on the
       * Product document changing later.
       */

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
         PRICE SNAPSHOT
      ====================================================== */

      price: {
        type: Number,

        required: true,

        min: 0,
      },

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
         VARIANT / SELECTION SNAPSHOT
      ====================================================== */

      selections: {
        type: mongoose.Schema.Types.Mixed,

        default: {},
      },

      /* ======================================================
         PRINT IMAGES
      ====================================================== */

      /*
       * IMPORTANT:
       *
       * This is the permanent copy of the
       * customer's uploaded print images.
       *
       * Cart can later be cleared.
       * Product can later be changed.
       *
       * The order still keeps the images
       * required for printing.
       */

      printUnits: {
        type: [printUnitSchema],

        required: true,

        validate: {
          validator(units) {
            return (
              Array.isArray(units) &&
              units.length >= 1
            );
          },

          message:
            "Order item must contain print units.",
        },
      },
    },
    {
      _id: true,
    }
  );

/* ============================================================
   ORDER SCHEMA
============================================================ */

const orderSchema =
  new mongoose.Schema(
    {
      /* ======================================================
         USER
      ====================================================== */

      userId: {
        type: String,

        required: true,

        index: true,

        trim: true,
      },

      /* ======================================================
         ORDER NUMBER
      ====================================================== */

      /*
       * Your own customer-facing order number.
       *
       * Example:
       *
       * NP10001
       */

      orderNumber: {
        type: String,

        required: true,

        unique: true,

        index: true,

        trim: true,
      },

      /* ======================================================
         ORDER ITEMS
      ====================================================== */

      items: {
        type: [orderItemSchema],

        required: true,

        validate: {
          validator(items) {
            return (
              Array.isArray(items) &&
              items.length > 0
            );
          },

          message:
            "An order must contain at least one item.",
        },
      },

      /* ======================================================
         AMOUNTS
      ====================================================== */

      subtotal: {
        type: Number,

        required: true,

        min: 0,
      },

      deliveryFee: {
        type: Number,

        required: true,

        min: 0,

        default: 0,
      },

      totalAmount: {
        type: Number,

        required: true,

        min: 0,
      },

      currency: {
        type: String,

        required: true,

        uppercase: true,

        trim: true,

        default: "INR",
      },

      /* ======================================================
         ORDER STATUS
      ====================================================== */

      /*
       * Payment status and order status are
       * intentionally separate.
       *
       * Example:
       *
       * paymentStatus = "Paid"
       * orderStatus = "Processing"
       */

      status: {
        type: String,

        enum: [
          "Pending Payment",
          "Processing",
          "Shipped",
          "Delivered",
          "Cancelled",
        ],

        default:
          "Pending Payment",

        index: true,
      },

      /* ======================================================
         PAYMENT STATUS
      ====================================================== */

      paymentStatus: {
        type: String,

        enum: [
          "Pending",
          "Paid",
          "Failed",
          "Refunded",
        ],

        default: "Pending",

        index: true,
      },

      /* ======================================================
         RAZORPAY
      ====================================================== */

      /*
       * Razorpay Order ID.
       *
       * Example:
       *
       * order_xxxxxxxxx
       */

      razorpayOrderId: {
        type: String,

        default: null,

        sparse: true,

        index: true,

        trim: true,
      },

      /*
       * Razorpay Payment ID.
       *
       * Example:
       *
       * pay_xxxxxxxxx
       */

      razorpayPaymentId: {
        type: String,

        default: null,

        sparse: true,

        index: true,

        trim: true,
      },

      /*
       * Signature returned by Razorpay Checkout.
       *
       * Stored for audit/reference.
       */

      razorpaySignature: {
        type: String,

        default: null,

        trim: true,
      },

      /*
       * Optional payment method snapshot.
       *
       * Example:
       *
       * upi
       * card
       * netbanking
       */

      paymentMethod: {
        type: String,

        default: null,

        trim: true,
      },

      /*
       * Time when our server verified
       * the Razorpay payment successfully.
       */

      paymentVerifiedAt: {
        type: Date,

        default: null,
      },

      /*
       * Razorpay receipt used while
       * creating the Razorpay Order.
       */

      razorpayReceipt: {
        type: String,

        default: null,

        trim: true,
      },

      /* ======================================================
         SHIPPING ADDRESS
      ====================================================== */

      /*
       * Snapshot the address at the time
       * the order is created.
       *
       * Do NOT rely on the user's current
       * Address document later.
       */

      shippingAddress: {
        type: mongoose.Schema.Types.Mixed,

        required: true,
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
  "Order",
  orderSchema
);