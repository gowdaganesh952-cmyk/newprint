import mongoose from "mongoose";
import crypto from "crypto";

import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Address from "../models/Address.js";

import razorpay from "../config/razorpay.js";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_PRINT_IMAGES = 3;

/*
 * Change this if you later want to add
 * delivery calculation.
 *
 * For now:
 *
 * delivery = ₹0
 *
 * You can replace this with your
 * actual delivery calculation later.
 */
const DEFAULT_DELIVERY_FEE = 0;

/* ============================================================
   ORDER NUMBER
============================================================ */

function generateOrderNumber() {
  /*
   * Example:
   *
   * NP-20260813-AB12CD
   */

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

function normalizeSelections(
  selections
) {
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

/*
 * Every physical product must have:
 *
 * 1 to 3 images.
 *
 * quantity = 2
 *
 * printUnits = [
 *   unit 1,
 *   unit 2
 * ]
 */

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
     UNIT COUNT
  ---------------------------------------------------------- */

  if (
    printUnits.length !==
    quantity
  ) {
    return {
      valid: false,

      message:
        `${item.name} requires ${quantity} separate print image unit${quantity > 1 ? "s" : ""}.`,
    };
  }

  /* ----------------------------------------------------------
     EACH UNIT
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

    /* --------------------------------------------------------
       MINIMUM 1 IMAGE
    -------------------------------------------------------- */

    if (
      images.length <
      1
    ) {
      return {
        valid: false,

        message:
          `${item.name} - Product ${index + 1} requires at least 1 print image.`,
      };
    }

    /* --------------------------------------------------------
       MAXIMUM 3 IMAGES
    -------------------------------------------------------- */

    if (
      images.length >
      MAX_PRINT_IMAGES
    ) {
      return {
        valid: false,

        message:
          `${item.name} - Product ${index + 1} has more than 3 print images.`,
      };
    }

    /* --------------------------------------------------------
       IMAGE DATA
    -------------------------------------------------------- */

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
            `${item.name} - Product ${index + 1} contains an invalid print image.`,
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

/*
 * GET /api/orders/stats
 */

export const getOrderStats =
  async (
    req,
    res
  ) => {
    try {
      const userId =
        req.auth.userId;

      const totalOrders =
        await Order.countDocuments({
          userId,
        });

      const pendingOrders =
        await Order.countDocuments({
          userId,

          status: {
            $in: [
              "Pending Payment",
              "Processing",
              "Shipped",
            ],
          },
        });

      const completedOrders =
        await Order.countDocuments({
          userId,

          status:
            "Delivered",
        });

      res.status(200).json({
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

      res.status(500).json({
        success: false,

        message:
          "Failed to fetch order stats",
      });
    }
  };

/* ============================================================
   GET ORDERS
============================================================ */

/*
 * GET /api/orders
 */

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
        })
          .sort({
            createdAt: -1,
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

      res.status(200).json({
        success: true,

        orders,
      });
    } catch (error) {
      console.error(
        "Get Orders Error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to fetch orders",
      });
    }
  };

/* ============================================================
   GET ORDER BY ID
============================================================ */

/*
 * GET /api/orders/:id
 */

/* ============================================================
   GET ORDER BY ID
============================================================ */

/*
 * GET /api/orders/:id
 *
 * Returns only the authenticated user's order.
 */

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

      /* ======================================================
         BASIC ID VALIDATION
      ====================================================== */

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

      /* ======================================================
         FIND USER'S ORDER
      ====================================================== */

      const order =
        await Order.findOne({
          _id: orderId,

          userId,
        });

      /* ======================================================
         NOT FOUND
      ====================================================== */

      if (!order) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Order not found.",
          });
      }

      /* ======================================================
         SUCCESS
      ====================================================== */

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
  
export const createPaymentOrder =
  async (
    req,
    res
  ) => {
    try {
      /* ======================================================
         AUTH
      ====================================================== */

      const userId =
        req.auth.userId;

      /* ======================================================
         RAZORPAY CONFIG CHECK
      ====================================================== */

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

      /* ======================================================
         ADDRESS
      ====================================================== */

      const {
        addressId,
      } = req.body;

      if (!addressId) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Please select a delivery address.",
          });
      }

      const address =
        await Address.findOne({
          _id: addressId,

          userId,
        });

      if (!address) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Selected address was not found.",
          });
      }

      /* ======================================================
         CART
      ====================================================== */

      const cart =
        await Cart.findOne({
          userId,
        });

      if (
        !cart ||
        !Array.isArray(
          cart.items
        ) ||
        cart.items.length === 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Your cart is empty.",
          });
      }

      /* ======================================================
         VALIDATE CART
      ====================================================== */

      for (
        const item of cart.items
      ) {
        if (
          !item.productId
        ) {
          return res
            .status(400)
            .json({
              success: false,

              message:
                "A cart product is invalid.",
            });
        }

        if (
          !Number.isInteger(
            item.quantity
          ) ||
          item.quantity <
            1
        ) {
          return res
            .status(400)
            .json({
              success: false,

              message:
                `Invalid quantity for ${item.name}.`,
            });
        }

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
      }

      /* ======================================================
         CALCULATE AMOUNT
      ====================================================== */

      let subtotal = 0;

      for (
        const item of cart.items
      ) {
        subtotal +=
          Number(
            item.price
          ) *
          Number(
            item.quantity
          );
      }

      /*
       * Round to two decimal
       * places for safety.
       */

      subtotal =
        Math.round(
          subtotal * 100
        ) / 100;

      const deliveryFee =
        DEFAULT_DELIVERY_FEE;

      const totalAmount =
        Math.round(
          (subtotal +
            deliveryFee) *
            100
        ) / 100;

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

      /* ======================================================
         CREATE ORDER NUMBER
      ====================================================== */

      let orderNumber;

      /*
       * Extremely unlikely collision
       * protection.
       */

      for (
        let attempt = 0;
        attempt < 5;
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

      /* ======================================================
         ORDER ITEM SNAPSHOT
      ====================================================== */

      const orderItems =
        cart.items.map(
          (item) => ({
            productId:
              item.productId,

            itemKey:
              item.itemKey,

            name:
              item.name,

            image:
              item.image || "",

            price:
              Number(
                item.price
              ),

            quantity:
              Number(
                item.quantity
              ),

            selections:
              normalizeSelections(
                item.selections
              ),

            /*
             * IMPORTANT:
             *
             * Copy print images into
             * the permanent order.
             */

            printUnits:
              item.printUnits.map(
                (unit) => ({
                  unitId:
                    unit.unitId,

                  images:
                    unit.images.map(
                      (
                        image
                      ) => ({
                        url:
                          image.url,

                        publicId:
                          image.publicId,
                      })
                    ),
                })
              ),
          })
        );

      /* ======================================================
         CREATE OUR NEW PRINT ORDER
      ====================================================== */

      const newOrder =
        await Order.create({
          userId,

          orderNumber,

          items:
            orderItems,

          subtotal,

          deliveryFee,

          totalAmount,

          currency:
            "INR",

          /*
           * Payment has not yet
           * succeeded.
           */

          status:
            "Pending Payment",

          paymentStatus:
            "Pending",

          shippingAddress:
            createAddressSnapshot(
              address
            ),
        });

      /* ======================================================
         RAZORPAY AMOUNT
      ====================================================== */

      /*
       * Razorpay expects amount
       * in the smallest currency unit.
       *
       * INR:
       *
       * ₹100 = 10000 paise
       */

      const razorpayAmount =
        Math.round(
          totalAmount * 100
        );

      /* ======================================================
         RAZORPAY RECEIPT
      ====================================================== */

      const receipt =
        orderNumber;

      /* ======================================================
         CREATE RAZORPAY ORDER
      ====================================================== */

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
              },
            }
          );
      } catch (razorpayError) {
        console.error(
          "Razorpay Order Creation Error:",
          razorpayError
        );

        /*
         * Our New Print order exists,
         * but payment setup failed.
         *
         * Mark it cancelled so it is
         * not shown as an active
         * pending-payment order forever.
         */

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
            success: false,

            message:
              "Unable to start payment. Please try again.",
          });
      }

      /* ======================================================
         SAVE RAZORPAY DETAILS
      ====================================================== */

      newOrder.razorpayOrderId =
        razorpayOrder.id;

      newOrder.razorpayReceipt =
        receipt;

      await newOrder.save();

      /* ======================================================
         RESPONSE
      ====================================================== */

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

            totalAmount:
              newOrder.totalAmount,

            currency:
              newOrder.currency,

            status:
              newOrder.status,

            paymentStatus:
              newOrder.paymentStatus,
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
   VERIFY RAZORPAY PAYMENT
============================================================ */

/*
 * POST /api/orders/verify-payment
 *
 * Body:
 *
 * {
 *   razorpay_payment_id,
 *   razorpay_order_id,
 *   razorpay_signature
 * }
 */

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

      /* ======================================================
         VALIDATION
      ====================================================== */

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

      /* ======================================================
         FIND OUR ORDER
      ====================================================== */

      const order =
        await Order.findOne({
          userId,

          razorpayOrderId,
        });

      if (!order) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Order associated with this payment was not found.",
          });
      }

      /* ======================================================
         IDEMPOTENCY
      ====================================================== */

      if (
        order.paymentStatus ===
          "Paid" &&
        order.razorpayPaymentId ===
          razorpayPaymentId
      ) {
        return res
          .status(200)
          .json({
            success: true,

            message:
              "Payment was already verified.",

            order,
          });
      }

      /* ======================================================
         VERIFY SIGNATURE
      ====================================================== */

      const body =
        `${order.razorpayOrderId}|${razorpayPaymentId}`;

      const expectedSignature =
        crypto
          .createHmac(
            "sha256",
            process.env
              .RAZORPAY_KEY_SECRET
          )
          .update(body)
          .digest("hex");

      /*
       * Use timing-safe comparison.
       */

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
            success: false,

            message:
              "Payment verification failed.",
          });
      }

      /* ======================================================
         UPDATE ORDER
      ====================================================== */

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

      /* ======================================================
         CLEAR CART
      ====================================================== */

      /*
       * IMPORTANT:
       *
       * Only clear the cart AFTER
       * successful signature verification.
       */

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

      /* ======================================================
         RESPONSE
      ====================================================== */

      return res
        .status(200)
        .json({
          success: true,

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
          success: false,

          message:
            "Failed to verify payment.",
        });
    }
  };