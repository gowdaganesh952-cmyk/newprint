import mongoose from "mongoose";
import crypto from "crypto";

import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Address from "../models/Address.js";
import Product from "../models/Product.js";

import razorpay from "../config/razorpay.js";

import {
    calculateCartShipping,
} from "../utils/shipping.js";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_PRINT_IMAGES = 6;

/*
 * Pending payment lifetime.
 *
 * This does NOT automatically cancel the order.
 * It is used to identify stale payment attempts.
 */
const PAYMENT_EXPIRY_MINUTES = 30;

/* ============================================================
   ORDER NUMBER
============================================================ */

function generateOrderNumber() {
    const date =
        new Date()
            .toISOString()
            .slice(0, 10)
            .replaceAll("-", "");

    const random =
        crypto
            .randomBytes(3)
            .toString("hex")
            .toUpperCase();

    return `NP-${date}-${random}`;
}

/* ============================================================
   CHECKOUT SESSION ID
============================================================ */

/*
 * The frontend may optionally send a checkoutSessionId.
 *
 * If it doesn't, we generate one here.
 *
 * This is used to prevent accidental duplicate orders when
 * the customer double-clicks Pay Now or the request is retried.
 */
function normalizeCheckoutSessionId(value) {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        return null;
    }

    const cleaned = value.trim();

    if (cleaned.length < 8 || cleaned.length > 120) {
        return null;
    }

    return cleaned;
}

/* ============================================================
   ROUND MONEY
============================================================ */

function roundMoney(amount) {
    return (
        Math.round(
            Number(amount) * 100
        ) / 100
    );
}

/* ============================================================
   CLEAN ADDRESS
============================================================ */

function createAddressSnapshot(address) {
    return {
        addressId:
            address._id?.toString(),

        fullName:
            address.fullName,

        phone:
            address.phone,

        email:
            address.email || "",

        addressLine1:
            address.addressLine1,

        addressLine2:
            address.addressLine2 || "",

        city:
            address.city,

        state:
            address.state,

        pincode:
            address.pincode,

        landmark:
            address.landmark || "",
    };
}

/* ============================================================
   NORMALIZE SELECTIONS
============================================================ */

function normalizeSelections(selections) {
    if (!selections) {
        return {};
    }

    if (
        selections instanceof Map
    ) {
        return Object.fromEntries(
            selections.entries()
        );
    }

    if (
        typeof selections === "object" &&
        !Array.isArray(selections)
    ) {
        return Object.fromEntries(
            Object.entries(selections).map(
                ([key, value]) => [
                    key,
                    String(value ?? ""),
                ]
            )
        );
    }

    return {};
}

/* ============================================================
   VALIDATE PRINT UNITS
============================================================ */

function validatePrintUnits(item) {
    const quantity =
        Number(item.quantity);

    const printUnits =
        Array.isArray(item.printUnits)
            ? item.printUnits
            : [];

    if (
        !Number.isInteger(quantity) ||
        quantity < 1
    ) {
        return {
            valid: false,
            message:
                `${item.name} has an invalid quantity.`,
        };
    }

    if (
        printUnits.length !== quantity
    ) {
        return {
            valid: false,
            message:
                `${item.name} requires ${quantity} separate print image unit${
                    quantity > 1 ? "s" : ""
                }.`,
        };
    }

    for (
        let index = 0;
        index < printUnits.length;
        index++
    ) {
        const unit =
            printUnits[index];

        const images =
            Array.isArray(unit?.images)
                ? unit.images
                : [];

        if (
            images.length < 1
        ) {
            return {
                valid: false,
                message:
                    `${item.name} - Product ${
                        index + 1
                    } requires at least 1 print image.`,
            };
        }

        if (
            images.length > MAX_PRINT_IMAGES
        ) {
            return {
                valid: false,
                message:
                    `${item.name} - Product ${
                        index + 1
                    } has more than ${MAX_PRINT_IMAGES} print images.`,
            };
        }

        for (
            const image of images
        ) {
            if (
                !image?.url ||
                !image?.publicId
            ) {
                return {
                    valid: false,
                    message:
                        `${item.name} - Product ${
                            index + 1
                        } contains an invalid print image.`,
                };
            }
        }
    }

    return {
        valid: true,
    };
}

/* ============================================================
   FIND VARIANT
============================================================ */

function findMatchingVariant(
    product,
    selections
) {
    const normalized =
        normalizeSelections(
            selections
        );

    return (
        product.variants?.find(
            (candidate) => {
                const candidateSelections =
                    normalizeSelections(
                        candidate.selections
                    );

                const candidateKeys =
                    Object.keys(
                        candidateSelections
                    );

                const selectionKeys =
                    Object.keys(
                        normalized
                    );

                if (
                    candidateKeys.length !==
                    selectionKeys.length
                ) {
                    return false;
                }

                return candidateKeys.every(
                    (key) =>
                        candidateSelections[key] ===
                        normalized[key]
                );
            }
        ) || null
    );
}

/* ============================================================
   BUILD PAYMENT ATTEMPT
============================================================ */

function buildPaymentAttempt(
    razorpayOrder
) {
    return {
        razorpayOrderId:
            razorpayOrder.id,

        amount:
            Number(razorpayOrder.amount) / 100,

        currency:
            razorpayOrder.currency || "INR",

        status:
            "Created",

        createdAt:
            new Date(),
    };
}

/* ============================================================
   GET ORDER STATS
============================================================ */

export const getOrderStats =
    async (
        req,
        res
    ) => {
        try {
            const userId =
                req.auth.userId;

            const [
                totalOrders,
                pendingOrders,
                completedOrders,
            ] = await Promise.all([
                Order.countDocuments({
                    userId,
                }),

                Order.countDocuments({
                    userId,

                    status: {
                        $in: [
                            "Not Completed",
                            "Confirmed",
                            "Shipped",
                        ],
                    },
                }),

                Order.countDocuments({
                    userId,

                    status:
                        "Delivered",
                }),
            ]);

            return res
                .status(200)
                .json({
                    success: true,

                    stats: {
                        totalOrders,

                        pendingOrders,

                        completedOrders,
                    },
                });
        } catch (error) {
            console.error(
                "Get Order Stats Error:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,

                    message:
                        "Failed to fetch order stats",
                });
        }
    };

/* ============================================================
   GET USER ORDERS
============================================================ */

export const getOrders =
    async (
        req,
        res
    ) => {
        try {
            const userId =
                req.auth.userId;

            const parsedLimit =
                parseInt(
                    req.query.limit,
                    10
                );

            const limit =
                Number.isInteger(
                    parsedLimit
                ) &&
                parsedLimit > 0
                    ? Math.min(
                          parsedLimit,
                          100
                      )
                    : 0;

            const ordersQuery =
                Order.find({
                    userId,
                }).sort({
                    createdAt:
                        -1,
                });

            if (
                limit > 0
            ) {
                ordersQuery.limit(
                    limit
                );
            }

            const orders =
                await ordersQuery;

            return res
                .status(200)
                .json({
                    success: true,

                    orders,
                });
        } catch (error) {
            console.error(
                "Get Orders Error:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,

                    message:
                        "Failed to fetch orders",
                });
        }
    };

/* ============================================================
   GET SINGLE USER ORDER
============================================================ */

export const getOrderById =
    async (
        req,
        res
    ) => {
        try {
            const userId =
                req.auth.userId;

            const orderId =
                req.params.id;

            if (
                !mongoose.Types.ObjectId.isValid(
                    orderId
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "Invalid order ID.",
                    });
            }

            const order =
                await Order.findOne({
                    _id:
                        orderId,

                    userId,
                });

            if (!order) {
                return res
                    .status(404)
                    .json({
                        success: false,

                        message:
                            "Order not found.",
                    });
            }

            return res
                .status(200)
                .json({
                    success: true,

                    order,
                });
        } catch (error) {
            console.error(
                "Get Order By ID Error:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,

                    message:
                        "Failed to fetch order details.",
                });
        }
    };

/* ============================================================
   CREATE PAYMENT ORDER
============================================================ */

export const createPaymentOrder =
    async (
        req,
        res
    ) => {
        try {
            const userId =
                req.auth.userId;

            /* ==================================================
               RAZORPAY CONFIG
            ================================================== */

            if (
                !process.env.RAZORPAY_KEY_ID ||
                !process.env.RAZORPAY_KEY_SECRET
            ) {
                console.error(
                    "Razorpay credentials are missing."
                );

                return res
                    .status(500)
                    .json({
                        success: false,

                        message:
                            "Payment gateway is not configured.",
                    });
            }

            const {
                addressId,
                orderId,
                checkoutSessionId:
                    bodyCheckoutSessionId,
            } = req.body || {};

            /* ==================================================
               RETRY EXISTING ORDER
            ================================================== */

            if (orderId) {
                if (
                    !mongoose.Types.ObjectId.isValid(
                        orderId
                    )
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,

                            message:
                                "Invalid order ID.",
                        });
                }

                const existingOrder =
                    await Order.findOne({
                        _id:
                            orderId,

                        userId,
                    });

                if (!existingOrder) {
                    return res
                        .status(404)
                        .json({
                            success: false,

                            message:
                                "Order not found.",
                        });
                }

                /*
                 * A paid/confirmed order must NEVER be
                 * paid again through the retry endpoint.
                 */
                if (
                    existingOrder.paymentStatus ===
                        "Paid" ||
                    existingOrder.status !==
                        "Not Completed"
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,

                            message:
                                "This order is no longer available for payment retry.",
                        });
                }

                /*
                 * Do not create unlimited simultaneous
                 * Razorpay attempts for the same order.
                 *
                 * If the latest attempt is still very recent,
                 * return it instead of creating another one.
                 */
                const latestAttempt =
                    existingOrder
                        .paymentAttempts?.[
                        existingOrder
                            .paymentAttempts
                            .length - 1
                    ];

                if (
                    latestAttempt?.razorpayOrderId &&
                    latestAttempt.status ===
                        "Created"
                ) {
                    const age =
                        Date.now() -
                        new Date(
                            latestAttempt.createdAt
                        ).getTime();

                    if (
                        age <
                        2 * 60 * 1000
                    ) {
                        return res
                            .status(200)
                            .json({
                                success: true,

                                message:
                                    "Payment attempt is already active.",

                                order: {
                                    id:
                                        existingOrder._id,

                                    orderNumber:
                                        existingOrder.orderNumber,

                                    subtotal:
                                        existingOrder.subtotal,

                                    deliveryFee:
                                        existingOrder.deliveryFee,

                                    totalAmount:
                                        existingOrder.totalAmount,

                                    currency:
                                        existingOrder.currency,

                                    status:
                                        existingOrder.status,

                                    paymentStatus:
                                        existingOrder.paymentStatus,
                                },

                                razorpay: {
                                    keyId:
                                        process.env
                                            .RAZORPAY_KEY_ID,

                                    orderId:
                                        latestAttempt.razorpayOrderId,

                                    amount:
                                        Math.round(
                                            Number(
                                                latestAttempt.amount
                                            ) * 100
                                        ),

                                    currency:
                                        latestAttempt.currency ||
                                        "INR",
                                },
                            });
                    }
                }

                const razorpayAmount =
                    Math.round(
                        Number(
                            existingOrder.totalAmount
                        ) * 100
                    );

                if (
                    !Number.isInteger(
                        razorpayAmount
                    ) ||
                    razorpayAmount <= 0
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,

                            message:
                                "Invalid payment amount.",
                        });
                }

                let razorpayOrder;

                try {
                    razorpayOrder =
                        await razorpay.orders.create({
                            amount:
                                razorpayAmount,

                            currency:
                                existingOrder.currency ||
                                "INR",

                            receipt:
                                existingOrder.orderNumber,

                            notes: {
                                orderNumber:
                                    existingOrder.orderNumber,

                                userId,

                                orderId:
                                    existingOrder._id.toString(),

                                isRetry:
                                    "true",
                            },
                        });
                } catch (razorpayError) {
                    console.error(
                        "Razorpay Retry Order Creation Error:",
                        razorpayError
                    );

                    return res
                        .status(502)
                        .json({
                            success: false,

                            message:
                                "Unable to start payment retry. Please try again.",
                        });
                }

                existingOrder.razorpayOrderId =
                    razorpayOrder.id;

                existingOrder.paymentStatus =
                    "Pending";

                existingOrder.paymentExpiresAt =
                    new Date(
                        Date.now() +
                            PAYMENT_EXPIRY_MINUTES *
                                60 *
                                1000
                    );

                existingOrder.paymentAttempts.push(
                    buildPaymentAttempt(
                        razorpayOrder
                    )
                );

                await existingOrder.save();

                return res
                    .status(200)
                    .json({
                        success: true,

                        message:
                            "Payment retry initiated successfully.",

                        order: {
                            id:
                                existingOrder._id,

                            orderNumber:
                                existingOrder.orderNumber,

                            subtotal:
                                existingOrder.subtotal,

                            deliveryFee:
                                existingOrder.deliveryFee,

                            totalAmount:
                                existingOrder.totalAmount,

                            currency:
                                existingOrder.currency,

                            status:
                                existingOrder.status,

                            paymentStatus:
                                existingOrder.paymentStatus,
                        },

                        razorpay: {
                            keyId:
                                process.env
                                    .RAZORPAY_KEY_ID,

                            orderId:
                                razorpayOrder.id,

                            amount:
                                razorpayOrder.amount,

                            currency:
                                razorpayOrder.currency,
                        },
                    });
            }

            /* ==================================================
               ADDRESS
            ================================================== */

            if (!addressId) {
                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "Delivery address is required.",
                    });
            }

            if (
                !mongoose.Types.ObjectId.isValid(
                    addressId
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "Invalid delivery address.",
                    });
            }

            const address =
                await Address.findOne({
                    _id:
                        addressId,

                    userId,
                });

            if (!address) {
                return res
                    .status(404)
                    .json({
                        success: false,

                        message:
                            "Delivery address not found.",
                    });
            }

            /* ==================================================
               CART
            ================================================== */

            const cart =
                await Cart.findOne({
                    userId,
                });

            if (
                !cart ||
                !Array.isArray(
                    cart.items
                ) ||
                cart.items.length ===
                    0
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "Your cart is empty.",
                    });
            }

            /* ==================================================
               CHECKOUT SESSION
            ================================================== */

            let checkoutSessionId =
                normalizeCheckoutSessionId(
                    bodyCheckoutSessionId
                );

            if (
                !checkoutSessionId
            ) {
                checkoutSessionId =
                    crypto.randomUUID();
            }

            /*
             * If this checkout session already produced an
             * unfinished order, reuse it instead of creating
             * another order.
             */
            const existingSessionOrder =
                await Order.findOne({
                    userId,

                    checkoutSessionId,

                    status:
                        "Not Completed",
                }).sort({
                    createdAt:
                        -1,
                });

            if (
                existingSessionOrder &&
                existingSessionOrder.paymentStatus !==
                    "Paid"
            ) {
                /*
                 * If it already has a recent active Razorpay
                 * attempt, return it.
                 */
                const latestAttempt =
                    existingSessionOrder
                        .paymentAttempts?.[
                        existingSessionOrder
                            .paymentAttempts
                            .length - 1
                    ];

                if (
                    latestAttempt?.razorpayOrderId &&
                    latestAttempt.status ===
                        "Created"
                ) {
                    const age =
                        Date.now() -
                        new Date(
                            latestAttempt.createdAt
                        ).getTime();

                    if (
                        age <
                        2 * 60 * 1000
                    ) {
                        return res
                            .status(200)
                            .json({
                                success: true,

                                message:
                                    "Payment attempt is already active.",

                                order: {
                                    id:
                                        existingSessionOrder._id,

                                    orderNumber:
                                        existingSessionOrder.orderNumber,

                                    subtotal:
                                        existingSessionOrder.subtotal,

                                    deliveryFee:
                                        existingSessionOrder.deliveryFee,

                                    totalAmount:
                                        existingSessionOrder.totalAmount,

                                    currency:
                                        existingSessionOrder.currency,

                                    status:
                                        existingSessionOrder.status,

                                    paymentStatus:
                                        existingSessionOrder.paymentStatus,
                                },

                                razorpay: {
                                    keyId:
                                        process.env
                                            .RAZORPAY_KEY_ID,

                                    orderId:
                                        latestAttempt.razorpayOrderId,

                                    amount:
                                        Math.round(
                                            Number(
                                                latestAttempt.amount
                                            ) * 100
                                        ),

                                    currency:
                                        latestAttempt.currency ||
                                        "INR",
                                },
                            });
                    }
                }
            }

            /* ==================================================
               PREPARE ORDER ITEMS
            ================================================== */

            const orderItems =
                [];

            const shippingItems =
                [];

            /*
             * Keep the cart item keys so the cart can later
             * remove ONLY the items that were purchased.
             */
            const purchasedCartItemKeys =
                [];

            /* ==================================================
               VALIDATE EVERY CART ITEM
            ================================================== */

            for (
                const item of
                    cart.items
            ) {
                const quantity =
                    Number(
                        item.quantity
                    );

                if (
                    !Number.isInteger(
                        quantity
                    ) ||
                    quantity < 1
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,

                            message:
                                `${item.name} has an invalid quantity.`,
                        });
                }

                /* ----------------------------------------------
                   PRINT VALIDATION
                ---------------------------------------------- */

                const printValidation =
                    validatePrintUnits(
                        item
                    );

                if (
                    !printValidation.valid
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,

                            message:
                                printValidation.message,
                        });
                }

                /* ----------------------------------------------
                   PRODUCT
                ---------------------------------------------- */

                const product =
                    await Product.findById(
                        item.productId
                    );

                if (!product) {
                    return res
                        .status(400)
                        .json({
                            success: false,

                            message:
                                `${item.name} is no longer available.`,
                        });
                }

                if (
                    product.status !==
                    "active"
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,

                            message:
                                `${product.name} is currently unavailable.`,
                        });
                }

                /* ----------------------------------------------
                   CURRENT PRICE
                ---------------------------------------------- */

                let currentPrice =
                    null;

                /* ----------------------------------------------
                   FIXED PRODUCT
                ---------------------------------------------- */

                if (
                    product.pricingType ===
                    "fixed"
                ) {
                    currentPrice =
                        Number(
                            product.price
                        );

                    if (
                        !Number.isFinite(
                            currentPrice
                        ) ||
                        currentPrice < 0
                    ) {
                        return res
                            .status(400)
                            .json({
                                success: false,

                                message:
                                    `${product.name} has an invalid price.`,
                            });
                    }

                    if (
                        Number(
                            product.stock
                        ) < quantity
                    ) {
                        return res
                            .status(400)
                            .json({
                                success: false,

                                message:
                                    `${product.name} has only ${
                                        product.stock
                                    } item${
                                        Number(
                                            product.stock
                                        ) === 1
                                            ? ""
                                            : "s"
                                    } left in stock.`,
                            });
                    }
                }

                /* ----------------------------------------------
                   VARIANT PRODUCT
                ---------------------------------------------- */

                else if (
                    product.pricingType ===
                    "variants"
                ) {
                    const selections =
                        normalizeSelections(
                            item.selections
                        );

                    const variant =
                        findMatchingVariant(
                            product,
                            selections
                        );

                    if (!variant) {
                        return res
                            .status(400)
                            .json({
                                success: false,

                                message:
                                    `${product.name} selected variant is no longer available.`,
                            });
                    }

                    if (
                        variant.status !==
                        "active"
                    ) {
                        return res
                            .status(400)
                            .json({
                                success: false,

                                message:
                                    `${product.name} selected variant is inactive.`,
                            });
                    }

                    if (
                        Number(
                            variant.stock
                        ) < quantity
                    ) {
                        return res
                            .status(400)
                            .json({
                                success: false,

                                message:
                                    `${product.name} has only ${
                                        variant.stock
                                    } item${
                                        Number(
                                            variant.stock
                                        ) === 1
                                            ? ""
                                            : "s"
                                    } left in the selected variant.`,
                            });
                    }

                    currentPrice =
                        Number(
                            variant.price
                        );

                    if (
                        !Number.isFinite(
                            currentPrice
                        ) ||
                        currentPrice < 0
                    ) {
                        return res
                            .status(400)
                            .json({
                                success: false,

                                message:
                                    `${product.name} has an invalid variant price.`,
                            });
                    }
                }

                /* ----------------------------------------------
                   UNKNOWN PRICING TYPE
                ---------------------------------------------- */

                else {
                    return res
                        .status(400)
                        .json({
                            success: false,

                            message:
                                `${product.name} has an invalid pricing configuration.`,
                        });
                }

                /* ----------------------------------------------
                   CLEAN PRINT UNITS
                ---------------------------------------------- */

                const cleanPrintUnits =
                    item.printUnits.map(
                        (unit) => ({
                            unitId:
                                String(
                                    unit.unitId
                                ),

                            images:
                                unit.images.map(
                                    (image) => ({
                                        url:
                                            String(
                                                image.url
                                            ),

                                        publicId:
                                            String(
                                                image.publicId
                                            ),
                                    })
                                ),
                        })
                    );

                orderItems.push({
                    productId:
                        product._id,

                    itemKey:
                        item.itemKey || "",

                    name:
                        product.name,

                    image:
                        product.images?.[0] ||
                        item.image ||
                        "",

                    price:
                        currentPrice,

                    quantity,

                    selections:
                        normalizeSelections(
                            item.selections
                        ),

                    printUnits:
                        cleanPrintUnits,
                });

                shippingItems.push({
                    productWeight:
                        Number(
                            product.weight
                        ) || 100,

                    quantity,
                });

                if (
                    item.itemKey
                ) {
                    purchasedCartItemKeys.push(
                        String(
                            item.itemKey
                        )
                    );
                }
            }

            /* ==================================================
               SUBTOTAL
            ================================================== */

            const subtotal =
                roundMoney(
                    orderItems.reduce(
                        (
                            total,
                            item
                        ) =>
                            total +
                            Number(
                                item.price
                            ) *
                                Number(
                                    item.quantity
                                ),
                        0
                    )
                );

            /* ==================================================
               SHIPPING
            ================================================== */

            const {
                totalWeight,
                shippingCharge,
            } =
                calculateCartShipping(
                    shippingItems
                );

            /* ==================================================
               TOTAL
            ================================================== */

            const totalAmount =
                roundMoney(
                    subtotal +
                        shippingCharge
                );

            if (
                !Number.isFinite(
                    totalAmount
                ) ||
                totalAmount <= 0
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "Invalid order amount.",
                    });
            }

            /* ==================================================
               ORDER NUMBER
            ================================================== */

            let orderNumber =
                null;

            for (
                let attempt = 0;
                attempt < 10;
                attempt++
            ) {
                const candidate =
                    generateOrderNumber();

                const exists =
                    await Order.exists({
                        orderNumber:
                            candidate,
                    });

                if (!exists) {
                    orderNumber =
                        candidate;

                    break;
                }
            }

            if (!orderNumber) {
                return res
                    .status(500)
                    .json({
                        success: false,

                        message:
                            "Unable to generate order number.",
                    });
            }

            /* ==================================================
               CREATE ORDER
            ================================================== */

            const newOrder =
                await Order.create({
                    userId,

                    orderNumber,

                    checkoutSessionId,

                    items:
                        orderItems,

                    subtotal,

                    deliveryFee:
                        shippingCharge,

                    totalAmount,

                    currency:
                        "INR",

                    status:
                        "Not Completed",

                    paymentStatus:
                        "Pending",

                    paymentExpiresAt:
                        new Date(
                            Date.now() +
                                PAYMENT_EXPIRY_MINUTES *
                                    60 *
                                    1000
                        ),

                    shippingAddress:
                        createAddressSnapshot(
                            address
                        ),
                });

            /* ==================================================
               RAZORPAY AMOUNT
            ================================================== */

            const razorpayAmount =
                Math.round(
                    totalAmount * 100
                );

            if (
                !Number.isInteger(
                    razorpayAmount
                ) ||
                razorpayAmount <= 0
            ) {
                await Order.findByIdAndDelete(
                    newOrder._id
                );

                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "Invalid payment amount.",
                    });
            }

            /* ==================================================
               CREATE RAZORPAY ORDER
            ================================================== */

            let razorpayOrder;

            try {
                razorpayOrder =
                    await razorpay.orders.create({
                        amount:
                            razorpayAmount,

                        currency:
                            "INR",

                        receipt:
                            orderNumber,

                        notes: {
                            orderNumber,

                            userId,

                            orderId:
                                newOrder._id.toString(),

                            totalWeight:
                                String(
                                    totalWeight
                                ),

                            shippingCharge:
                                String(
                                    shippingCharge
                                ),
                        },
                    });
            } catch (
                razorpayError
            ) {
                console.error(
                    "Razorpay Order Creation Error:",
                    razorpayError
                );

                await Order.findByIdAndUpdate(
                    newOrder._id,
                    {
                        paymentStatus:
                            "Failed",

                        paymentFailureReason:
                            "Razorpay order creation failed.",
                    }
                );

                return res
                    .status(502)
                    .json({
                        success: false,

                        message:
                            "Unable to start payment. Please try again.",
                    });
            }

            /* ==================================================
               SAVE RAZORPAY DETAILS
            ================================================== */

            newOrder.razorpayOrderId =
                razorpayOrder.id;

            newOrder.razorpayReceipt =
                orderNumber;

            newOrder.paymentAttempts.push(
                buildPaymentAttempt(
                    razorpayOrder
                )
            );

            await newOrder.save();

            /* ==================================================
               RESPONSE
            ================================================== */

            return res
                .status(201)
                .json({
                    success: true,

                    message:
                        "Payment order created successfully.",

                    order: {
                        id:
                            newOrder._id,

                        orderNumber:
                            newOrder.orderNumber,

                        subtotal:
                            newOrder.subtotal,

                        deliveryFee:
                            newOrder.deliveryFee,

                        totalAmount:
                            newOrder.totalAmount,

                        currency:
                            newOrder.currency,

                        status:
                            newOrder.status,

                        paymentStatus:
                            newOrder.paymentStatus,
                    },

                    shipping: {
                        totalWeight,

                        shippingCharge,
                    },

                    razorpay: {
                        keyId:
                            process.env
                                .RAZORPAY_KEY_ID,

                        orderId:
                            razorpayOrder.id,

                        amount:
                            razorpayOrder.amount,

                        currency:
                            razorpayOrder.currency,
                    },
                });
        } catch (error) {
            console.error(
                "Create Payment Order Error:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,

                    message:
                        "Failed to create payment order.",
                });
        }
    };

/* ============================================================
   DEDUCT STOCK INSIDE TRANSACTION
============================================================ */

async function deductStockForOrder(
    order,
    session
) {
    for (
        const item of order.items
    ) {
        const quantity =
            Number(
                item.quantity
            );

        if (
            !Number.isInteger(
                quantity
            ) ||
            quantity < 1
        ) {
            throw new Error(
                `Invalid quantity for ${item.name}.`
            );
        }

        const product =
            await Product.findById(
                item.productId
            ).session(
                session
            );

        if (!product) {
            throw new Error(
                `${item.name} is no longer available.`
            );
        }

        if (
            product.status !==
            "active"
        ) {
            throw new Error(
                `${product.name} is currently unavailable.`
            );
        }

        /* ======================================================
           VARIANT
        ====================================================== */

        if (
            product.pricingType ===
            "variants"
        ) {
            const selections =
                normalizeSelections(
                    item.selections
                );

            const variant =
                findMatchingVariant(
                    product,
                    selections
                );

            if (!variant) {
                throw new Error(
                    `${product.name} selected variant is no longer available.`
                );
            }

            if (
                variant.status !==
                "active"
            ) {
                throw new Error(
                    `${product.name} selected variant is inactive.`
                );
            }

            const result =
                await Product.updateOne(
                    {
                        _id:
                            product._id,

                        variants: {
                            $elemMatch: {
                                _id:
                                    variant._id,

                                status:
                                    "active",

                                stock: {
                                    $gte:
                                        quantity,
                                },
                            },
                        },
                    },

                    {
                        $inc: {
                            "variants.$.stock":
                                -quantity,
                        },
                    },

                    {
                        session,
                    }
                );

            if (
                result.modifiedCount !==
                1
            ) {
                throw new Error(
                    `${product.name} does not have enough stock for the selected variant.`
                );
            }
        }

        /* ======================================================
           FIXED PRODUCT
        ====================================================== */

        else if (
            product.pricingType ===
            "fixed"
        ) {
            const result =
                await Product.updateOne(
                    {
                        _id:
                            product._id,

                        status:
                            "active",

                        stock: {
                            $gte:
                                quantity,
                        },
                    },

                    {
                        $inc: {
                            stock:
                                -quantity,
                        },
                    },

                    {
                        session,
                    }
                );

            if (
                result.modifiedCount !==
                1
            ) {
                throw new Error(
                    `${product.name} does not have enough stock.`
                );
            }
        }

        else {
            throw new Error(
                `${product.name} has an invalid pricing configuration.`
            );
        }
    }
}

/* ============================================================
   CLEAR PURCHASED CART ITEMS
============================================================ */

async function clearPurchasedCartItems(
    userId,
    order,
    session
) {
    const itemKeys =
        order.items
            .map(
                (item) =>
                    item.itemKey
                        ? String(
                              item.itemKey
                          )
                        : null
            )
            .filter(Boolean);

    /*
     * If cart itemKey values exist, remove only those items.
     *
     * This prevents a new cart item added in another tab
     * from being deleted after an old payment completes.
     */
    if (
        itemKeys.length > 0
    ) {
        await Cart.updateOne(
            {
                userId,
            },

            {
                $pull: {
                    items: {
                        itemKey: {
                            $in:
                                itemKeys,
                        },
                    },
                },
            },

            {
                session,
            }
        );

        return;
    }

    /*
     * Fallback for older cart items without itemKey.
     *
     * We deliberately do NOT empty the entire cart.
     *
     * The controller cannot safely identify legacy cart
     * entries without itemKey, so they are left untouched.
     */
}

/* ============================================================
   FIND ORDER FOR RAZORPAY ORDER
============================================================ */

async function findOrderForRazorpayOrder(
    razorpayOrderId,
    userId = null
) {
    if (
        !razorpayOrderId
    ) {
        return null;
    }

    const directFilter = {
        razorpayOrderId,
    };

    if (userId) {
        directFilter.userId =
            userId;
    }

    let order =
        await Order.findOne(
            directFilter
        );

    if (order) {
        return order;
    }

    /*
     * Also search paymentAttempts because a retry may have
     * created a Razorpay order that is no longer the latest
     * razorpayOrderId stored on the parent order.
     */
    const attemptFilter = {
        "paymentAttempts.razorpayOrderId":
            razorpayOrderId,
    };

    if (userId) {
        attemptFilter.userId =
            userId;
    }

    order =
        await Order.findOne(
            attemptFilter
        );

    return order;
}

/* ============================================================
   UPDATE PAYMENT ATTEMPT
============================================================ */

function updatePaymentAttempt(
    order,
    razorpayOrderId,
    updates
) {
    if (
        !Array.isArray(
            order.paymentAttempts
        )
    ) {
        order.paymentAttempts =
            [];
    }

    const attempt =
        order.paymentAttempts.find(
            (entry) =>
                entry.razorpayOrderId ===
                razorpayOrderId
        );

    if (
        attempt
    ) {
        Object.assign(
            attempt,
            updates
        );

        return attempt;
    }

    return null;
}

/* ============================================================
   PROCESS SUCCESSFUL PAYMENT
============================================================ */

/*
 * This is the central payment-processing function.
 *
 * It is used by:
 *
 * 1. Frontend payment verification
 * 2. Razorpay webhook reconciliation
 *
 * Keeping both paths on the same function prevents the two
 * systems from having different business logic.
 */

export async function processSuccessfulPayment({
    order,
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature = null,
    source = "client",
}) {
    if (
        !order ||
        !razorpayPaymentId ||
        !razorpayOrderId
    ) {
        throw new Error(
            "Incomplete payment information."
        );
    }

    /*
     * The Razorpay order ID MUST belong to this order.
     */
    const matchingAttempt =
        order.paymentAttempts?.find(
            (attempt) =>
                attempt.razorpayOrderId ===
                razorpayOrderId
        );

    if (
        !matchingAttempt &&
        order.razorpayOrderId !==
            razorpayOrderId
    ) {
        throw new Error(
            "Razorpay order does not belong to this order."
        );
    }

    /*
     * If this exact payment was already processed,
     * return success immediately.
     *
     * This makes verification idempotent.
     */
    if (
        order.paymentStatus ===
            "Paid" &&
        order.razorpayPaymentId ===
            razorpayPaymentId
    ) {
        return {
            success: true,
            alreadyProcessed: true,
            paymentReceived: true,
            order,
        };
    }

    /*
     * Never allow a second different payment to overwrite
     * an already paid order.
     */
    if (
        order.paymentStatus ===
            "Paid"
    ) {
        return {
            success: true,
            alreadyProcessed: true,
            paymentReceived: true,
            order,
        };
    }

    /*
     * Validate Razorpay order amount from the server.
     */
    let razorpayOrder;

    try {
        razorpayOrder =
            await razorpay.orders.fetch(
                razorpayOrderId
            );
    } catch (error) {
        console.error(
            "Failed to fetch Razorpay order:",
            error
        );

        throw new Error(
            "Unable to confirm payment order with Razorpay."
        );
    }

    const expectedAmount =
        Math.round(
            Number(
                order.totalAmount
            ) * 100
        );

    if (
        Number(
            razorpayOrder.amount
        ) !==
        expectedAmount
    ) {
        throw new Error(
            "Razorpay payment amount does not match the order amount."
        );
    }

    if (
        String(
            razorpayOrder.currency
        ).toUpperCase() !==
        String(
            order.currency || "INR"
        ).toUpperCase()
    ) {
        throw new Error(
            "Razorpay payment currency does not match the order currency."
        );
    }

    /*
     * Fetch the payment itself when possible.
     *
     * This provides an additional server-side confirmation
     * that the payment belongs to the Razorpay order.
     */
    let razorpayPayment = null;

    try {
        razorpayPayment =
            await razorpay.payments.fetch(
                razorpayPaymentId
            );
    } catch (error) {
        console.error(
            "Failed to fetch Razorpay payment:",
            error
        );

        throw new Error(
            "Unable to confirm payment status with Razorpay."
        );
    }

    if (
        !razorpayPayment ||
        razorpayPayment.order_id !==
            razorpayOrderId
    ) {
        throw new Error(
            "Razorpay payment does not belong to the supplied Razorpay order."
        );
    }

    if (
        razorpayPayment.status !==
        "captured"
    ) {
        throw new Error(
            `Payment is not captured. Current Razorpay payment status: ${razorpayPayment.status}.`
        );
    }

    if (
        Number(
            razorpayPayment.amount
        ) !== expectedAmount
    ) {
        throw new Error(
            "Captured payment amount does not match the order amount."
        );
    }

    /* ========================================================
       ATOMIC DATABASE OPERATION
    ======================================================== */

    const session =
        await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(
            async () => {
                const lockedOrder =
                    await Order.findOne({
                        _id:
                            order._id,

                        paymentStatus: {
                            $ne:
                                "Paid",
                        },
                    }).session(
                        session
                    );

                /*
                 * Another request/webhook may have completed
                 * the payment while this request was running.
                 */
                if (
                    !lockedOrder
                ) {
                    result = {
                        success:
                            true,

                        alreadyProcessed:
                            true,

                        paymentReceived:
                            true,

                        order:
                            await Order.findById(
                                order._id
                            ).session(
                                session
                            ),
                    };

                    return;
                }

                /*
                 * Deduct ALL stock inside the transaction.
                 *
                 * If ANY product fails, the entire transaction
                 * rolls back.
                 */
                try {
                    await deductStockForOrder(
                        lockedOrder,
                        session
                    );
                } catch (
                    stockError
                ) {
                    /*
                     * Payment is already captured.
                     *
                     * Do NOT mark payment Failed.
                     *
                     * We leave the order Pending so a separate
                     * refund/support workflow can resolve it.
                     */
                    lockedOrder.razorpayPaymentId =
                        razorpayPaymentId;

                    lockedOrder.razorpaySignature =
                        razorpaySignature;

                    lockedOrder.paymentFailureCode =
                        "STOCK_UNAVAILABLE_AFTER_PAYMENT";

                    lockedOrder.paymentFailureReason =
                        stockError.message;

                    lockedOrder.paymentStatus =
                        "Pending";

                    lockedOrder.status =
                        "Not Completed";

                    lockedOrder.paymentVerifiedAt =
                        null;

                    lockedOrder.paidAt =
                        null;

                    updatePaymentAttempt(
                        lockedOrder,
                        razorpayOrderId,
                        {
                            razorpayPaymentId,
                            razorpaySignature,
                            status:
                                "Paid",
                            failureCode:
                                "STOCK_UNAVAILABLE_AFTER_PAYMENT",
                            failureReason:
                                stockError.message,
                        }
                    );

                    await lockedOrder.save({
                        session,
                    });

                    throw Object.assign(
                        new Error(
                            "Payment was received, but stock became unavailable. The payment requires refund/support resolution."
                        ),
                        {
                            code:
                                "STOCK_UNAVAILABLE_AFTER_PAYMENT",
                        }
                    );
                }

                const now =
                    new Date();

                lockedOrder.razorpayOrderId =
                    razorpayOrderId;

                lockedOrder.razorpayPaymentId =
                    razorpayPaymentId;

                lockedOrder.razorpaySignature =
                    razorpaySignature;

                lockedOrder.paymentStatus =
                    "Paid";

                lockedOrder.status =
                    "Confirmed";

                lockedOrder.paymentVerifiedAt =
                    now;

                lockedOrder.paidAt =
                    now;

                lockedOrder.paymentFailureCode =
                    null;

                lockedOrder.paymentFailureReason =
                    null;

                lockedOrder.paymentExpiresAt =
                    null;

                updatePaymentAttempt(
                    lockedOrder,
                    razorpayOrderId,
                    {
                        razorpayPaymentId,
                        razorpaySignature,
                        status:
                            "Paid",
                        paidAt:
                            now,
                        failureCode:
                            null,
                        failureReason:
                            null,
                    }
                );

                await clearPurchasedCartItems(
                    lockedOrder.userId,
                    lockedOrder,
                    session
                );

                await lockedOrder.save({
                    session,
                });

                result = {
                    success: true,

                    alreadyProcessed:
                        false,

                    paymentReceived:
                        true,

                    order:
                        lockedOrder,
                };
            }
        );

        return result;
    } finally {
        await session.endSession();
    }
}

/* ============================================================
   VERIFY RAZORPAY PAYMENT
============================================================ */

export const verifyPayment =
    async (
        req,
        res
    ) => {
        try {
            const userId =
                req.auth.userId;

            const {
                razorpay_payment_id:
                    razorpayPaymentId,

                razorpay_order_id:
                    razorpayOrderId,

                razorpay_signature:
                    razorpaySignature,
            } = req.body || {};

            /*
             * IMPORTANT:
             *
             * Do NOT accept payment_status / error_code from
             * the browser as authoritative payment state.
             *
             * A customer closing Razorpay does NOT mean the
             * payment failed.
             */

            if (
                !razorpayPaymentId ||
                !razorpayOrderId ||
                !razorpaySignature
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "Incomplete Razorpay payment response.",
                    });
            }

            /* ==================================================
               FIND ORDER
            ================================================== */

            const order =
                await findOrderForRazorpayOrder(
                    razorpayOrderId,
                    userId
                );

            if (!order) {
                return res
                    .status(404)
                    .json({
                        success: false,

                        message:
                            "Order associated with this payment was not found.",
                    });
            }

            /* ==================================================
               VERIFY OWNERSHIP
            ================================================== */

            if (
                order.userId !==
                userId
            ) {
                return res
                    .status(403)
                    .json({
                        success: false,

                        message:
                            "You are not allowed to verify this payment.",
                    });
            }

            /* ==================================================
               VERIFY SIGNATURE
            ================================================== */

            const body =
                `${razorpayOrderId}|${razorpayPaymentId}`;

            const expectedSignature =
                crypto
                    .createHmac(
                        "sha256",
                        process.env
                            .RAZORPAY_KEY_SECRET
                    )
                    .update(body)
                    .digest("hex");

            const receivedBuffer =
                Buffer.from(
                    String(
                        razorpaySignature
                    ),
                    "utf8"
                );

            const expectedBuffer =
                Buffer.from(
                    expectedSignature,
                    "utf8"
                );

            const signatureMatches =
                receivedBuffer.length ===
                    expectedBuffer.length &&
                crypto.timingSafeEqual(
                    receivedBuffer,
                    expectedBuffer
                );

            if (
                !signatureMatches
            ) {
                console.error(
                    "Razorpay signature verification failed.",
                    {
                        orderId:
                            order._id.toString(),

                        razorpayOrderId,
                    }
                );

                /*
                 * DO NOT mark payment Failed here.
                 *
                 * Invalid signature means this response cannot
                 * be trusted. It does not prove that Razorpay
                 * payment failed.
                 */
                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "Payment verification failed.",
                    });
            }

            /* ==================================================
               PROCESS PAYMENT
            ================================================== */

            try {
                const result =
                    await processSuccessfulPayment({
                        order,

                        razorpayPaymentId,

                        razorpayOrderId,

                        razorpaySignature,

                        source:
                            "client",
                    });

                if (
                    result.success
                ) {
                    return res
                        .status(200)
                        .json({
                            success:
                                true,

                            message:
                                result.alreadyProcessed
                                    ? "Payment was already verified."
                                    : "Payment verified successfully.",

                            order: {
                                id:
                                    result.order
                                        ?._id,

                                orderNumber:
                                    result.order
                                        ?.orderNumber,

                                status:
                                    result.order
                                        ?.status,

                                paymentStatus:
                                    result.order
                                        ?.paymentStatus,
                            },
                        });
                }
            } catch (
                paymentError
            ) {
                if (
                    paymentError.code ===
                    "STOCK_UNAVAILABLE_AFTER_PAYMENT"
                ) {
                    console.error(
                        "Captured payment but stock was unavailable:",
                        {
                            orderId:
                                order._id.toString(),

                            razorpayPaymentId,

                            razorpayOrderId,
                        }
                    );

                    return res
                        .status(409)
                        .json({
                            success:
                                false,

                            paymentReceived:
                                true,

                            requiresRefund:
                                true,

                            message:
                                "Payment was received, but the item became unavailable. Your payment requires refund processing.",

                            order: {
                                id:
                                    order._id,

                                orderNumber:
                                    order.orderNumber,

                                status:
                                    order.status,

                                paymentStatus:
                                    order.paymentStatus,
                            },
                        });
                }

                throw paymentError;
            }

            return res
                .status(500)
                .json({
                    success: false,

                    message:
                        "Unable to complete payment processing.",
                });
        } catch (error) {
            console.error(
                "Verify Razorpay Payment Error:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,

                    message:
                        "Failed to verify payment.",
                });
        }
    };

/* ============================================================
   RAZORPAY WEBHOOK PAYMENT RECONCILIATION
============================================================ */

/*
 * This function is intentionally exported separately.
 *
 * The webhook route will call this after verifying the
 * Razorpay webhook signature.
 *
 * IMPORTANT:
 * The webhook route itself must receive the RAW request body
 * before express.json() parses it.
 */

export async function reconcileRazorpayPayment(
    razorpayPaymentId,
    razorpayOrderId
) {
    const order =
        await findOrderForRazorpayOrder(
            razorpayOrderId
        );

    if (!order) {
        throw new Error(
            `No local order found for Razorpay order ${razorpayOrderId}.`
        );
    }

    return processSuccessfulPayment({
        order,

        razorpayPaymentId,

        razorpayOrderId,

        razorpaySignature:
            null,

        source:
            "webhook",
    });
}

/* ============================================================
   ADMIN: GET ALL ORDERS
============================================================ */

export const getAdminOrders =
    async (
        req,
        res
    ) => {
        try {
            const {
                limit,
                status,
                paymentStatus,
            } = req.query;

            const filter =
                {};

            if (
                status
            ) {
                filter.status =
                    status;
            }

            if (
                paymentStatus
            ) {
                filter.paymentStatus =
                    paymentStatus;
            }

            const ordersQuery =
                Order.find(
                    filter
                ).sort({
                    createdAt:
                        -1,
                });

            const parsedLimit =
                parseInt(
                    limit,
                    10
                );

            if (
                Number.isInteger(
                    parsedLimit
                ) &&
                parsedLimit > 0
            ) {
                ordersQuery.limit(
                    Math.min(
                        parsedLimit,
                        100
                    )
                );
            }

            const orders =
                await ordersQuery;

            return res
                .status(200)
                .json({
                    success:
                        true,

                    orders,
                });
        } catch (error) {
            console.error(
                "Get Admin Orders Error:",
                error
            );

            return res
                .status(500)
                .json({
                    success:
                        false,

                    message:
                        "Failed to fetch admin orders",
                });
        }
    };

/* ============================================================
   ADMIN: GET ORDER STATS
============================================================ */

export const getAdminOrderStats =
    async (
        req,
        res
    ) => {
        try {
            const [
                totalOrders,
                notCompleted,
                confirmed,
                shipped,
                delivered,
                cancelled,
                paymentPending,
                paymentPaid,
                paymentFailed,
                paymentCancelled,
                paymentRefunded,
            ] = await Promise.all([
                Order.countDocuments(),

                Order.countDocuments({
                    status:
                        "Not Completed",
                }),

                Order.countDocuments({
                    status:
                        "Confirmed",
                }),

                Order.countDocuments({
                    status:
                        "Shipped",
                }),

                Order.countDocuments({
                    status:
                        "Delivered",
                }),

                Order.countDocuments({
                    status:
                        "Cancelled",
                }),

                Order.countDocuments({
                    paymentStatus:
                        "Pending",
                }),

                Order.countDocuments({
                    paymentStatus:
                        "Paid",
                }),

                Order.countDocuments({
                    paymentStatus:
                        "Failed",
                }),

                Order.countDocuments({
                    paymentStatus:
                        "Cancelled",
                }),

                Order.countDocuments({
                    paymentStatus:
                        "Refunded",
                }),
            ]);

            const revenueResult =
                await Order.aggregate([
                    {
                        $match: {
                            paymentStatus:
                                "Paid",
                        },
                    },

                    {
                        $group: {
                            _id:
                                null,

                            totalRevenue: {
                                $sum:
                                    "$totalAmount",
                            },
                        },
                    },
                ]);

            const totalRevenue =
                revenueResult.length >
                0
                    ? Number(
                          revenueResult[0]
                              .totalRevenue
                      )
                    : 0;

            return res
                .status(200)
                .json({
                    success:
                        true,

                    stats: {
                        totalOrders,

                        orderStatus: {
                            notCompleted,

                            confirmed,

                            shipped,

                            delivered,

                            cancelled,
                        },

                        paymentStatus: {
                            pending:
                                paymentPending,

                            paid:
                                paymentPaid,

                            failed:
                                paymentFailed,

                            cancelled:
                                paymentCancelled,

                            refunded:
                                paymentRefunded,
                        },

                        totalRevenue,
                    },
                });
        } catch (error) {
            console.error(
                "Get Admin Order Stats Error:",
                error
            );

            return res
                .status(500)
                .json({
                    success:
                        false,

                    message:
                        "Failed to fetch admin order stats",
                });
        }
    };

/* ============================================================
   ADMIN: GET ORDER BY ID
============================================================ */

export const getAdminOrderById =
    async (
        req,
        res
    ) => {
        try {
            const orderId =
                req.params.id;

            if (
                !mongoose.Types.ObjectId.isValid(
                    orderId
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Invalid order ID.",
                    });
            }

            const order =
                await Order.findById(
                    orderId
                );

            if (!order) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        message:
                            "Order not found.",
                    });
            }

            return res
                .status(200)
                .json({
                    success:
                        true,

                    order,
                });
        } catch (error) {
            console.error(
                "Get Admin Order By ID Error:",
                error
            );

            return res
                .status(500)
                .json({
                    success:
                        false,

                    message:
                        "Failed to fetch admin order details.",
                });
        }
    };

/* ============================================================
   ADMIN: UPDATE ORDER STATUS
============================================================ */

export const updateOrderStatusAdmin =
    async (
        req,
        res
    ) => {
        try {
            const orderId =
                req.params.id;

            const {
                status,
                consignmentNumber,
                trackingUrl,
                shippingNotes,
            } = req.body || {};

            if (
                !mongoose.Types.ObjectId.isValid(
                    orderId
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Invalid order ID.",
                    });
            }

            const order =
                await Order.findById(
                    orderId
                );

            if (!order) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        message:
                            "Order not found.",
                    });
            }

            /* ==================================================
               CONFIRMED -> SHIPPED
            ================================================== */

            if (
                status ===
                "Shipped"
            ) {
                /*
                 * Payment MUST be Paid before shipping.
                 */
                if (
                    order.paymentStatus !==
                    "Paid"
                ) {
                    return res
                        .status(400)
                        .json({
                            success:
                                false,

                            message:
                                "Cannot ship an order until payment is confirmed as Paid.",
                        });
                }

                if (
                    order.status !==
                    "Confirmed"
                ) {
                    return res
                        .status(400)
                        .json({
                            success:
                                false,

                            message:
                                `Cannot mark as Shipped from current status: ${order.status}. Order must be Confirmed first.`,
                        });
                }

                if (
                    typeof consignmentNumber !==
                        "string" ||
                    !consignmentNumber.trim()
                ) {
                    return res
                        .status(400)
                        .json({
                            success:
                                false,

                            message:
                                "Consignment number is required to mark an order as shipped.",
                        });
                }

                order.status =
                    "Shipped";

                order.shippingProvider =
                    "India Post";

                order.consignmentNumber =
                    consignmentNumber.trim();

                order.shippedAt =
                    new Date();

                if (
                    typeof trackingUrl ===
                        "string" &&
                    trackingUrl.trim()
                ) {
                    order.trackingUrl =
                        trackingUrl.trim();
                }

                if (
                    typeof shippingNotes ===
                        "string" &&
                    shippingNotes.trim()
                ) {
                    order.shippingNotes =
                        shippingNotes.trim();
                }

                await order.save();

                return res
                    .status(200)
                    .json({
                        success:
                            true,

                        message:
                            "Order marked as Shipped successfully.",

                        order,
                    });
            }

            /* ==================================================
               SHIPPED -> DELIVERED
            ================================================== */

            if (
                status ===
                "Delivered"
            ) {
                if (
                    order.status !==
                    "Shipped"
                ) {
                    return res
                        .status(400)
                        .json({
                            success:
                                false,

                            message:
                                `Cannot mark as Delivered from current status: ${order.status}. Order must be Shipped first.`,
                        });
                }

                order.status =
                    "Delivered";

                order.deliveredAt =
                    new Date();

                if (
                    typeof shippingNotes ===
                        "string" &&
                    shippingNotes.trim()
                ) {
                    order.shippingNotes =
                        shippingNotes.trim();
                }

                await order.save();

                return res
                    .status(200)
                    .json({
                        success:
                            true,

                        message:
                            "Order marked as Delivered successfully.",

                        order,
                    });
            }

            return res
                .status(400)
                .json({
                    success:
                        false,

                    message:
                        "Invalid status update requested. Allowed transitions: Confirmed -> Shipped, Shipped -> Delivered.",
                });
        } catch (error) {
            console.error(
                "Update Order Status Admin Error:",
                error
            );

            return res
                .status(500)
                .json({
                    success:
                        false,

                    message:
                        "Failed to update order status.",
                });
        }
    };