import mongoose from "mongoose";

import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

import {
  calculateCartShipping,
  validateCartShippingItems,
} from "../utils/shipping.js";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_PRINT_IMAGES = 6;

/*
 * Maximum quantity of one cart line.
 *
 * This is a cart safety limit, NOT the actual stock limit.
 * Actual stock is always checked against Product / Variant.
 */
const MAX_CART_QUANTITY = 100;

/*
 * Maximum number of cart lines.
 *
 * Prevents a malicious request from creating an
 * unnecessarily huge cart document.
 */
const MAX_CART_ITEMS = 50;

/*
 * Maximum accepted image size.
 *
 * Multer should also enforce this, but the controller
 * performs its own validation as a second layer.
 */
const MAX_PRINT_IMAGE_SIZE =
  10 * 1024 * 1024;

/*
 * New print images are stored inside a folder belonging
 * to the authenticated Clerk user.
 *
 * Example:
 *
 * new_print_cart_prints/user_xxx/
 */
const PRINT_IMAGE_ROOT =
  "new_print_cart_prints";

/* ============================================================
   BASIC HELPERS
============================================================ */

/*
 * Convert any value to a trimmed string.
 */
const normalizeValue = (
  value
) => {
  return String(
    value ?? ""
  ).trim();
};

/*
 * Safely convert a value to a positive integer.
 */
const normalizeQuantity = (
  value
) => {
  const quantity =
    Number(value);

  if (
    !Number.isInteger(
      quantity
    ) ||
    quantity < 1
  ) {
    return null;
  }

  if (
    quantity >
    MAX_CART_QUANTITY
  ) {
    return MAX_CART_QUANTITY;
  }

  return quantity;
};

/*
 * Validate a MongoDB ObjectId before querying Product.
 *
 * This prevents CastError from malformed client input.
 */
const isValidObjectId = (
  value
) => {
  return mongoose.Types.ObjectId.isValid(
    value
  );
};

/* ============================================================
   SELECTION HELPERS
============================================================ */

/*
 * Normalize selections into a plain object.
 *
 * Supported:
 *
 * {
 *   Size: "M",
 *   Color: "Black"
 * }
 *
 * Mongoose Map is also supported.
 */
const normalizeSelections = (
  selections = {}
) => {
  if (!selections) {
    return {};
  }

  if (
    selections instanceof Map
  ) {
    return Object.fromEntries(
      Array.from(
        selections.entries()
      )
        .map(
          ([key, value]) => [
            normalizeValue(key),
            normalizeValue(value),
          ]
        )
        .filter(
          ([key, value]) =>
            key &&
            value
        )
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
      )
        .map(
          ([key, value]) => [
            normalizeValue(key),
            normalizeValue(value),
          ]
        )
        .filter(
          ([key, value]) =>
            key &&
            value
        )
    );
  }

  return {};
};

/* ============================================================
   SELECTION MATCHING
============================================================ */

/*
 * Exact selection comparison.
 *
 * Order does not matter.
 *
 * Example:
 *
 * { Size: "M", Color: "Black" }
 *
 * matches:
 *
 * { Color: "Black", Size: "M" }
 */
const selectionsMatch = (
  variantSelections,
  requestedSelections
) => {
  const variant =
    normalizeSelections(
      variantSelections
    );

  const requested =
    normalizeSelections(
      requestedSelections
    );

  const variantKeys =
    Object.keys(
      variant
    );

  const requestedKeys =
    Object.keys(
      requested
    );

  if (
    variantKeys.length !==
    requestedKeys.length
  ) {
    return false;
  }

  return variantKeys.every(
    (key) =>
      variant[key] ===
      requested[key]
  );
};

/* ============================================================
   ITEM KEY
============================================================ */

/*
 * Same product + same validated selections
 * = same cart line.
 *
 * Example:
 *
 * productId
 *
 * productId|Color:Black|Size:M
 */
const generateItemKey = (
  productId,
  selections = {}
) => {
  const safeProductId =
    normalizeValue(
      productId
    );

  const normalized =
    normalizeSelections(
      selections
    );

  const entries =
    Object.entries(
      normalized
    ).sort(
      ([a], [b]) =>
        a.localeCompare(b)
    );

  if (
    entries.length === 0
  ) {
    return safeProductId;
  }

  return [
    safeProductId,
    ...entries.map(
      ([key, value]) =>
        `${key}:${value}`
    ),
  ].join("|");
};

/* ============================================================
   PRODUCT VARIANT
============================================================ */

/*
 * Find an active variant that exactly matches
 * the validated customer selections.
 */
const findMatchingVariant = (
  product,
  selections
) => {
  if (
    product?.pricingType !==
    "variants"
  ) {
    return null;
  }

  const variants =
    Array.isArray(
      product.variants
    )
      ? product.variants
      : [];

  const normalizedSelections =
    normalizeSelections(
      selections
    );

  return (
    variants.find(
      (variant) => {
        if (!variant) {
          return false;
        }

        if (
          variant.status ===
          "inactive"
        ) {
          return false;
        }

        return selectionsMatch(
          variant.selections,
          normalizedSelections
        );
      }
    ) || null
  );
};

/* ============================================================
   PRODUCT PRICE
============================================================ */

const getProductPrice = (
  product,
  selections
) => {
  /*
   * FIXED PRICE PRODUCT
   */
  if (
    product?.pricingType !==
    "variants"
  ) {
    const price =
      Number(
        product?.price
      );

    if (
      !Number.isFinite(
        price
      ) ||
      price < 0
    ) {
      throw new Error(
        "Product does not have a valid price."
      );
    }

    return {
      price,
      variant: null,
    };
  }

  /*
   * VARIANT PRODUCT
   */
  const variant =
    findMatchingVariant(
      product,
      selections
    );

  if (!variant) {
    throw new Error(
      "The selected product variant is unavailable."
    );
  }

  const price =
    Number(
      variant.price
    );

  if (
    !Number.isFinite(
      price
    ) ||
    price < 0
  ) {
    throw new Error(
      "The selected variant does not have a valid price."
    );
  }

  return {
    price,
    variant,
  };
};

/* ============================================================
   VALIDATE PRODUCT + SELECTIONS
============================================================ */

/*
 * This is the main product validation used by cart mutations.
 *
 * NEVER trust:
 *
 * - frontend price
 * - frontend product name
 * - frontend image
 * - frontend variant price
 *
 * Everything important is read from Product.
 */
const validateCartItem = async (
  productId,
  requestedSelections = {}
) => {
  const normalizedProductId =
    normalizeValue(
      productId
    );

  if (
    !normalizedProductId
  ) {
    throw new Error(
      "Product ID is required."
    );
  }

  if (
    !isValidObjectId(
      normalizedProductId
    )
  ) {
    throw new Error(
      "Invalid product ID."
    );
  }

  const product =
    await Product.findById(
      normalizedProductId
    );

  if (!product) {
    throw new Error(
      "Product not found."
    );
  }

  if (
    product.status !==
    "active"
  ) {
    throw new Error(
      "This product is currently unavailable."
    );
  }

  /*
   * Product weight is required for shipping.
   *
   * DO NOT silently assume 100g.
   */
  const productWeight =
    Number(
      product.weight
    );

  if (
    !Number.isFinite(
      productWeight
    ) ||
    productWeight <= 0 ||
    !Number.isInteger(
      productWeight
    )
  ) {
    throw new Error(
      "This product does not have valid shipping weight information. Please try again later."
    );
  }

  const normalizedSelections =
    normalizeSelections(
      requestedSelections
    );

  const orderSelections =
    Array.isArray(
      product.orderSelections
    )
      ? product.orderSelections
      : [];

  /*
   * Build allowed selection names.
   */
  const allowedSelectionNames =
    new Set(
      orderSelections
        .map(
          (selection) =>
            normalizeValue(
              selection?.name
            )
        )
        .filter(Boolean)
    );

  /*
   * Reject unknown selections.
   *
   * This prevents clients from inventing arbitrary
   * selection fields.
   */
  for (
    const key of Object.keys(
      normalizedSelections
    )
  ) {
    if (
      !allowedSelectionNames.has(
        key
      )
    ) {
      throw new Error(
        `Invalid product selection: ${key}.`
      );
    }
  }

  const validatedSelections =
    {};

  /*
   * Validate every configured product selection.
   */
  for (
    const selection of
      orderSelections
  ) {
    if (!selection) {
      continue;
    }

    const name =
      normalizeValue(
        selection.name
      );

    if (!name) {
      continue;
    }

    const value =
      normalizeValue(
        normalizedSelections[
          name
        ]
      );

    /*
     * Required selection.
     */
    if (
      selection.required &&
      !value
    ) {
      throw new Error(
        `Please select ${name}.`
      );
    }

    /*
     * Optional and not supplied.
     */
    if (!value) {
      continue;
    }

    const allowedValues =
      Array.isArray(
        selection.values
      )
        ? selection.values.map(
            normalizeValue
          )
        : [];

    if (
      allowedValues.length > 0 &&
      !allowedValues.includes(
        value
      )
    ) {
      throw new Error(
        `Invalid value for ${name}.`
      );
    }

    validatedSelections[
      name
    ] = value;
  }

  const {
    price,
    variant,
  } =
    getProductPrice(
      product,
      validatedSelections
    );

  /*
   * Validate stock configuration itself.
   *
   * A broken product should not be allowed
   * into the cart.
   */
  if (
    product.pricingType ===
    "variants"
  ) {
    if (!variant) {
      throw new Error(
        "The selected product variant is unavailable."
      );
    }

    const stock =
      Number(
        variant.stock
      );

    if (
      !Number.isFinite(
        stock
      ) ||
      !Number.isInteger(
        stock
      ) ||
      stock < 0
    ) {
      throw new Error(
        "The selected product variant has invalid stock information."
      );
    }
  } else {
    const stock =
      Number(
        product.stock
      );

    if (
      !Number.isFinite(
        stock
      ) ||
      !Number.isInteger(
        stock
      ) ||
      stock < 0
    ) {
      throw new Error(
        "Product has invalid stock information."
      );
    }
  }

  return {
    product,
    validatedSelections,
    price,
    variant,
    productWeight,
  };
};

/* ============================================================
   STOCK HELPERS
============================================================ */

/*
 * Return currently available stock for a product/variant.
 */
const getAvailableStock = (
  product,
  variant = null
) => {
  if (
    product?.pricingType ===
    "variants"
  ) {
    return Number(
      variant?.stock
    );
  }

  return Number(
    product?.stock
  );
};

/*
 * Validate that a quantity can be held in cart.
 *
 * Cart does not reserve stock.
 *
 * Final checkout must check stock again.
 */
const validateQuantityAgainstStock = (
  product,
  variant,
  quantity,
  existingQuantity = 0
) => {
  const stock =
    getAvailableStock(
      product,
      variant
    );

  if (
    !Number.isFinite(stock) ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    throw new Error(
      "Product has invalid stock information."
    );
  }

  const requestedTotal =
    Number(
      existingQuantity
    ) +
    Number(
      quantity
    );

  if (
    requestedTotal >
    stock
  ) {
    if (
      product?.pricingType ===
      "variants"
    ) {
      throw new Error(
        `${product.name} has only ${stock} item${
          stock === 1
            ? ""
            : "s"
        } left in the selected variant.`
      );
    }

    throw new Error(
      `${product.name} has only ${stock} item${
        stock === 1
          ? ""
          : "s"
      } left in stock.`
    );
  }
};

/* ============================================================
   PRINT UNIT ID
============================================================ */

const generateUnitId =
  () => {
    return `unit_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  };

/* ============================================================
   CREATE EMPTY PRINT UNIT
============================================================ */

const createPrintUnit =
  () => {
    return {
      unitId:
        generateUnitId(),

      images: [],
    };
  };

/* ============================================================
   CREATE PRINT UNITS
============================================================ */

const createPrintUnits =
  (quantity) => {
    const safeQuantity =
      Math.min(
        MAX_CART_QUANTITY,
        Math.max(
          1,
          Number(
            quantity
          ) || 1
        )
      );

    return Array.from(
      {
        length:
          safeQuantity,
      },
      () =>
        createPrintUnit()
    );
  };

/* ============================================================
   NORMALIZE PRINT UNITS
============================================================ */

/*
 * Ensures:
 *
 * printUnits.length === quantity
 *
 * Existing units/images are preserved.
 * New physical products receive empty units.
 *
 * This is only normalization.
 *
 * It does NOT satisfy checkout requirements.
 * Checkout still requires 1–6 images per unit.
 */
const normalizePrintUnits =
  (item) => {
    const quantity =
      Math.min(
        MAX_CART_QUANTITY,
        Math.max(
          1,
          Number(
            item?.quantity
          ) || 1
        )
      );

    const existingUnits =
      Array.isArray(
        item?.printUnits
      )
        ? item.printUnits
        : [];

    const units =
      [];

    for (
      let index = 0;
      index < quantity;
      index++
    ) {
      const existing =
        existingUnits[
          index
        ];

      if (!existing) {
        units.push(
          createPrintUnit()
        );

        continue;
      }

      const images =
        Array.isArray(
          existing.images
        )
          ? existing.images
              .slice(
                0,
                MAX_PRINT_IMAGES
              )
              .map(
                (image) => ({
                  url:
                    normalizeValue(
                      image?.url
                    ),

                  publicId:
                    normalizeValue(
                      image?.publicId
                    ),
                })
              )
              .filter(
                (image) =>
                  image.url &&
                  image.publicId
              )
          : [];

      units.push({
        unitId:
          normalizeValue(
            existing.unitId
          ) ||
          generateUnitId(),

        images,
      });
    }

    return units;
  };

/* ============================================================
   SYNC PRINT UNITS
============================================================ */

const syncPrintUnitsToQuantity =
  (item) => {
    item.printUnits =
      normalizePrintUnits(
        item
      );
  };

/* ============================================================
   IMAGE OWNERSHIP
============================================================ */

/*
 * Clerk user IDs are normally safe strings, but we still
 * sanitize them before putting them into a Cloudinary folder.
 */
const getSafeUserFolder =
  (userId) => {
    return normalizeValue(
      userId
    ).replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );
  };

/*
 * Every NEW uploaded print image must live in:
 *
 * new_print_cart_prints/<userId>/
 *
 * This prevents one authenticated user from attaching
 * another user's newly-uploaded print image.
 */
const getPrintImageFolder =
  (userId) => {
    return `${PRINT_IMAGE_ROOT}/${getSafeUserFolder(
      userId
    )}`;
  };

/*
 * Validate that a print image publicId belongs to
 * the currently authenticated user.
 *
 * IMPORTANT:
 *
 * Older images from the previous generic folder are
 * intentionally rejected here. They should be uploaded
 * again before public launch.
 */
const isOwnedPrintImage =
  (userId, publicId) => {
    const safePublicId =
      normalizeValue(
        publicId
      );

    const folder =
      getPrintImageFolder(
        userId
      );

    return (
      safePublicId ===
        folder ||
      safePublicId.startsWith(
        `${folder}/`
      )
    );
  };

/*
 * Basic Cloudinary URL validation.
 *
 * This prevents arbitrary external URLs from being
 * stored as print images.
 */
const isCloudinaryImageUrl =
  (url) => {
    const value =
      normalizeValue(
        url
      );

    if (!value) {
      return false;
    }

    try {
      const parsed =
        new URL(
          value
        );

      const hostname =
        parsed.hostname.toLowerCase();

      /*
       * Cloudinary delivery hosts normally use:
       *
       * res.cloudinary.com
       */
      return (
        hostname ===
          "res.cloudinary.com" ||
        hostname.endsWith(
          ".res.cloudinary.com"
        )
      );
    } catch {
      return false;
    }
  };

/* ============================================================
   VALIDATE PRINT IMAGES
============================================================ */

/*
 * Validate the final print customization sent by
 * an authenticated user.
 *
 * Every physical product:
 *
 * - exactly one unit
 * - minimum 1 image
 * - maximum 6 images
 * - owned Cloudinary image
 * - Cloudinary URL
 */
const validatePrintUnits = (
  printUnits,
  quantity,
  userId
) => {
  if (
    !Array.isArray(
      printUnits
    )
  ) {
    throw new Error(
      "Print customization is required."
    );
  }

  const expectedQuantity =
    Number(
      quantity
    );

  if (
    !Number.isInteger(
      expectedQuantity
    ) ||
    expectedQuantity < 1
  ) {
    throw new Error(
      "Invalid cart quantity."
    );
  }

  if (
    printUnits.length !==
    expectedQuantity
  ) {
    throw new Error(
      `Please provide print images for all ${expectedQuantity} physical product${
        expectedQuantity ===
        1
          ? ""
          : "s"
      }.`
    );
  }

  const unitIds =
    new Set();

  return printUnits.map(
    (unit, index) => {
      const unitId =
        normalizeValue(
          unit?.unitId
        ) ||
        generateUnitId();

      /*
       * Unit IDs must be unique inside a cart line.
       */
      if (
        unitIds.has(
          unitId
        )
      ) {
        throw new Error(
          `Duplicate print unit detected for Product ${
            index + 1
          }.`
        );
      }

      unitIds.add(
        unitId
      );

      const images =
        Array.isArray(
          unit?.images
        )
          ? unit.images
          : [];

      if (
        images.length < 1
      ) {
        throw new Error(
          `Product ${
            index + 1
          } requires at least 1 print image.`
        );
      }

      if (
        images.length >
        MAX_PRINT_IMAGES
      ) {
        throw new Error(
          `Product ${
            index + 1
          } can have maximum ${MAX_PRINT_IMAGES} images.`
        );
      }

      const imageIds =
        new Set();

      const cleanImages =
        images.map(
          (image) => {
            const url =
              normalizeValue(
                image?.url
              );

            const publicId =
              normalizeValue(
                image?.publicId
              );

            if (
              !url ||
              !publicId
            ) {
              throw new Error(
                `Product ${
                  index + 1
                } contains an invalid print image.`
              );
            }

            if (
              !isCloudinaryImageUrl(
                url
              )
            ) {
              throw new Error(
                `Product ${
                  index + 1
                } contains an invalid image URL.`
              );
            }

            if (
              !isOwnedPrintImage(
                userId,
                publicId
              )
            ) {
              throw new Error(
                `Product ${
                  index + 1
                } contains an image that does not belong to your account. Please remove it and upload the image again.`
              );
            }

            /*
             * Do not allow the same image to be added
             * repeatedly to one physical product.
             */
            if (
              imageIds.has(
                publicId
              )
            ) {
              throw new Error(
                `Product ${
                  index + 1
                } contains the same print image more than once.`
              );
            }

            imageIds.add(
              publicId
            );

            return {
              url,
              publicId,
            };
          }
        );

      return {
        unitId,
        images:
          cleanImages,
      };
    }
  );
};

/* ============================================================
   ATTACH CURRENT PRODUCTS
============================================================ */

/*
 * Product information is attached temporarily for:
 *
 * - current shipping weight
 * - current product state
 * - current price calculations
 *
 * __product is NEVER sent to the customer.
 */
const attachProducts =
  async (
    items = []
  ) => {
    if (
      !Array.isArray(
        items
      ) ||
      items.length === 0
    ) {
      return [];
    }

    const productIds =
      [
        ...new Set(
          items
            .map(
              (item) =>
                item?.productId
            )
            .filter(
              (id) =>
                id &&
                isValidObjectId(
                  id
                )
            )
            .map(
              (id) =>
                String(id)
            )
        ),
      ];

    if (
      productIds.length === 0
    ) {
      return items.map(
        (item) => ({
          ...(item?.toObject
            ? item.toObject()
            : {
                ...item,
              }),

          __product:
            null,
        })
      );
    }

    const products =
      await Product.find({
        _id: {
          $in:
            productIds,
        },
      }).lean();

    const productMap =
      new Map(
        products.map(
          (product) => [
            product._id.toString(),
            product,
          ]
        )
      );

    return items.map(
      (item) => {
        const plainItem =
          item?.toObject
            ? item.toObject()
            : {
                ...item,
              };

        const product =
          productMap.get(
            String(
              item.productId
            )
          ) || null;

        return {
          ...plainItem,
          __product:
            product,
        };
      }
    );
  };

/* ============================================================
   SAFE CART ITEMS
============================================================ */

/*
 * Never expose temporary backend product information.
 */
const sanitizeCartItems =
  (items = []) => {
    return items.map(
      (item) => {
        const {
          __product,
          weight,
          ...safeItem
        } = item;

        return safeItem;
      }
    );
  };

/* ============================================================
   BUILD CART RESPONSE
============================================================ */

/*
 * Builds the customer-facing cart totals.
 *
 * SHIPPING:
 *
 * Uses ONLY utils/shipping.js.
 *
 * Rule:
 *
 * ₹15 / 100g
 * = ₹0.15 / gram
 *
 * Final shipping is rounded once.
 */
const buildCartResponse =
  (items = []) => {
    const subtotal =
      items.reduce(
        (
          sum,
          item
        ) => {
          const price =
            Number(
              item?.price
            );

          const quantity =
            Number(
              item?.quantity
            );

          if (
            !Number.isFinite(
              price
            ) ||
            price < 0 ||
            !Number.isInteger(
              quantity
            ) ||
            quantity < 1
          ) {
            return sum;
          }

          return (
            sum +
            price *
              quantity
          );
        },
        0
      );

    const itemCount =
      items.reduce(
        (
          sum,
          item
        ) => {
          const quantity =
            Number(
              item?.quantity
            );

          if (
            !Number.isInteger(
              quantity
            ) ||
            quantity < 1
          ) {
            return sum;
          }

          return (
            sum +
            quantity
          );
        },
        0
      );

    /*
     * Prepare shipping items.
     *
     * Product weight is NEVER read from the
     * cart snapshot.
     */
    const shippingItems =
      items.map(
        (item) => ({
          productWeight:
            Number(
              item?.__product
                ?.weight
            ),

          quantity:
            Number(
              item?.quantity
            ),
        })
      );

    /*
     * If any product has invalid shipping information,
     * do not silently calculate an incorrect total.
     */
    const shippingValidation =
      validateCartShippingItems(
        shippingItems
      );

    if (
      !shippingValidation.valid
    ) {
      throw new Error(
        shippingValidation.message ||
          "Unable to calculate shipping."
      );
    }

    const {
      shippingCharge,
    } =
      calculateCartShipping(
        shippingItems
      );

    const safeSubtotal =
      Math.round(
        subtotal * 100
      ) / 100;

    const safeShipping =
      Math.round(
        Number(
          shippingCharge
        ) * 100
      ) / 100;

    const total =
      Math.round(
        (
          safeSubtotal +
          safeShipping
        ) * 100
      ) / 100;

    return {
      items,

      subtotal:
        safeSubtotal,

      shippingCharge:
        safeShipping,

      total,

      itemCount,
    };
  };

/* ============================================================
   SEND CART RESPONSE
============================================================ */

const sendCartResponse =
  async (
    res,
    cart,
    statusCode = 200,
    message = null
  ) => {
    const itemsWithProducts =
      await attachProducts(
        cart?.items || []
      );

    const cartData =
      buildCartResponse(
        itemsWithProducts
      );

    const safeItems =
      sanitizeCartItems(
        cartData.items
      );

    return res
      .status(
        statusCode
      )
      .json({
        success:
          true,

        ...(message
          ? {
              message,
            }
          : {}),

        cart: {
          ...cartData,

          items:
            safeItems,
        },
      });
  };

/* ============================================================
   GET CART
============================================================ */

export const getCart =
  async (
    req,
    res
  ) => {
    try {
      const userId =
        req.auth?.userId;

      if (!userId) {
        return res.status(
          401
        ).json({
          success:
            false,

          message:
            "Unauthenticated.",
        });
      }

      let cart =
        await Cart.findOne({
          userId,
        });

      if (!cart) {
        cart =
          new Cart({
            userId,
            items: [],
          });

        await cart.save();

        return res.status(
          200
        ).json({
          success:
            true,

          cart: {
            items: [],

            subtotal:
              0,

            shippingCharge:
              0,

            total:
              0,

            itemCount:
              0,
          },
        });
      }

      /*
       * Normalize legacy print units.
       *
       * Do not save unnecessarily if nothing changed.
       */
      let changed =
        false;

      for (
        const item of
          cart.items
      ) {
        const before =
          JSON.stringify(
            item.printUnits ||
              []
          );

        syncPrintUnitsToQuantity(
          item
        );

        const after =
          JSON.stringify(
            item.printUnits ||
              []
          );

        if (
          before !==
          after
        ) {
          changed =
            true;
        }
      }

      if (
        changed
      ) {
        await cart.save();
      }

      return await sendCartResponse(
        res,
        cart
      );
    } catch (
      error
    ) {
      console.error(
        "Get Cart Error:",
        error
      );

      return res.status(
        500
      ).json({
        success:
          false,

        message:
          error?.message ||
          "Failed to get cart.",
      });
    }
  };

/* ============================================================
   ADD ITEM
============================================================ */

export const addItem =
  async (
    req,
    res
  ) => {
    try {
      const userId =
        req.auth?.userId;

      if (!userId) {
        return res.status(
          401
        ).json({
          success:
            false,

          message:
            "Unauthenticated.",
        });
      }

      const {
        productId,

        quantity:
          requestedQuantity,

        selections =
          {},
      } =
        req.body || {};

      const quantity =
        normalizeQuantity(
          requestedQuantity
        );

      if (!quantity) {
        return res.status(
          400
        ).json({
          success:
            false,

          message:
            `Quantity must be between 1 and ${MAX_CART_QUANTITY}.`,
        });
      }

      const {
        product,
        validatedSelections,
        price,
        variant,
      } =
        await validateCartItem(
          productId,
          selections
        );

      let cart =
        await Cart.findOne({
          userId,
        });

      if (!cart) {
        cart =
          new Cart({
            userId,
            items: [],
          });
      }

      const itemKey =
        generateItemKey(
          product._id.toString(),
          validatedSelections
        );

      const existingItem =
        cart.items.find(
          (item) =>
            item.itemKey ===
            itemKey
        );

      /*
       * Existing line.
       */
      if (
        existingItem
      ) {
        const oldQuantity =
          normalizeQuantity(
            existingItem.quantity
          );

        if (!oldQuantity) {
          throw new Error(
            "Existing cart item has invalid quantity."
          );
        }

        const allowedTotal =
          Math.min(
            MAX_CART_QUANTITY,
            getAvailableStock(
              product,
              variant
            )
          );

        const newQuantity =
          oldQuantity +
          quantity;

        if (
          newQuantity >
          MAX_CART_QUANTITY
        ) {
          return res.status(
            400
          ).json({
            success:
              false,

            message:
              `Maximum ${MAX_CART_QUANTITY} units are allowed for one product.`,
          });
        }

        if (
          newQuantity >
          allowedTotal
        ) {
          const stock =
            getAvailableStock(
              product,
              variant
            );

          if (
            product.pricingType ===
            "variants"
          ) {
            return res.status(
              400
            ).json({
              success:
                false,

              message:
                `${product.name} has only ${stock} item${
                  stock === 1
                    ? ""
                    : "s"
                } left in the selected variant.`,
            });
          }

          return res.status(
            400
          ).json({
            success:
              false,

            message:
              `${product.name} has only ${stock} item${
                stock === 1
                  ? ""
                  : "s"
              } left in stock.`,
          });
        }

        /*
         * Preserve existing print images.
         * New physical units receive empty image arrays.
         */
        syncPrintUnitsToQuantity(
          existingItem
        );

        existingItem.quantity =
          newQuantity;

        existingItem.price =
          price;

        existingItem.name =
          product.name;

        existingItem.image =
          product.images?.[0] ||
          "";

        existingItem.selections =
          validatedSelections;

        syncPrintUnitsToQuantity(
          existingItem
        );
      } else {
        /*
         * Prevent cart-line abuse.
         */
        if (
          cart.items.length >=
          MAX_CART_ITEMS
        ) {
          return res.status(
            400
          ).json({
            success:
              false,

            message:
              `Maximum ${MAX_CART_ITEMS} different products can be in the cart.`,
          });
        }

        /*
         * New line must also respect current stock.
         */
        validateQuantityAgainstStock(
          product,
          variant,
          quantity,
          0
        );

        cart.items.push({
          productId:
            product._id,

          itemKey,

          name:
            product.name,

          image:
            product.images?.[0] ||
            "",

          price,

          quantity,

          selections:
            validatedSelections,

          printUnits:
            createPrintUnits(
              quantity
            ),
        });
      }

      await cart.save();

      return await sendCartResponse(
        res,
        cart,
        200,
        "Item added to cart."
      );
    } catch (
      error
    ) {
      console.error(
        "Add To Cart Error:",
        error
      );

      return res.status(
        400
      ).json({
        success:
          false,

        message:
          error?.message ||
          "Failed to add item to cart.",
      });
    }
  };

/* ============================================================
   UPDATE ITEM QUANTITY
============================================================ */

export const updateItemQuantity =
  async (
    req,
    res
  ) => {
    try {
      const userId =
        req.auth?.userId;

      if (!userId) {
        return res.status(
          401
        ).json({
          success:
            false,

          message:
            "Unauthenticated.",
        });
      }

      const itemId =
        normalizeValue(
          req.params?.itemId
        );

      const quantity =
        normalizeQuantity(
          req.body?.quantity
        );

      if (!itemId) {
        return res.status(
          400
        ).json({
          success:
            false,

          message:
            "Cart item identifier is required.",
        });
      }

      if (!quantity) {
        return res.status(
          400
        ).json({
          success:
            false,

          message:
            `Quantity must be between 1 and ${MAX_CART_QUANTITY}.`,
        });
      }

      const cart =
        await Cart.findOne({
          userId,
        });

      if (!cart) {
        return res.status(
          404
        ).json({
          success:
            false,

          message:
            "Cart not found.",
        });
      }

      const item =
        cart.items.find(
          (cartItem) =>
            String(
              cartItem?._id
            ) ===
              itemId ||
            normalizeValue(
              cartItem?.itemKey
            ) ===
              itemId
        );

      if (!item) {
        return res.status(
          404
        ).json({
          success:
            false,

          message:
            "Item not found in cart.",
        });
      }

      const {
        product,
        validatedSelections,
        price,
        variant,
      } =
        await validateCartItem(
          item.productId.toString(),
          item.selections
        );

      /*
       * Quantity cannot exceed current stock.
       *
       * This is checked again at checkout because cart
       * quantity does NOT reserve inventory.
       */
      validateQuantityAgainstStock(
        product,
        variant,
        quantity,
        0
      );

      item.quantity =
        quantity;

      item.price =
        price;

      item.name =
        product.name;

      item.image =
        product.images?.[0] ||
        "";

      item.selections =
        validatedSelections;

      /*
       * Preserve existing physical-unit images.
       * Reduce extra units when quantity decreases.
       * Create empty units when quantity increases.
       */
      syncPrintUnitsToQuantity(
        item
      );

      await cart.save();

      return await sendCartResponse(
        res,
        cart,
        200,
        "Cart quantity updated."
      );
    } catch (
      error
    ) {
      console.error(
        "Update Quantity Error:",
        error
      );

      return res.status(
        400
      ).json({
        success:
          false,

        message:
          error?.message ||
          "Failed to update quantity.",
      });
    }
  };

/* ============================================================
   REMOVE ITEM
============================================================ */

export const removeItem =
  async (
    req,
    res
  ) => {
    try {
      const userId =
        req.auth?.userId;

      if (!userId) {
        return res.status(
          401
        ).json({
          success:
            false,

          message:
            "Unauthenticated.",
        });
      }

      const itemId =
        normalizeValue(
          req.params?.itemId
        );

      if (!itemId) {
        return res.status(
          400
        ).json({
          success:
            false,

          message:
            "Cart item identifier is required.",
        });
      }

      const cart =
        await Cart.findOne({
          userId,
        });

      if (!cart) {
        return res.status(
          404
        ).json({
          success:
            false,

          message:
            "Cart not found.",
        });
      }

      const originalLength =
        cart.items.length;

      /*
       * Support both:
       *
       * MongoDB item _id
       * and legacy itemKey
       *
       * But ALWAYS inside the authenticated user's cart.
       */
      cart.items =
        cart.items.filter(
          (item) => {
            const mongoItemId =
              item?._id
                ? String(
                    item._id
                  )
                : "";

            const itemKey =
              normalizeValue(
                item?.itemKey
              );

            return (
              mongoItemId !==
                itemId &&
              itemKey !==
                itemId
            );
          }
        );

      if (
        cart.items.length ===
        originalLength
      ) {
        return res.status(
          404
        ).json({
          success:
            false,

          message:
            "Item not found in cart.",
        });
      }

      /*
       * Do NOT automatically delete Cloudinary images here.
       *
       * Some cart images can be referenced by an order
       * during a concurrent payment flow.
       *
       * Orphan cleanup should be handled separately using
       * ownership + order-reference checks.
       */
      await cart.save();

      return await sendCartResponse(
        res,
        cart,
        200,
        "Item removed from cart."
      );
    } catch (
      error
    ) {
      console.error(
        "Remove Item Error:",
        error
      );

      return res.status(
        500
      ).json({
        success:
          false,

        message:
          "Failed to remove item from cart.",
      });
    }
  };

/* ============================================================
   CLEAR CART
============================================================ */

export const clearCart =
  async (
    req,
    res
  ) => {
    try {
      const userId =
        req.auth?.userId;

      if (!userId) {
        return res.status(
          401
        ).json({
          success:
            false,

          message:
            "Unauthenticated.",
        });
      }

      await Cart.findOneAndUpdate(
        {
          userId,
        },
        {
          $set: {
            items: [],
          },
        },
        {
          new: true,

          upsert: true,

          setDefaultsOnInsert:
            true,
        }
      );

      /*
       * Do NOT delete Cloudinary files here.
       *
       * A cart image can be referenced by an order that
       * has just completed, and deleting it could break
       * the order's print artwork.
       */
      return res.status(
        200
      ).json({
        success:
          true,

        message:
          "Cart cleared.",

        cart: {
          items: [],

          subtotal:
            0,

          shippingCharge:
            0,

          total:
            0,

          itemCount:
            0,
        },
      });
    } catch (
      error
    ) {
      console.error(
        "Clear Cart Error:",
        error
      );

      return res.status(
        500
      ).json({
        success:
          false,

        message:
          "Failed to clear cart.",
      });
    }
  };

/* ============================================================
   MERGE GUEST CART
============================================================ */

/*
 * Guest cart is client-controlled.
 *
 * Therefore EVERY product, price, selection and quantity
 * is revalidated from the database.
 *
 * Guest print images are accepted ONLY when they belong
 * to the authenticated user's protected Cloudinary folder.
 */
export const mergeCart =
  async (
    req,
    res
  ) => {
    try {
      const userId =
        req.auth?.userId;

      if (!userId) {
        return res.status(
          401
        ).json({
          success:
            false,

          message:
            "Unauthenticated.",
        });
      }

      const {
        items = [],
      } =
        req.body || {};

      if (
        !Array.isArray(
          items
        )
      ) {
        return res.status(
          400
        ).json({
          success:
            false,

          message:
            "Invalid cart items.",
        });
      }

      /*
       * Protect against huge malicious merge payloads.
       */
      if (
        items.length >
        MAX_CART_ITEMS
      ) {
        return res.status(
          400
        ).json({
          success:
            false,

          message:
            `Maximum ${MAX_CART_ITEMS} cart items can be merged.`,
        });
      }

      let cart =
        await Cart.findOne({
          userId,
        });

      if (!cart) {
        cart =
          new Cart({
            userId,
            items: [],
          });
      }

      const messages =
        [];

      /*
       * Process each guest item independently.
       *
       * One invalid guest item must not destroy
       * the authenticated server cart.
       */
      for (
        const guestItem of
          items
      ) {
        try {
          const guestQuantity =
            normalizeQuantity(
              guestItem?.quantity
            );

          if (
            !guestQuantity
          ) {
            messages.push(
              "One guest cart item had an invalid quantity and was skipped."
            );

            continue;
          }

          const {
            product,
            validatedSelections,
            price,
            variant,
          } =
            await validateCartItem(
              guestItem?.productId,
              guestItem?.selections
            );

          const itemKey =
            generateItemKey(
              product._id.toString(),
              validatedSelections
            );

          const existingItem =
            cart.items.find(
              (item) =>
                item.itemKey ===
                itemKey
            );

          /*
           * Sanitize guest print units.
           *
           * IMPORTANT:
           * Guest cart data is NOT trusted.
           */
          let guestUnits =
            Array.isArray(
              guestItem?.printUnits
            )
              ? guestItem.printUnits
                  .slice(
                    0,
                    guestQuantity
                  )
                  .map(
                    (
                      unit
                    ) => {
                      const unitId =
                        normalizeValue(
                          unit?.unitId
                        ) ||
                        generateUnitId();

                      const images =
                        Array.isArray(
                          unit?.images
                        )
                          ? unit.images
                              .slice(
                                0,
                                MAX_PRINT_IMAGES
                              )
                              .map(
                                (
                                  image
                                ) => {
                                  const url =
                                    normalizeValue(
                                      image?.url
                                    );

                                  const publicId =
                                    normalizeValue(
                                      image?.publicId
                                    );

                                  /*
                                   * Only accept owned
                                   * Cloudinary images.
                                   */
                                  if (
                                    !url ||
                                    !publicId ||
                                    !isCloudinaryImageUrl(
                                      url
                                    ) ||
                                    !isOwnedPrintImage(
                                      userId,
                                      publicId
                                    )
                                  ) {
                                    return null;
                                  }

                                  return {
                                    url,
                                    publicId,
                                  };
                                }
                              )
                              .filter(Boolean)
                          : [];

                      return {
                        unitId,

                        images,
                      };
                    }
                  )
              : [];

          /*
           * Fill missing physical units with empty units.
           */
          while (
            guestUnits.length <
            guestQuantity
          ) {
            guestUnits.push(
              createPrintUnit()
            );
          }

          /*
           * Existing server item.
           */
          if (
            existingItem
          ) {
            const oldQuantity =
              normalizeQuantity(
                existingItem.quantity
              );

            if (
              !oldQuantity
            ) {
              throw new Error(
                "Existing cart item has invalid quantity."
              );
            }

            const maxStock =
              getAvailableStock(
                product,
                variant
              );

            const availableAdditional =
              Math.max(
                0,
                Math.min(
                  MAX_CART_QUANTITY,
                  maxStock
                ) -
                  oldQuantity
              );

            if (
              availableAdditional <=
              0
            ) {
              messages.push(
                `${product.name} is already at its available stock quantity.`
              );

              continue;
            }

            const quantityToAdd =
              Math.min(
                guestQuantity,
                availableAdditional
              );

            if (
              quantityToAdd <
              guestQuantity
            ) {
              messages.push(
                `${product.name}: only ${availableAdditional} additional item${
                  availableAdditional ===
                  1
                    ? ""
                    : "s"
                } could be merged because of stock.`
              );
            }

            syncPrintUnitsToQuantity(
              existingItem
            );

            const existingUnits =
              normalizePrintUnits(
                existingItem
              );

            existingItem.quantity =
              oldQuantity +
              quantityToAdd;

            existingItem.price =
              price;

            existingItem.name =
              product.name;

            existingItem.image =
              product.images?.[0] ||
              "";

            existingItem.selections =
              validatedSelections;

            /*
             * Append only the number of guest units
             * that were actually merged.
             */
            existingItem.printUnits =
              existingUnits.concat(
                guestUnits.slice(
                  0,
                  quantityToAdd
                )
              );

            syncPrintUnitsToQuantity(
              existingItem
            );
          } else {
            /*
             * New server item.
             */
            if (
              cart.items.length >=
              MAX_CART_ITEMS
            ) {
              messages.push(
                `Maximum ${MAX_CART_ITEMS} cart items reached.`
              );

              break;
            }

            validateQuantityAgainstStock(
              product,
              variant,
              guestQuantity,
              0
            );

            cart.items.push({
              productId:
                product._id,

              itemKey,

              name:
                product.name,

              image:
                product.images?.[0] ||
                "",

              price,

              quantity:
                guestQuantity,

              selections:
                validatedSelections,

              printUnits:
                guestUnits.slice(
                  0,
                  guestQuantity
                ),
            });
          }
        } catch (
          error
        ) {
          console.error(
            "Guest Cart Item Merge Error:",
            error
          );

          messages.push(
            error?.message ||
              "One cart item could not be merged."
          );
        }
      }

      await cart.save();

      const responseMessage =
        messages.length > 0
          ? "Cart merged with some adjustments."
          : "Cart merged successfully.";

      const itemsWithProducts =
        await attachProducts(
          cart.items
        );

      const cartData =
        buildCartResponse(
          itemsWithProducts
        );

      const safeItems =
        sanitizeCartItems(
          cartData.items
        );

      return res.status(
        200
      ).json({
        success:
          true,

        message:
          responseMessage,

        messages,

        cart: {
          ...cartData,

          items:
            safeItems,
        },
      });
    } catch (
      error
    ) {
      console.error(
        "Merge Cart Error:",
        error
      );

      return res.status(
        500
      ).json({
        success:
          false,

        message:
          "Failed to merge cart.",
      });
    }
  };

/* ============================================================
   UPLOAD PRINT IMAGE
============================================================ */

/*
 * POST /api/cart/print-image
 *
 * The route is already protected by authenticateUser.
 *
 * Every new image is stored under:
 *
 * new_print_cart_prints/<authenticated-user>/
 *
 * This makes later ownership validation possible.
 */
export const uploadPrintImage =
  async (
    req,
    res
  ) => {
    try {
      const userId =
        req.auth?.userId;

      if (!userId) {
        return res.status(
          401
        ).json({
          success:
            false,

          message:
            "Unauthenticated.",
        });
      }

      if (!req.file) {
        return res.status(
          400
        ).json({
          success:
            false,

          message:
            "Please select an image.",
        });
      }

      if (
        !req.file.mimetype?.startsWith(
          "image/"
        )
      ) {
        return res.status(
          400
        ).json({
          success:
            false,

          message:
            "Only image files are allowed.",
        });
      }

      if (
        !Number.isFinite(
          Number(
            req.file.size
          )
        ) ||
        Number(
          req.file.size
        ) <= 0
      ) {
        return res.status(
          400
        ).json({
          success:
            false,

          message:
            "Invalid image file.",
        });
      }

      if (
        Number(
          req.file.size
        ) >
        MAX_PRINT_IMAGE_SIZE
      ) {
        return res.status(
          400
        ).json({
          success:
            false,

          message:
            "Image must be 10MB or smaller.",
        });
      }

      if (
        !req.file.buffer ||
        !Buffer.isBuffer(
          req.file.buffer
        ) ||
        req.file.buffer.length ===
          0
      ) {
        return res.status(
          400
        ).json({
          success:
            false,

          message:
            "Invalid image upload.",
        });
      }

      const folder =
        getPrintImageFolder(
          userId
        );

      const result =
        await new Promise(
          (
            resolve,
            reject
          ) => {
            const uploadStream =
              cloudinary.uploader.upload_stream(
                {
                  folder,

                  resource_type:
                    "image",

                  /*
                   * Keep uploaded print artwork
                   * as an image resource.
                   */
                  use_filename:
                    false,

                  unique_filename:
                    true,

                  overwrite:
                    false,
                },

                (
                  error,
                  uploaded
                ) => {
                  if (
                    error
                  ) {
                    reject(
                      error
                    );
                  } else {
                    resolve(
                      uploaded
                    );
                  }
                }
              );

            uploadStream.end(
              req.file.buffer
            );
          }
        );

      if (
        !result?.secure_url ||
        !result?.public_id
      ) {
        return res.status(
          500
        ).json({
          success:
            false,

          message:
            "Cloudinary did not return a valid image.",
        });
      }

      /*
       * Extra ownership check before returning
       * the image to the frontend.
       */
      if (
        !isOwnedPrintImage(
          userId,
          result.public_id
        )
      ) {
        /*
         * Best-effort cleanup if Cloudinary returned
         * an unexpected public ID.
         */
        try {
          await cloudinary.uploader.destroy(
            result.public_id,
            {
              resource_type:
                "image",
            }
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Unexpected print image cleanup error:",
            cleanupError
          );
        }

        return res.status(
          500
        ).json({
          success:
            false,

          message:
            "Uploaded image ownership validation failed.",
        });
      }

      return res.status(
        200
      ).json({
        success:
          true,

        message:
          "Print image uploaded successfully.",

        image: {
          url:
            result.secure_url,

          publicId:
            result.public_id,
        },
      });
    } catch (
      error
    ) {
      console.error(
        "Print Image Upload Error:",
        error
      );

      return res.status(
        500
      ).json({
        success:
          false,

        message:
          "Failed to upload print image.",
      });
    }
  };

/* ============================================================
   SAVE PRINT CUSTOMIZATION
============================================================ */

export const updatePrintCustomization =
  async (
    req,
    res
  ) => {
    try {
      const userId =
        req.auth?.userId;

      if (!userId) {
        return res.status(
          401
        ).json({
          success:
            false,

          message:
            "Unauthenticated.",
        });
      }

      const itemId =
        normalizeValue(
          req.params?.itemId
        );

      if (!itemId) {
        return res.status(
          400
        ).json({
          success:
            false,

          message:
            "Cart item identifier is required.",
        });
      }

      const {
        printUnits,
      } =
        req.body || {};

      if (
        !Array.isArray(
          printUnits
        )
      ) {
        return res.status(
          400
        ).json({
          success:
            false,

          message:
            "Invalid print units.",
        });
      }

      const cart =
        await Cart.findOne({
          userId,
        });

      if (!cart) {
        return res.status(
          404
        ).json({
          success:
            false,

          message:
            "Cart not found.",
        });
      }

      const item =
        cart.items.find(
          (cartItem) =>
            String(
              cartItem?._id
            ) ===
              itemId ||
            normalizeValue(
              cartItem?.itemKey
            ) ===
              itemId
        );

      if (!item) {
        return res.status(
          404
        ).json({
          success:
            false,

          message:
            "Cart item not found.",
        });
      }

      /*
       * Revalidate product and current price.
       *
       * This prevents stale cart data from being saved.
       */
      const {
        product,
        validatedSelections,
        price,
      } =
        await validateCartItem(
          item.productId.toString(),
          item.selections
        );

      /*
       * Quantity must still be available.
       *
       * Customization saving must never make an
       * invalid cart state look valid.
       */
      const quantity =
        normalizeQuantity(
          item.quantity
        );

      if (!quantity) {
        return res.status(
          400
        ).json({
          success:
            false,

          message:
            "Cart item has an invalid quantity.",
        });
      }

      /*
       * Validate and sanitize every image.
       */
      const validatedUnits =
        validatePrintUnits(
          printUnits,
          quantity,
          userId
        );

      /*
       * Update current product snapshot.
       */
      item.price =
        price;

      item.name =
        product.name;

      item.image =
        product.images?.[0] ||
        "";

      item.selections =
        validatedSelections;

      item.printUnits =
        validatedUnits;

      await cart.save();

      return await sendCartResponse(
        res,
        cart,
        200,
        "Print images saved successfully."
      );
    } catch (
      error
    ) {
      console.error(
        "Update Print Customization Error:",
        error
      );

      return res.status(
        400
      ).json({
        success:
          false,

          
        message:
          error?.message ||
          "Failed to save print images.",
      });
    }
  };