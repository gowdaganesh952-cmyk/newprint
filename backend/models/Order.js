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
   ORDER
============================================================ */
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
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
    shippingAddress: {
      type: addressSchema,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
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
    paymentMethod: {
      type: String,
      default: "Razorpay",
      trim: true,
    },
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
    paymentVerifiedAt: {
      type: Date,
      default: null,
    },
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
   MODEL
============================================================ */
const Order =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);

export default Order;