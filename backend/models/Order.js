import mongoose from "mongoose";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_PRINT_IMAGES = 6;

/* ============================================================
   PRINT IMAGE
============================================================ */

const printImageSchema =
    new mongoose.Schema(
        {
            /* ==================================================
               CLOUDINARY URL
            ================================================== */

            url: {
                type: String,

                required: true,

                trim: true,
            },

            /* ==================================================
               CLOUDINARY PUBLIC ID
            ================================================== */

            publicId: {
                type: String,

                required: true,

                trim: true,
            },
        },

        {
            /*
             * Do not create an _id
             * for every print image.
             */
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
 * quantity = 2
 *
 * printUnits = [
 *
 *     {
 *         unitId: "unit_1",
 *
 *         images: [
 *             image1,
 *             image2
 *         ]
 *     },
 *
 *     {
 *         unitId: "unit_2",
 *
 *         images: [
 *             image1
 *         ]
 *     }
 *
 * ]
 *
 * Each physical product:
 *
 * minimum 1 image
 * maximum 6 images
 */

const printUnitSchema =
    new mongoose.Schema(
        {
            /* ==================================================
               UNIT ID
            ================================================== */

            unitId: {
                type: String,

                required: true,

                trim: true,
            },

            /* ==================================================
               PRINT IMAGES
            ================================================== */

            images: {
                type: [
                    printImageSchema,
                ],

                default: [],

                validate: {
                    validator(
                        images
                    ) {
                        return (
                            Array.isArray(
                                images
                            ) &&
                            images.length >=
                                1 &&
                            images.length <=
                                MAX_PRINT_IMAGES
                        );
                    },

                    message:
                        `Each physical product must have 1 to ${MAX_PRINT_IMAGES} print images.`,
                },
            },
        },

        {
            /*
             * unitId is our own
             * stable identifier.
             */
            _id: false,
        }
    );

/* ============================================================
   ORDER ITEM
============================================================ */

const orderItemSchema =
    new mongoose.Schema(
        {
            /* ==================================================
               PRODUCT
            ================================================== */

            productId: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "Product",

                required: true,
            },

            /* ==================================================
               ITEM KEY
            ================================================== */

            itemKey: {
                type: String,

                required: true,

                trim: true,
            },

            /* ==================================================
               PRODUCT SNAPSHOT
            ================================================== */

            name: {
                type: String,

                required: true,

                trim: true,
            },

            image: {
                type: String,

                default: "",
            },

            /* ==================================================
               PRICE SNAPSHOT
            ================================================== */

            price: {
                type: Number,

                required: true,

                min: 0,
            },

            /* ==================================================
               QUANTITY
            ================================================== */

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

            /* ==================================================
               PRODUCT SELECTIONS
            ================================================== */

            selections: {
                type:
                    mongoose.Schema.Types.Mixed,

                default: {},
            },

            /* ==================================================
               PRINT UNITS
            ================================================== */

            printUnits: {
                type: [
                    printUnitSchema,
                ],

                required: true,

                validate: {
                    validator(
                        units
                    ) {
                        return (
                            Array.isArray(
                                units
                            ) &&
                            units.length >=
                                1
                        );
                    },

                    message:
                        "Order item must contain print units.",
                },
            },
        },

        {
            /*
             * Order item needs its own
             * MongoDB _id.
             */
            _id: true,
        }
    );

/* ============================================================
   ORDER SCHEMA
============================================================ */

const orderSchema =
    new mongoose.Schema(
        {
            /* ==================================================
               USER
            ================================================== */

            userId: {
                type: String,

                required: true,

                index: true,

                trim: true,
            },

            /* ==================================================
               ORDER NUMBER
            ================================================== */

            orderNumber: {
                type: String,

                required: true,

                unique: true,

                index: true,

                trim: true,
            },

            /* ==================================================
               ORDER ITEMS
            ================================================== */

            items: {
                type: [
                    orderItemSchema,
                ],

                required: true,

                validate: {
                    validator(
                        items
                    ) {
                        return (
                            Array.isArray(
                                items
                            ) &&
                            items.length > 0
                        );
                    },

                    message:
                        "An order must contain at least one item.",
                },
            },

            /* ==================================================
               SUBTOTAL
            ================================================== */

            subtotal: {
                type: Number,

                required: true,

                min: 0,
            },

            /* ==================================================
               DELIVERY FEE
            ================================================== */

            deliveryFee: {
                type: Number,

                required: true,

                min: 0,

                default: 0,
            },

            /* ==================================================
               TOTAL AMOUNT
            ================================================== */

            totalAmount: {
                type: Number,

                required: true,

                min: 0,
            },

            /* ==================================================
               CURRENCY
            ================================================== */

            currency: {
                type: String,

                required: true,

                uppercase: true,

                trim: true,

                default: "INR",
            },

            /* ==================================================
               ORDER STATUS
            ================================================== */

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

            /* ==================================================
               PAYMENT STATUS
            ================================================== */

            paymentStatus: {
                type: String,

                enum: [
                    "Pending",
                    "Paid",
                    "Failed",
                    "Refunded",
                ],

                default:
                    "Pending",

                index: true,
            },

            /* ==================================================
               RAZORPAY ORDER ID
            ================================================== */

            razorpayOrderId: {
                type: String,

                default: null,

                sparse: true,

                index: true,

                trim: true,
            },

            /* ==================================================
               RAZORPAY PAYMENT ID
            ================================================== */

            razorpayPaymentId: {
                type: String,

                default: null,

                sparse: true,

                index: true,

                trim: true,
            },

            /* ==================================================
               RAZORPAY SIGNATURE
            ================================================== */

            razorpaySignature: {
                type: String,

                default: null,

                trim: true,
            },

            /* ==================================================
               PAYMENT METHOD
            ================================================== */

            paymentMethod: {
                type: String,

                default: null,

                trim: true,
            },

            /* ==================================================
               PAYMENT VERIFIED TIME
            ================================================== */

            paymentVerifiedAt: {
                type: Date,

                default: null,
            },

            /* ==================================================
               RAZORPAY RECEIPT
            ================================================== */

            razorpayReceipt: {
                type: String,

                default: null,

                trim: true,
            },

            /* ==================================================
               SHIPPING ADDRESS SNAPSHOT
            ================================================== */

            shippingAddress: {
                type:
                    mongoose.Schema.Types.Mixed,

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