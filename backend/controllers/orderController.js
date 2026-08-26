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

/* ============================================================
   ORDER NUMBER
============================================================ */

function generateOrderNumber() {
    const date =
        new Date()
            .toISOString()
            .slice(0, 10)
            .replaceAll(
                "-",
                ""
            );

    const random =
        crypto
            .randomBytes(3)
            .toString("hex")
            .toUpperCase();

    return `NP-${date}-${random}`;
}

/* ============================================================
   ROUND MONEY
============================================================ */

function roundMoney(
    amount
) {
    return (
        Math.round(
            Number(amount) * 100
        ) / 100
    );
}

/* ============================================================
   CLEAN ADDRESS
============================================================ */

function createAddressSnapshot(
    address
) {
    return {
        addressId:
            address._id?.toString(),

        fullName:
            address.fullName,

        phone:
            address.phone,

        addressLine1:
            address.addressLine1,

        addressLine2:
            address.addressLine2 ||
            "",

        city:
            address.city,

        state:
            address.state,

        pincode:
            address.pincode,

        landmark:
            address.landmark ||
            "",
    };
}

/* ============================================================
   NORMALIZE SELECTIONS
============================================================ */

function normalizeSelections(
    selections
) {
    if (!selections) {
        return {};
    }

    if (
        selections instanceof
        Map
    ) {
        return Object.fromEntries(
            selections.entries()
        );
    }

    if (
        typeof selections ===
            "object" &&
        !Array.isArray(
            selections
        )
    ) {
        return Object.fromEntries(
            Object.entries(
                selections
            ).map(
                (
                    [
                        key,
                        value,
                    ]
                ) => [
                    key,
                    String(
                        value ??
                            ""
                    ),
                ]
            )
        );
    }

    return {};
}

/* ============================================================
   VALIDATE PRINT UNITS
============================================================ */

function validatePrintUnits(
    item
) {
    const quantity =
        Number(
            item.quantity
        );

    const printUnits =
        Array.isArray(
            item.printUnits
        )
            ? item.printUnits
            : [];

    /* ----------------------------------------------------------
       QUANTITY / UNIT COUNT
    ---------------------------------------------------------- */

    if (
        !Number.isInteger(
            quantity
        ) ||
        quantity < 1
    ) {
        return {
            valid: false,

            message:
                `${item.name} has an invalid quantity.`,
        };
    }

    if (
        printUnits.length !==
        quantity
    ) {
        return {
            valid: false,

            message:
                `${item.name} requires ${quantity} separate print image unit${
                    quantity > 1
                        ? "s"
                        : ""
                }.`,
        };
    }

    /* ----------------------------------------------------------
       EACH PHYSICAL PRODUCT
    ---------------------------------------------------------- */

    for (
        let index = 0;
        index <
        printUnits.length;
        index++
    ) {
        const unit =
            printUnits[index];

        const images =
            Array.isArray(
                unit?.images
            )
                ? unit.images
                : [];

        /* ------------------------------------------------------
           MINIMUM
        ------------------------------------------------------ */

        if (
            images.length <
            1
        ) {
            return {
                valid: false,

                message:
                    `${item.name} - Product ${
                        index + 1
                    } requires at least 1 print image.`,
            };
        }

        /* ------------------------------------------------------
           MAXIMUM
        ------------------------------------------------------ */

        if (
            images.length >
            MAX_PRINT_IMAGES
        ) {
            return {
                valid: false,

                message:
                    `${item.name} - Product ${
                        index + 1
                    } has more than ${MAX_PRINT_IMAGES} print images.`,
            };
        }

        /* ------------------------------------------------------
           IMAGE VALIDATION
        ------------------------------------------------------ */

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

            const totalOrders =
                await Order.countDocuments(
                    {
                        userId,
                    }
                );

            const pendingOrders =
                await Order.countDocuments(
                    {
                        userId,

                        status: {
                            $in: [
                                "Pending Payment",
                                "Processing",
                                "Shipped",
                            ],
                        },
                    }
                );

            const completedOrders =
                await Order.countDocuments(
                    {
                        userId,

                        status:
                            "Delivered",
                    }
                );

            return res
                .status(200)
                .json({
                    success:
                        true,

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
                    success:
                        false,

                    message:
                        "Failed to fetch order stats",
                });
        }
    };

/* ============================================================
   GET ORDERS
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
                    ? parsedLimit
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
                    Math.min(
                        limit,
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
                "Get Orders Error:",
                error
            );

            return res
                .status(500)
                .json({
                    success:
                        false,

                    message:
                        "Failed to fetch orders",
                });
        }
    };

/* ============================================================
   GET ORDER BY ID
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
                        success:
                            false,

                        message:
                            "Invalid order ID.",
                    });
            }

            const order =
                await Order.findOne(
                    {
                        _id:
                            orderId,

                        userId,
                    }
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
                "Get Order By ID Error:",
                error
            );

            return res
                .status(500)
                .json({
                    success:
                        false,

                    message:
                        "Failed to fetch order details.",
                });
        }
    };

/* ============================================================
   CREATE PAYMENT ORDER
============================================================ */

/*
 * POST /api/orders/create-payment
 *
 * Frontend sends ONLY:
 *
 * {
 *     addressId: "..."
 * }
 *
 * Backend calculates:
 *
 * - cart
 * - current product prices
 * - variants
 * - stock
 * - print images
 * - product weights
 * - shipping
 * - subtotal
 * - total
 *
 * Frontend amount is NEVER trusted.
 */

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
                !process.env
                    .RAZORPAY_KEY_ID ||
                !process.env
                    .RAZORPAY_KEY_SECRET
            ) {
                console.error(
                    "Razorpay credentials are missing."
                );

                return res
                    .status(500)
                    .json({
                        success:
                            false,

                        message:
                            "Payment gateway is not configured.",
                    });
            }

            /* ==================================================
               ADDRESS
            ================================================== */

            const {
                addressId,
            } = req.body;

            if (
                !addressId
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

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
                        success:
                            false,

                        message:
                            "Invalid delivery address.",
                    });
            }

            const address =
                await Address.findOne(
                    {
                        _id:
                            addressId,

                        userId,
                    }
                );

            if (!address) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,

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
                        success:
                            false,

                        message:
                            "Your cart is empty.",
                    });
            }

            /* ==================================================
               PREPARE ORDER ITEMS
            ================================================== */

            const orderItems = [];

            /* Items used only for
             * shipping calculation.
             */
            const shippingItems =
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
                            success:
                                false,

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
                            success:
                                false,

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
                            success:
                                false,

                            message:
                                `${item.name} is no longer available.`,
                        });
                }

                /* ----------------------------------------------
                   PRODUCT ACTIVE
                ---------------------------------------------- */

                if (
                    product.status !==
                    "active"
                ) {
                    return res
                        .status(400)
                        .json({
                            success:
                                false,

                            message:
                                `${product.name} is currently unavailable.`,
                        });
                }

                /* ----------------------------------------------
                   CURRENT PRICE
                ---------------------------------------------- */

                let currentPrice =
                    null;

                /* ==============================================
                   FIXED PRODUCT
                ============================================== */

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
                        currentPrice <
                            0
                    ) {
                        return res
                            .status(400)
                            .json({
                                success:
                                    false,

                                message:
                                    `${product.name} has an invalid price.`,
                            });
                    }

                    if (
                        Number(
                            product.stock
                        ) <
                        quantity
                    ) {
                        return res
                            .status(400)
                            .json({
                                success:
                                    false,

                                message:
                                    `${product.name} has only ${
                                        product.stock
                                    } item${
                                        product.stock ===
                                        1
                                            ? ""
                                            : "s"
                                    } left in stock.`,
                            });
                    }
                }

                /* ==============================================
                   VARIANT PRODUCT
                ============================================== */

                else if (
                    product.pricingType ===
                    "variants"
                ) {
                    const selections =
                        normalizeSelections(
                            item.selections
                        );

                    const variant =
                        product.variants.find(
                            (
                                candidate
                            ) => {
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
                                        selections
                                    );

                                if (
                                    candidateKeys.length !==
                                    selectionKeys.length
                                ) {
                                    return false;
                                }

                                return candidateKeys.every(
                                    (
                                        key
                                    ) =>
                                        candidateSelections[
                                            key
                                        ] ===
                                        selections[
                                            key
                                        ]
                                );
                            }
                        );

                    if (
                        !variant
                    ) {
                        return res
                            .status(400)
                            .json({
                                success:
                                    false,

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
                                success:
                                    false,

                                message:
                                    `${product.name} selected variant is inactive.`,
                            });
                    }

                    if (
                        Number(
                            variant.stock
                        ) <
                        quantity
                    ) {
                        return res
                            .status(400)
                            .json({
                                success:
                                    false,

                                message:
                                    `${product.name} has only ${variant.stock} item${
                                        variant.stock ===
                                        1
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
                        currentPrice <
                            0
                    ) {
                        return res
                            .status(400)
                            .json({
                                success:
                                    false,

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
                            success:
                                false,

                            message:
                                `${product.name} has an invalid pricing configuration.`,
                        });
                }

                /* ----------------------------------------------
                   BUILD ORDER ITEM
                ---------------------------------------------- */

                const cleanPrintUnits =
                    item.printUnits.map(
                        (
                            unit
                        ) => ({
                            unitId:
                                String(
                                    unit.unitId
                                ),

                            images:
                                unit.images.map(
                                    (
                                        image
                                    ) => ({
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
                        item.itemKey,

                    name:
                        product.name,

                    /*
                     * Use current product image
                     * when available.
                     */
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

                /* ----------------------------------------------
                   SHIPPING ITEM
                ---------------------------------------------- */

                shippingItems.push({
                    productWeight:
                        Number(
                            product.weight
                        ) || 100,

                    quantity,
                });
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
                        success:
                            false,

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
                    await Order.exists(
                        {
                            orderNumber:
                                candidate,
                        }
                    );

                if (!exists) {
                    orderNumber =
                        candidate;

                    break;
                }
            }

            if (
                !orderNumber
            ) {
                return res
                    .status(500)
                    .json({
                        success:
                            false,

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

                    items:
                        orderItems,

                    subtotal,

                    deliveryFee:
                        shippingCharge,

                    totalAmount,

                    currency:
                        "INR",

                    status:
                        "Pending Payment",

                    paymentStatus:
                        "Pending",

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
                    totalAmount *
                        100
                );

            /* ==================================================
               RAZORPAY RECEIPT
            ================================================== */

            const receipt =
                orderNumber;

            /* ==================================================
               CREATE RAZORPAY ORDER
            ================================================== */

            let razorpayOrder;

            try {
                razorpayOrder =
                    await razorpay.orders.create(
                        {
                            amount:
                                razorpayAmount,

                            currency:
                                "INR",

                            receipt,

                            notes: {
                                orderNumber,

                                userId,

                                totalWeight:
                                    String(
                                        totalWeight
                                    ),

                                shippingCharge:
                                    String(
                                        shippingCharge
                                    ),
                            },
                        }
                    );
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
                        status:
                            "Cancelled",

                        paymentStatus:
                            "Failed",
                    }
                );

                return res
                    .status(502)
                    .json({
                        success:
                            false,

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
                receipt;

            await newOrder.save();

            /* ==================================================
               RESPONSE
            ================================================== */

            return res
                .status(201)
                .json({
                    success:
                        true,

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
                    success:
                        false,

                    message:
                        "Failed to create payment order.",
                });
        }
    };

/* ============================================================
   DEDUCT STOCK
============================================================ */

/*
 * Stock is deducted ONLY after
 * Razorpay signature verification.
 */

async function deductStockForOrder(
    order
) {
    for (
        const item of
            order.items
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
            );

        if (!product) {
            throw new Error(
                `${item.name} is no longer available.`
            );
        }

        /* ==================================================
           VARIANT
        ================================================== */

        if (
            product.pricingType ===
            "variants"
        ) {
            const selections =
                normalizeSelections(
                    item.selections
                );

            const variant =
                product.variants.find(
                    (
                        candidate
                    ) => {
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
                                selections
                            );

                        if (
                            candidateKeys.length !==
                            selectionKeys.length
                        ) {
                            return false;
                        }

                        return candidateKeys.every(
                            (
                                key
                            ) =>
                                candidateSelections[
                                    key
                                ] ===
                                selections[
                                    key
                                ]
                        );
                    }
                );

            if (
                !variant
            ) {
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

        /* ==================================================
           FIXED PRODUCT
        ================================================== */

        else {
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
            } = req.body;

            /* ==================================================
               VALIDATION
            ================================================== */

            if (
                !razorpayPaymentId ||
                !razorpayOrderId ||
                !razorpaySignature
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Incomplete Razorpay payment response.",
                    });
            }

            /* ==================================================
               FIND ORDER
            ================================================== */

            const order =
                await Order.findOne(
                    {
                        userId,

                        razorpayOrderId,
                    }
                );

            if (!order) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        message:
                            "Order associated with this payment was not found.",
                    });
            }

            /* ==================================================
               IDEMPOTENCY
            ================================================== */

            if (
                order.paymentStatus ===
                    "Paid" &&
                order.razorpayPaymentId ===
                    razorpayPaymentId
            ) {
                return res
                    .status(200)
                    .json({
                        success:
                            true,

                        message:
                            "Payment was already verified.",

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

            /* ==================================================
               PREVENT SECOND PAYMENT
            ================================================== */

            if (
                order.paymentStatus ===
                "Paid"
            ) {
                return res
                    .status(409)
                    .json({
                        success:
                            false,

                        message:
                            "This order has already been paid.",
                    });
            }

            /* ==================================================
               VERIFY SIGNATURE
            ================================================== */

            const body =
                `${order.razorpayOrderId}|${razorpayPaymentId}`;

            const expectedSignature =
                crypto
                    .createHmac(
                        "sha256",

                        process.env
                            .RAZORPAY_KEY_SECRET
                    )
                    .update(
                        body
                    )
                    .digest(
                        "hex"
                    );

            const receivedBuffer =
                Buffer.from(
                    razorpaySignature,
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

                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Payment verification failed.",
                    });
            }

            /* ==================================================
               DEDUCT STOCK
            ================================================== */

            try {
                await deductStockForOrder(
                    order
                );
            } catch (
                stockError
            ) {
                console.error(
                    "Stock deduction failed after successful Razorpay payment:",
                    stockError
                );

                /*
                 * Payment succeeded.
                 *
                 * NEVER tell the customer
                 * that payment failed.
                 */

                order.razorpayPaymentId =
                    razorpayPaymentId;

                order.razorpaySignature =
                    razorpaySignature;

                order.paymentStatus =
                    "Paid";

                /*
                 * Keep this as Pending Payment
                 * because your existing status enum
                 * does not have a dedicated
                 * "Manual Review" status.
                 */
                order.status =
                    "Pending Payment";

                order.paymentVerifiedAt =
                    new Date();

                await order.save();

                return res
                    .status(409)
                    .json({
                        success:
                            false,

                        paymentReceived:
                            true,

                        message:
                            "Payment was received, but stock became unavailable. Please contact support for this order.",

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

            /* ==================================================
               MARK PAYMENT PAID
            ================================================== */

            order.razorpayPaymentId =
                razorpayPaymentId;

            order.razorpaySignature =
                razorpaySignature;

            order.paymentStatus =
                "Paid";

            order.status =
                "Processing";

            order.paymentVerifiedAt =
                new Date();

            await order.save();

            /* ==================================================
               CLEAR CART
            ================================================== */

            await Cart.findOneAndUpdate(
                {
                    userId,
                },

                {
                    $set: {
                        items: [],
                    },
                }
            );

            /* ==================================================
               RESPONSE
            ================================================== */

            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Payment verified successfully.",

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
        } catch (error) {
            console.error(
                "Verify Razorpay Payment Error:",
                error
            );

            return res
                .status(500)
                .json({
                    success:
                        false,

                    message:
                        "Failed to verify payment.",
                });
        }
    };