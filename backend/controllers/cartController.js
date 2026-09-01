import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_PRINT_IMAGES = 6;

const SHIPPING_RATE_PER_100G = 15;
const SHIPPING_WEIGHT_UNIT = 100;

const DEFAULT_PRODUCT_WEIGHT = 100;

const MAX_CART_QUANTITY = 100;

/* ============================================================
   BASIC HELPERS
============================================================ */

const normalizeValue = (value) => {
  return String(value ?? "").trim();
};

/* ============================================================
   QUANTITY
============================================================ */

const normalizeQuantity = (value) => {
  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return null;
  }

  return Math.min(quantity, MAX_CART_QUANTITY);
};

/* ============================================================
   SELECTIONS
============================================================ */

const normalizeSelections = (selections = {}) => {
  if (!selections) {
    return {};
  }

  if (selections instanceof Map) {
    return Object.fromEntries(
      Array.from(selections.entries())
        .map(([key, value]) => [
          normalizeValue(key),
          normalizeValue(value),
        ])
        .filter(([key, value]) => key && value)
    );
  }

  if (
    typeof selections === "object" &&
    !Array.isArray(selections)
  ) {
    return Object.fromEntries(
      Object.entries(selections)
        .map(([key, value]) => [
          normalizeValue(key),
          normalizeValue(value),
        ])
        .filter(([key, value]) => key && value)
    );
  }

  return {};
};

/* ============================================================
   ITEM KEY
============================================================ */

const generateItemKey = (
  productId,
  selections = {}
) => {
  const safeProductId = normalizeValue(productId);

  const normalizedSelections =
    normalizeSelections(selections);

  const entries = Object.entries(
    normalizedSelections
  ).sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    return safeProductId;
  }

  return [
    safeProductId,
    ...entries.map(
      ([key, value]) =>
        `${encodeURIComponent(key)}:${encodeURIComponent(value)}`
    ),
  ].join("|");
};

/* ============================================================
   SELECTION MATCH
============================================================ */

const selectionsMatch = (
  first = {},
  second = {}
) => {
  const a = normalizeSelections(first);
  const b = normalizeSelections(second);

  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key, index) => {
    const otherKey = bKeys[index];

    return (
      key === otherKey &&
      normalizeValue(a[key]) ===
        normalizeValue(b[otherKey])
    );
  });
};

/* ============================================================
   PRODUCT VARIANT
============================================================ */

const findMatchingVariant = (
  product,
  selections
) => {
  if (product.pricingType !== "variants") {
    return null;
  }

  const variants = Array.isArray(product.variants)
    ? product.variants
    : [];

  const normalizedSelections =
    normalizeSelections(selections);

  return (
    variants.find((variant) => {
      if (!variant) {
        return false;
      }

      if (variant.status === "inactive") {
        return false;
      }

      return selectionsMatch(
        variant.selections,
        normalizedSelections
      );
    }) || null
  );
};

/* ============================================================
   PRODUCT PRICE
============================================================ */

const getProductPrice = (
  product,
  selections
) => {
  /* Fixed-price product */

  if (product.pricingType !== "variants") {
    const price = Number(product.price);

    if (!Number.isFinite(price) || price < 0) {
      throw new Error(
        "Product does not have a valid price."
      );
    }

    return {
      price,
      variant: null,
    };
  }

  /* Variant product */

  const variant = findMatchingVariant(
    product,
    selections
  );

  if (!variant) {
    throw new Error(
      "The selected product variant is unavailable."
    );
  }

  const price = Number(variant.price);

  if (!Number.isFinite(price) || price < 0) {
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

const validateCartItem = async (
  productId,
  requestedSelections = {}
) => {
  if (!productId) {
    throw new Error("Product ID is required.");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  if (product.status !== "active") {
    throw new Error(
      "This product is currently unavailable."
    );
  }

  const normalizedSelections =
    normalizeSelections(requestedSelections);

  /*
   * Validate required order selections.
   */

  const orderSelections = Array.isArray(
    product.orderSelections
  )
    ? product.orderSelections
    : [];

  for (const selection of orderSelections) {
    if (!selection?.required) {
      continue;
    }

    const name = normalizeValue(selection.name);

    if (!name) {
      continue;
    }

    const selectedValue = normalizeValue(
      normalizedSelections[name]
    );

    if (!selectedValue) {
      throw new Error(
        `Please select ${name}.`
      );
    }

    const allowedValues = Array.isArray(
      selection.values
    )
      ? selection.values.map(normalizeValue)
      : [];

    if (
      allowedValues.length > 0 &&
      !allowedValues.includes(selectedValue)
    ) {
      throw new Error(
        `Invalid selection for ${name}.`
      );
    }
  }

  const { price, variant } =
    getProductPrice(
      product,
      normalizedSelections
    );

  return {
    product,
    validatedSelections:
      normalizedSelections,
    price,
    variant,
  };
};

/* ============================================================
   PRINT UNIT ID
============================================================ */

const generateUnitId = () => {
  return `unit_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

/* ============================================================
   EMPTY PRINT UNIT
============================================================ */

const createPrintUnit = () => {
  return {
    unitId: generateUnitId(),
    images: [],
  };
};

/* ============================================================
   CREATE PRINT UNITS
============================================================ */

const createPrintUnits = (quantity) => {
  const safeQuantity = Math.max(
    1,
    Number(quantity) || 1
  );

  return Array.from(
    {
      length: safeQuantity,
    },
    () => createPrintUnit()
  );
};

/* ============================================================
   NORMALIZE PRINT UNITS
============================================================ */

const normalizePrintUnits = (item) => {
  const quantity = Math.min(
    MAX_CART_QUANTITY,
    Math.max(
      1,
      Number(item?.quantity) || 1
    )
  );

  const existingUnits = Array.isArray(
    item?.printUnits
  )
    ? item.printUnits
    : [];

  const units = [];

  for (
    let index = 0;
    index < quantity;
    index++
  ) {
    const existing = existingUnits[index];

    if (!existing) {
      units.push(createPrintUnit());
      continue;
    }

    const images = Array.isArray(
      existing.images
    )
      ? existing.images
          .slice(0, MAX_PRINT_IMAGES)
          .map((image) => ({
            url: normalizeValue(
              image?.url
            ),
            publicId: normalizeValue(
              image?.publicId
            ),
          }))
          .filter(
            (image) =>
              image.url &&
              image.publicId
          )
      : [];

    units.push({
      unitId:
        normalizeValue(existing.unitId) ||
        generateUnitId(),

      images,
    });
  }

  return units;
};

/* ============================================================
   SYNC PRINT UNITS
============================================================ */

const syncPrintUnitsToQuantity = (item) => {
  item.printUnits =
    normalizePrintUnits(item);
};

/* ============================================================
   VALIDATE PRINT UNITS
============================================================ */

const validatePrintUnits = (
  printUnits,
  quantity
) => {
  if (!Array.isArray(printUnits)) {
    throw new Error(
      "Print customization is required."
    );
  }

  const expectedQuantity = Number(quantity);

  if (
    printUnits.length !==
    expectedQuantity
  ) {
    throw new Error(
      `Please provide print images for all ${expectedQuantity} physical product${
        expectedQuantity === 1
          ? ""
          : "s"
      }.`
    );
  }

  return printUnits.map(
    (unit, index) => {
      const images = Array.isArray(
        unit?.images
      )
        ? unit.images
        : [];

      if (images.length < 1) {
        throw new Error(
          `Product ${index + 1} requires at least 1 image.`
        );
      }

      if (
        images.length >
        MAX_PRINT_IMAGES
      ) {
        throw new Error(
          `Product ${index + 1} can have maximum ${MAX_PRINT_IMAGES} images.`
        );
      }

      const cleanImages =
        images.map((image) => {
          const url = normalizeValue(
            image?.url
          );

          const publicId =
            normalizeValue(
              image?.publicId
            );

          if (!url || !publicId) {
            throw new Error(
              `Product ${index + 1} contains an invalid image.`
            );
          }

          return {
            url,
            publicId,
          };
        });

      return {
        unitId:
          normalizeValue(
            unit?.unitId
          ) || generateUnitId(),

        images: cleanImages,
      };
    }
  );
};

/* ============================================================
   PRODUCT WEIGHT
============================================================ */

const getProductWeight = (
  product
) => {
  const weight = Number(
    product?.weight
  );

  if (
    Number.isFinite(weight) &&
    weight > 0
  ) {
    return weight;
  }

  return DEFAULT_PRODUCT_WEIGHT;
};

/* ============================================================
   SHIPPING
============================================================ */

const calculateShippingCharge = (
  items = []
) => {
  let totalWeight = 0;

  for (const item of items) {
    const product = item?.__product;

    const productWeight =
      getProductWeight(product);

    const quantity = Math.max(
      0,
      Number(item?.quantity) || 0
    );

    totalWeight +=
      productWeight * quantity;
  }

  if (totalWeight <= 0) {
    return 0;
  }

  return (
    Math.ceil(
      totalWeight /
        SHIPPING_WEIGHT_UNIT
    ) *
    SHIPPING_RATE_PER_100G
  );
};

/* ============================================================
   ATTACH CURRENT PRODUCTS
============================================================ */

const attachProducts = async (
  items = []
) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const productIds = items
    .map((item) => item?.productId)
    .filter(Boolean);

  if (productIds.length === 0) {
    return items.map((item) => ({
      ...(item.toObject
        ? item.toObject()
        : { ...item }),
      __product: null,
    }));
  }

  const products = await Product.find({
    _id: {
      $in: productIds,
    },
  }).lean();

  const productMap = new Map(
    products.map((product) => [
      product._id.toString(),
      product,
    ])
  );

  return items.map((item) => {
    const plainItem =
      item.toObject
        ? item.toObject()
        : { ...item };

    const product =
      productMap.get(
        String(item.productId)
      ) || null;

    return {
      ...plainItem,
      __product: product,
    };
  });
};

/* ============================================================
   BUILD CART RESPONSE
============================================================ */

const buildCartResponse = (
  items = []
) => {
  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  const itemCount = items.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity || 0),
    0
  );

  const shippingCharge =
    calculateShippingCharge(
      items
    );

  return {
    items,
    subtotal,
    shippingCharge,
    total:
      subtotal +
      shippingCharge,
    itemCount,
  };
};

/* ============================================================
   SAFE CART RESPONSE
============================================================ */

const sanitizeCartItems = (
  items = []
) => {
  return items.map((item) => {
    const {
      __product,
      weight,
      ...safeItem
    } = item;

    return safeItem;
  });
};

/* ============================================================
   RETURN FRESH CART
============================================================ */

const sendCartResponse = async (
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

  return res.status(statusCode).json({
    success: true,

    ...(message
      ? { message }
      : {}),

    cart: {
      ...cartData,
      items: safeItems,
    },
  });
};

/* ============================================================
   GET CART
============================================================ */

export const getCart = async (
  req,
  res
) => {
  try {
    const userId =
      req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthenticated.",
      });
    }

    let cart =
      await Cart.findOne({
        userId,
      });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
      });

      await cart.save();
    }

    /*
     * Clean/normalize legacy cart
     * records before returning them.
     */

    let changed = false;

    for (const item of cart.items) {
      const before =
        JSON.stringify(
          item.printUnits || []
        );

      syncPrintUnitsToQuantity(
        item
      );

      const after =
        JSON.stringify(
          item.printUnits || []
        );

      if (before !== after) {
        changed = true;
      }
    }

    if (changed) {
      await cart.save();
    }

    return sendCartResponse(
      res,
      cart
    );
  } catch (error) {
    console.error(
      "Get Cart Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get cart.",
    });
  }
};

/* ============================================================
   ADD ITEM
============================================================ */

export const addItem = async (
  req,
  res
) => {
  try {
    const userId =
      req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthenticated.",
      });
    }

    const {
      productId,
      quantity:
        requestedQuantity,
      selections = {},
    } = req.body;

    const quantity =
      normalizeQuantity(
        requestedQuantity
      );

    if (!quantity) {
      return res.status(400).json({
        success: false,
        message:
          `Quantity must be between 1 and ${MAX_CART_QUANTITY}.`,
      });
    }

    const {
      product,
      validatedSelections,
      price,
    } =
      await validateCartItem(
        productId,
        selections
      );

    const itemKey =
      generateItemKey(
        product._id.toString(),
        validatedSelections
      );

    let cart =
      await Cart.findOne({
        userId,
      });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
      });
    }

    const existingItem =
      cart.items.find(
        (item) =>
          item.itemKey ===
          itemKey
      );

    if (existingItem) {
      syncPrintUnitsToQuantity(
        existingItem
      );

      const oldQuantity =
        Number(
          existingItem.quantity
        ) || 0;

      const newQuantity =
        Math.min(
          MAX_CART_QUANTITY,
          oldQuantity +
            quantity
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

    return sendCartResponse(
      res,
      cart,
      200,
      "Item added to cart."
    );
  } catch (error) {
    console.error(
      "Add To Cart Error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error?.message ||
        "Failed to add item to cart.",
    });
  }
};

/* ============================================================
   UPDATE QUANTITY
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
        return res.status(401).json({
          success: false,
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

      if (!quantity) {
        return res.status(400).json({
          success: false,
          message:
            `Quantity must be between 1 and ${MAX_CART_QUANTITY}.`,
        });
      }

      if (!itemId) {
        return res.status(400).json({
          success: false,
          message:
            "Cart item identifier is required.",
        });
      }

      const cart =
        await Cart.findOne({
          userId,
        });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message:
            "Cart not found.",
        });
      }

      const item =
        cart.items.find(
          (cartItem) =>
            String(
              cartItem?._id
            ) === itemId ||
            String(
              cartItem?.itemKey
            ) === itemId
        );

      if (!item) {
        return res.status(404).json({
          success: false,
          message:
            "Item not found in cart.",
        });
      }

      /*
       * Validate the current product
       * before changing quantity.
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
       * IMPORTANT:
       *
       * Quantity and printUnits are
       * always synchronized.
       *
       * Existing images remain.
       * Extra units are removed.
       * New units are empty.
       */

      syncPrintUnitsToQuantity(
        item
      );

      await cart.save();

      return sendCartResponse(
        res,
        cart,
        200,
        "Cart quantity updated."
      );
    } catch (error) {
      console.error(
        "Update Quantity Error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error?.message ||
          "Failed to update quantity.",
      });
    }
  };

/* ============================================================
   REMOVE ITEM
============================================================ */

export const removeItem = async (
  req,
  res
) => {
  try {
    const userId =
      req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Unauthenticated.",
      });
    }

    const itemId =
      normalizeValue(
        req.params?.itemId
      );

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message:
          "Cart item identifier is required.",
      });
    }

    /*
     * VERY IMPORTANT:
     *
     * We first locate the authenticated
     * user's cart.
     *
     * Therefore a cart item ID belonging
     * to another user can never be removed.
     */

    const cart =
      await Cart.findOne({
        userId,
      });

    if (!cart) {
      /*
       * Treat an already-empty/nonexistent
       * cart as empty instead of leaving
       * the frontend with stale data.
       */

      return res.status(200).json({
        success: true,
        message:
          "Cart is already empty.",

        cart: {
          items: [],
          subtotal: 0,
          shippingCharge: 0,
          total: 0,
          itemCount: 0,
        },
      });
    }

    /*
     * Match MongoDB cart-item _id first.
     *
     * itemKey is supported as a fallback
     * for older frontend/cart records.
     */

    const originalLength =
      cart.items.length;

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

          const matches =
            mongoItemId ===
              itemId ||
            itemKey ===
              itemId;

          return !matches;
        }
      );

    /*
     * If nothing was removed, return
     * a clear 404 instead of pretending
     * deletion succeeded.
     */

    if (
      cart.items.length ===
      originalLength
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Item not found in cart.",
      });
    }

    /*
     * Save the actual modified cart.
     *
     * This is the critical operation
     * missing in the broken controller.
     */

    await cart.save();

    /*
     * Return the COMPLETE fresh cart.
     *
     * Frontend can replace its state
     * directly with this response.
     */

    return sendCartResponse(
      res,
      cart,
      200,
      "Item removed from cart."
    );
  } catch (error) {
    console.error(
      "Remove Item Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to remove item from cart.",
    });
  }
};

/* ============================================================
   CLEAR CART
============================================================ */

export const clearCart = async (
  req,
  res
) => {
  try {
    const userId =
      req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Unauthenticated.",
      });
    }

    /*
     * Only the authenticated user's
     * cart is modified.
     */

    const cart =
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
          setDefaultsOnInsert: true,
        }
      );

    return res.status(200).json({
      success: true,

      message:
        "Cart cleared.",

      cart: {
        items: [],
        subtotal: 0,
        shippingCharge: 0,
        total: 0,
        itemCount: 0,
      },
    });
  } catch (error) {
    console.error(
      "Clear Cart Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to clear cart.",
    });
  }
};

/* ============================================================
   MERGE GUEST CART
============================================================ */

export const mergeCart = async (
  req,
  res
) => {
  try {
    const userId =
      req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Unauthenticated.",
      });
    }

    const {
      items = [],
    } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid cart items.",
      });
    }

    let cart =
      await Cart.findOne({
        userId,
      });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
      });
    }

    const messages = [];

    /*
     * Process each guest item independently.
     *
     * One invalid guest item must not
     * destroy the user's server cart.
     */

    for (const guestItem of items) {
      try {
        const guestQuantity =
          normalizeQuantity(
            guestItem?.quantity
          );

        if (!guestQuantity) {
          continue;
        }

        const {
          product,
          validatedSelections,
          price,
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

        let guestUnits =
          Array.isArray(
            guestItem?.printUnits
          )
            ? guestItem.printUnits
                .slice(
                  0,
                  guestQuantity
                )
                .map((unit) => ({
                  unitId:
                    normalizeValue(
                      unit?.unitId
                    ) ||
                    generateUnitId(),

                  images:
                    Array.isArray(
                      unit?.images
                    )
                      ? unit.images
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
                      : [],
                }))
            : [];

        while (
          guestUnits.length <
          guestQuantity
        ) {
          guestUnits.push(
            createPrintUnit()
          );
        }

        const existingItem =
          cart.items.find(
            (item) =>
              item.itemKey ===
              itemKey
          );

        if (existingItem) {
          /*
           * Existing server item.
           */

          syncPrintUnitsToQuantity(
            existingItem
          );

          const oldQuantity =
            Number(
              existingItem.quantity
            ) || 0;

          const allowedAdditional =
            Math.max(
              0,
              MAX_CART_QUANTITY -
                oldQuantity
            );

          const quantityToAdd =
            Math.min(
              guestQuantity,
              allowedAdditional
            );

          if (
            quantityToAdd <= 0
          ) {
            continue;
          }

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
           * Preserve existing units.
           * New guest units are appended.
           */

          const existingUnits =
            normalizePrintUnits(
              existingItem
            );

          const newGuestUnits =
            guestUnits.slice(
              0,
              quantityToAdd
            );

          existingItem.printUnits =
            existingUnits.concat(
              newGuestUnits
            );

          syncPrintUnitsToQuantity(
            existingItem
          );
        } else {
          /*
           * New server item.
           */

          const limitedQuantity =
            guestQuantity;

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
              limitedQuantity,

            selections:
              validatedSelections,

            printUnits:
              guestUnits.slice(
                0,
                limitedQuantity
              ),
          });
        }
      } catch (error) {
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

    return sendCartResponse(
      res,
      cart,
      200,
      "Cart merged successfully."
    ).then(() => {
      /*
       * sendCartResponse already sent the
       * response, so this branch is intentionally
       * left here for compatibility.
       */
    });
  } catch (error) {
    console.error(
      "Merge Cart Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to merge cart.",
    });
  }
};

/* ============================================================
   UPLOAD PRINT IMAGE
============================================================ */

export const uploadPrintImage =
  async (
    req,
    res
  ) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please select an image.",
        });
      }

      if (
        !req.file.mimetype?.startsWith(
          "image/"
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only image files are allowed.",
        });
      }

      if (
        req.file.size >
        10 * 1024 * 1024
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Image must be 10MB or smaller.",
        });
      }

      const result =
        await new Promise(
          (
            resolve,
            reject
          ) => {
            const uploadStream =
              cloudinary.uploader.upload_stream(
                {
                  folder:
                    "new_print_cart_prints",

                  resource_type:
                    "image",
                },

                (
                  error,
                  uploaded
                ) => {
                  if (error) {
                    reject(error);
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
        return res.status(500).json({
          success: false,
          message:
            "Cloudinary did not return a valid image.",
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Print image uploaded successfully.",

        image: {
          url:
            result.secure_url,

          publicId:
            result.public_id,
        },
      });
    } catch (error) {
      console.error(
        "Print Image Upload Error:",
        error
      );

      return res.status(500).json({
        success: false,
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
        return res.status(401).json({
          success: false,
          message:
            "Unauthenticated.",
        });
      }

      const itemId =
        normalizeValue(
          req.params?.itemId
        );

      const {
        printUnits,
      } = req.body;

      if (!Array.isArray(printUnits)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid print units.",
        });
      }

      if (!itemId) {
        return res.status(400).json({
          success: false,
          message:
            "Cart item identifier is required.",
        });
      }

      const cart =
        await Cart.findOne({
          userId,
        });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message:
            "Cart not found.",
        });
      }

      const item =
        cart.items.find(
          (cartItem) =>
            String(
              cartItem?._id
            ) === itemId ||
            String(
              cartItem?.itemKey
            ) === itemId
        );

      if (!item) {
        return res.status(404).json({
          success: false,
          message:
            "Cart item not found.",
        });
      }

      /*
       * Revalidate product before
       * saving customization.
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

      item.price =
        price;

      item.name =
        product.name;

      item.image =
        product.images?.[0] ||
        "";

      item.selections =
        validatedSelections;

      const validatedUnits =
        validatePrintUnits(
          printUnits,
          item.quantity
        );

      item.printUnits =
        validatedUnits;

      await cart.save();

      return sendCartResponse(
        res,
        cart,
        200,
        "Print images saved successfully."
      );
    } catch (error) {
      console.error(
        "Update Print Customization Error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error?.message ||
          "Failed to save print images.",
      });
    }
  };