import mongoose from "mongoose";

/* ============================================================
   PRINT IMAGE SCHEMA
============================================================ */

const printImageSchema = new mongoose.Schema(
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
  { _id: false }
);

/* ============================================================
   PRINT UNIT SCHEMA
============================================================ */

const printUnitSchema = new mongoose.Schema(
  {
    unitId: {
      type: String,
      required: true,
      trim: true,
    },

    images: {
      type: [printImageSchema],
      default: [],
    },
  },
  { _id: false }
);

/* ============================================================
   ORDER ITEM
============================================================ */

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    itemKey: {
      type: String,
      trim: true,
      default: "",
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    selections: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    printUnits: {
      type: [printUnitSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

/* ============================================================
   SHIPPING ADDRESS
============================================================ */

const addressSchema = new mongoose.Schema(
  {
    addressId: {
      type: String,
      trim: true,
      default: "",
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      default: "",
    },

    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },

    addressLine2: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },

    landmark: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/* ============================================================
   PAYMENT ATTEMPT SCHEMA

   Every Razorpay payment attempt is stored separately.

   Example:

   Attempt 1 → Razorpay Order A → Failed
   Attempt 2 → Razorpay Order B → Paid

   This prevents a retry from destroying the history
   of the previous payment attempt.
============================================================ */

const paymentAttemptSchema = new mongoose.Schema(
  {
    razorpayOrderId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    razorpaySignature: {
      type: String,
      default: null,
      trim: true,
    },

    razorpayReceipt: {
      type: String,
      default: null,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      trim: true,
      uppercase: true,
    },

    status: {
      type: String,
      enum: [
        "Created",
        "Pending",
        "Paid",
        "Failed",
        "Cancelled",
        "Refunded",
      ],
      default: "Created",
      index: true,
      trim: true,
    },

    failureCode: {
      type: String,
      default: null,
      trim: true,
    },

    failureReason: {
      type: String,
      default: null,
      trim: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: true,
  }
);

/* ============================================================
   ORDER
============================================================ */

const orderSchema = new mongoose.Schema(
  {
    /* ========================================================
       USER
    ======================================================== */

    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    /* ========================================================
       ORDER NUMBER
    ======================================================== */

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    /* ========================================================
       CHECKOUT SESSION / IDEMPOTENCY

       Used by the backend to prevent accidental duplicate
       orders when the customer double-clicks Pay Now or
       retries because of a network problem.
    ======================================================== */

    checkoutSessionId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    /* ========================================================
       ORDER ITEMS
    ======================================================== */

    items: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },

        message: "Order must contain at least one item.",
      },
    },

    /* ========================================================
       SHIPPING ADDRESS
    ======================================================== */

    shippingAddress: {
      type: addressSchema,
      required: true,
    },

    /* ========================================================
       MONEY
    ======================================================== */

    currency: {
      type: String,
      default: "INR",
      trim: true,
      uppercase: true,
    },

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

    /* ========================================================
       ORDER STATUS

       Payment is NOT the same thing as order status.

       Not Completed → payment not completed yet
       Confirmed     → payment completed
       Shipped       → shipped
       Delivered     → delivered
       Cancelled     → order cancelled
    ======================================================== */

    status: {
      type: String,

      enum: [
        "Not Completed",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],

      default: "Not Completed",

      index: true,

      trim: true,
    },

    /* ========================================================
       PAYMENT STATUS
    ======================================================== */

    paymentStatus: {
      type: String,

      enum: [
        "Pending",
        "Paid",
        "Failed",
        "Cancelled",
        "Refunded",
      ],

      default: "Pending",

      index: true,

      trim: true,
    },

    /* ========================================================
       PAYMENT METHOD
    ======================================================== */

    paymentMethod: {
      type: String,
      default: "Razorpay",
      trim: true,
    },

    /* ========================================================
       PAYMENT ATTEMPTS

       Important for retry handling.
    ======================================================== */

    paymentAttempts: {
      type: [paymentAttemptSchema],
      default: [],
    },

    /* ========================================================
       CURRENT / LAST RAZORPAY ORDER

       Kept for compatibility with your existing code.

       This represents the latest payment attempt.
       The complete history is stored in paymentAttempts.
    ======================================================== */

    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
      trim: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    razorpaySignature: {
      type: String,
      default: null,
      trim: true,
    },

    razorpayReceipt: {
      type: String,
      default: null,
      trim: true,
    },

    /* ========================================================
       PAYMENT DATES
    ======================================================== */

    paymentVerifiedAt: {
      type: Date,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    paymentExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    /* ========================================================
       PAYMENT ERROR INFORMATION

       Useful when Razorpay returns a failed/cancelled
       payment attempt.
    ======================================================== */

    paymentFailureCode: {
      type: String,
      default: null,
      trim: true,
    },

    paymentFailureReason: {
      type: String,
      default: null,
      trim: true,
    },

    /* ========================================================
       REFUND INFORMATION
    ======================================================== */

    refundId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    refundStatus: {
      type: String,
      enum: [
        "Not Initiated",
        "Pending",
        "Processed",
        "Failed",
      ],
      default: "Not Initiated",
      trim: true,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    refundReason: {
      type: String,
      default: null,
      trim: true,
    },

    /* ========================================================
       ORDER CANCELLATION / EXPIRATION
    ======================================================== */

    cancelledAt: {
      type: Date,
      default: null,
    },

    expiredAt: {
      type: Date,
      default: null,
    },

    /* ========================================================
       SHIPPING
    ======================================================== */

    shippingProvider: {
      type: String,
      default: "India Post",
      trim: true,
    },

    consignmentNumber: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    trackingUrl: {
      type: String,
      default: null,
      trim: true,
    },

    shippedAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    shippingNotes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ============================================================
   INDEXES
============================================================ */

/*
 * Quickly find all orders belonging to a user.
 */
orderSchema.index({
  userId: 1,
  createdAt: -1,
});

/*
 * Quickly find pending payments that may need
 * reconciliation/expiry processing.
 */
orderSchema.index({
  paymentStatus: 1,
  paymentExpiresAt: 1,
});

/*
 * Useful for webhook/payment reconciliation.
 */
orderSchema.index({
  razorpayOrderId: 1,
  paymentStatus: 1,
});

/*
 * Useful when searching by Razorpay payment ID.
 */
orderSchema.index({
  razorpayPaymentId: 1,
});

/*
 * Prevent the same checkout session from creating
 * duplicate orders for the same user.

 * sparse allows older orders without checkoutSessionId.
 */
orderSchema.index(
  {
    userId: 1,
    checkoutSessionId: 1,
  },
  {
    unique: true,
    sparse: true,
  }
);

/* ============================================================
   MODEL
============================================================ */

const Order =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);

export default Order;