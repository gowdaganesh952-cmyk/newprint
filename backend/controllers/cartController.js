import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_PRINT_IMAGES = 6;

const SHIPPING_RATE_PER_100G = 15;

const SHIPPING_WEIGHT_UNIT = 100;

const MAX_CART_QUANTITY = 100;

/* ============================================================
   BASIC HELPERS
============================================================ */

const normalizeValue = (
  value
) => {
  return String(
    value ?? ""
  ).trim();
};

/* ============================================================
   QUANTITY HELPER
============================================================ */

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

/* ============================================================
   SELECTION HELPERS
============================================================ */

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
            normalizeValue(
              key
            ),
            normalizeValue(
              value
            ),
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
            normalizeValue(
              key
            ),
            normalizeValue(
              value
            ),
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
   GENERATE ITEM KEY
============================================================ */

/*
 * Same product + same selections
 * = same cart line.
 *
 * Different selections
 * = different cart line.
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
    entries.length ===
    0
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
   SELECTION MATCHING
============================================================ */

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
   PRODUCT VARIANT
============================================================ */

const findMatchingVariant = (
  product,
  selections
) => {
  if (
    product.pricingType !==
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
    product.pricingType !==
    "variants"
  ) {
    const price =
      Number(
        product.price
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

const validateCartItem =
  async (
    productId,
    requestedSelections = {}
  ) => {
    if (!productId) {
      throw new Error(
        "Product ID is required."
      );
    }

    const product =
      await Product.findById(
        productId
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

    const normalizedSelections =
      normalizeSelections(
        requestedSelections
      );

    /*
     * Validate required customer
     * selections.
     */

    const orderSelections =
      Array.isArray(
        product.orderSelections
      )
        ? product.orderSelections
        : [];

    for (
      const selection of
        orderSelections
    ) {
      if (
        !selection?.required
      ) {
        continue;
      }

      const name =
        normalizeValue(
          selection.name
        );

      if (!name) {
        continue;
      }

      const selectedValue =
        normalizeValue(
          normalizedSelections[
            name
          ]
        );

      if (!selectedValue) {
        throw new Error(
          `Please select ${name}.`
        );
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
        allowedValues.length >
          0 &&
        !allowedValues.includes(
          selectedValue
        )
      ) {
        throw new Error(
          `Invalid selection for ${name}.`
        );
      }
    }

    /*
     * If product uses variants,
     * validate the exact variant.
     */

    const {
      price,
      variant,
    } =
      getProductPrice(
        product,
        normalizedSelections
      );

    /*
     * Return only the product
     * information required by
     * the cart.
     */

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

const generateUnitId =
  () => {
    return `unit_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  };

/* ============================================================
   CREATE PRINT UNIT
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
      Math.max(
        1,
        Number(
          quantity
        ) || 1
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

const normalizePrintUnits =
  (item) => {
    const quantity =
      Math.max(
        1,
        Number(
          item?.quantity
        ) || 1
      );

    const existingUnits =
      Array.isArray(
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
      const existing =
        existingUnits[
          index
        ];

      if (
        existing
      ) {
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
      } else {
        units.push(
          createPrintUnit()
        );
      }
    }

    return units;
  };

/* ============================================================
   SYNC PRINT UNITS TO QUANTITY
============================================================ */

const syncPrintUnitsToQuantity =
  (item) => {
    item.printUnits =
      normalizePrintUnits(
        item
      );
  };

/* ============================================================
   VALIDATE PRINT UNITS
============================================================ */

const validatePrintUnits = (
  printUnits,
  quantity
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

  return printUnits.map(
    (
      unit,
      index
    ) => {
      const images =
        Array.isArray(
          unit?.images
        )
          ? unit.images
          : [];

      /*
       * Minimum:
       *
       * 1 image
       */

      if (
        images.length <
        1
      ) {
        throw new Error(
          `Product ${
            index + 1
          } requires at least 1 image.`
        );
      }

      /*
       * Maximum:
       *
       * 6 images
       */

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
                } contains an invalid image.`
              );
            }

            return {
              url,
              publicId,
            };
          }
        );

      return {
        unitId:
          normalizeValue(
            unit?.unitId
          ) ||
          generateUnitId(),

        images:
          cleanImages,
      };
    }
  );
};

/* ============================================================
   PRODUCT WEIGHT
============================================================ */

/*
 * Weight comes ONLY from Product.
 *
 * It is NEVER stored in the cart item
 * response and NEVER returned to the
 * customer.
 */

const getProductWeight =
  (product) => {
    const weight =
      Number(
        product?.weight
      );

    if (
      Number.isFinite(
        weight
      ) &&
      weight > 0
    ) {
      return weight;
    }

    /*
     * Safe fallback for older
     * products.
     */

    return 100;
  };

/* ============================================================
   SHIPPING CALCULATION
============================================================ */

/*
 * Shipping rate:
 *
 * 1–100g       = ₹15
 * 101–200g     = ₹30
 * 201–300g     = ₹45
 * 301–400g     = ₹60
 *
 * Formula:
 *
 * ceil(total grams / 100) × 15
 *
 * Example:
 *
 * Product A:
 * 250g × 2
 *
 * Product B:
 * 150g × 1
 *
 * Total:
 * 650g
 *
 * Shipping:
 * ceil(650 / 100) × 15
 * = 7 × 15
 * = ₹105
 */

const calculateShippingCharge =
  (items = []) => {
    let totalWeight =
      0;

    for (
      const item of
        items
    ) {
      const product =
        item?.__product;

      const productWeight =
        getProductWeight(
          product
        );

      const quantity =
        Math.max(
          0,
          Number(
            item?.quantity
          ) || 0
        );

      totalWeight +=
        productWeight *
        quantity;
    }

    if (
      totalWeight <=
      0
    ) {
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
   ATTACH PRODUCTS
============================================================ */

/*
 * Product documents are attached
 * temporarily using __product.
 *
 * __product is removed before
 * sending the response.
 */

const attachProducts =
  async (
    items
  ) => {
    const productIds =
      items
        .map(
          (item) =>
            item.productId
        )
        .filter(Boolean);

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
          item.toObject
            ? item.toObject()
            : {
                ...item,
              };

        const product =
          productMap.get(
            String(
              item.productId
            )
          );

        return {
          ...plainItem,

          __product:
            product ||
            null,
        };
      }
    );
  };

/* ============================================================
   BUILD CART RESPONSE
============================================================ */

const buildCartResponse =
  (items = []) => {
    const subtotal =
      items.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.price
          ) *
            Number(
              item.quantity
            ),
        0
      );

    const itemCount =
      items.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.quantity
          ),
        0
      );

    const shippingCharge =
      calculateShippingCharge(
        items
      );

    const total =
      subtotal +
      shippingCharge;

    return {
      items,

      subtotal,

      shippingCharge,

      total,

      itemCount,
    };
  };

/* ============================================================
   SAFE CART RESPONSE
============================================================ */

/*
 * NEVER send:
 *
 * __product
 * weight
 * totalWeight
 *
 * Customer receives only:
 *
 * items
 * subtotal
 * shippingCharge
 * total
 * itemCount
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

        /*
         * Explicitly remove any old
         * weight field that may still
         * exist in legacy cart data.
         */

        return safeItem;
      }
    );
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
        req.auth.userId;

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
      }

      /*
       * Normalize old carts.
       */

      for (
        const item of
          cart.items
      ) {
        syncPrintUnitsToQuantity(
          item
        );
      }

      await cart.save();

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
        success: true,

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
        "Get Cart Error:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,

        message:
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
        req.auth.userId;

      const {
        productId,
        quantity: requestedQuantity,
        selections = {},
      } = req.body;

      const quantity =
        normalizeQuantity(
          requestedQuantity
        );

      if (
        !quantity
      ) {
        return res.status(
          400
        ).json({
          success: false,

          message:
            `Quantity must be between 1 and ${MAX_CART_QUANTITY}.`,
        });
      }

      /*
       * Validate product and get
       * real backend price.
       */

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
        cart =
          new Cart({
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

      if (
        existingItem
      ) {
        /*
         * Preserve existing images.
         */

        syncPrintUnitsToQuantity(
          existingItem
        );

        const oldQuantity =
          Number(
            existingItem.quantity
          );

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

        /*
         * Add empty physical
         * product units.
         */

        syncPrintUnitsToQuantity(
          existingItem
        );
      } else {
        /*
         * New cart line.
         */

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
        success: true,

        message:
          "Item added to cart.",

        cart: {
          ...cartData,

          items:
            safeItems,
        },
      });
  } catch (error) {
    console.error(
      "========================================"
    );

    console.error(
      "ADD TO CART ERROR"
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Stack:",
      error?.stack
    );

    console.error(
      "Request body:",
      req.body
    );

    console.error(
      "========================================"
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
        req.auth.userId;

      const {
        itemId,
      } = req.params;

      const {
        quantity:
          requestedQuantity,
      } = req.body;

      const quantity =
        normalizeQuantity(
          requestedQuantity
        );

      if (
        !quantity
      ) {
        return res.status(
          400
        ).json({
          success: false,

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
          success: false,

          message:
            "Cart not found.",
        });
      }

      const item =
        cart.items.find(
          (cartItem) =>
            cartItem._id.toString() ===
            itemId
        );

      if (!item) {
        return res.status(
          404
        ).json({
          success: false,

          message:
            "Item not found in cart.",
        });
      }

      /*
       * Preserve existing images
       * when changing quantity.
       */

      syncPrintUnitsToQuantity(
        item
      );

      item.quantity =
        quantity;

      /*
       * Increasing quantity:
       * empty units are created.
       *
       * Decreasing quantity:
       * extra units are removed
       * from the end.
       *
       * Existing images are preserved.
       */

      syncPrintUnitsToQuantity(
        item
      );

      /*
       * Revalidate product and price.
       *
       * This prevents stale cart
       * pricing from being trusted.
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

      await cart.save();

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
        success: true,

        message:
          "Cart quantity updated.",

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
        "Update Quantity Error:",
        error
      );

      return res.status(
        400
      ).json({
        success: false,

        message:
          error.message ||
          "Failed to update quantity.",
      });
    }
  };

/* ============================================================
   REMOVE ITEM
============================================================ */

/* ============================================================
   REMOVE ITEM
============================================================ */

export const removeItem =
  async (
    req,
    res
  ) => {
    // code above
  };

/* ============================================================
   CLEAR CART
============================================================ */
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
        req.auth.userId;

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
        }
      );

      return res.status(
        200
      ).json({
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
        success: false,

        message:
          "Failed to clear cart.",
      });
    }
  };

/* ============================================================
   MERGE GUEST CART
============================================================ */

export const mergeCart =
  async (
    req,
    res
  ) => {
    try {
      const userId =
        req.auth.userId;

      const {
        items = [],
      } = req.body;

      if (
        !Array.isArray(
          items
        )
      ) {
        return res.status(
          400
        ).json({
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
        cart =
          new Cart({
            userId,
            items: [],
          });
      }

      const messages =
        [];

      /*
       * Merge each guest cart
       * item independently.
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
            continue;
          }

          /*
           * Validate product again.
           */

          const {
            product,
            validatedSelections,
            price,
          } =
            await validateCartItem(
              guestItem.productId,
              guestItem.selections
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
           * Sanitize guest print
           * units.
           */

          let guestUnits =
            Array.isArray(
              guestItem.printUnits
            )
              ? guestItem.printUnits
                  .slice(
                    0,
                    guestQuantity
                  )
                  .map(
                    (unit) => ({
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
                                (
                                  image
                                ) => ({
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
                                (
                                  image
                                ) =>
                                  image.url &&
                                  image.publicId
                              )
                          : [],
                    })
                  )
              : [];

          /*
           * Ensure exactly one
           * physical unit per
           * quantity.
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
           * Existing server cart item.
           */

          if (
            existingItem
          ) {
            syncPrintUnitsToQuantity(
              existingItem
            );

            const oldQuantity =
              Number(
                existingItem.quantity
              );

            const newQuantity =
              Math.min(
                MAX_CART_QUANTITY,
                oldQuantity +
                  guestQuantity
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

            /*
             * Preserve existing units
             * and create new units.
             */

            syncPrintUnitsToQuantity(
              existingItem
            );

            /*
             * Guest images belong to
             * the newly-added physical
             * products.
             */

            const oldUnitCount =
              Math.min(
                oldQuantity,
                existingItem
                  .printUnits
                  .length
              );

            for (
              let index = 0;
              index <
                guestUnits.length &&
              oldUnitCount +
                index <
                existingItem
                  .printUnits
                  .length;
              index++
            ) {
              const guestUnit =
                guestUnits[
                  index
                ];

              const targetUnit =
                existingItem
                  .printUnits[
                  oldUnitCount +
                    index
                ];

              if (
                targetUnit &&
                guestUnit
              ) {
                targetUnit.images =
                  guestUnit.images;
              }
            }
          } else {
            /*
             * New server cart item.
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
        } catch (
          error
        ) {
          /*
           * Do not let one invalid
           * guest item prevent the
           * rest of the cart from
           * merging.
           */

          messages.push(
            error.message ||
              "One cart item could not be merged."
          );
        }
      }

      await cart.save();

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
        success: true,

        message:
          "Cart merged successfully.",

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
        success: false,

        message:
          "Failed to merge cart.",
      });
    }
  };

/* ============================================================
   UPLOAD PRINT IMAGE
============================================================ */

/*
 * POST
 * /api/cart/print-image
 *
 * The multer middleware before
 * this controller already enforces:
 *
 * - image only
 * - 10MB maximum
 *
 * This endpoint uploads ONE image.
 *
 * The 6-image-per-physical-product
 * rule is enforced when the frontend
 * saves print customization.
 */

export const uploadPrintImage =
  async (
    req,
    res
  ) => {
    try {
      if (
        !req.file
      ) {
        return res.status(
          400
        ).json({
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
        return res.status(
          400
        ).json({
          success: false,

          message:
            "Only image files are allowed.",
        });
      }

      /*
       * Extra controller-side
       * 10MB protection.
       *
       * Multer also enforces this.
       */

      if (
        req.file.size >
        10 * 1024 * 1024
      ) {
        return res.status(
          400
        ).json({
          success: false,

          message:
            "Image must be 10MB or smaller.",
        });
      }

      /*
       * Upload to Cloudinary.
       */

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
          success: false,

          message:
            "Cloudinary did not return a valid image.",
        });
      }

      /*
       * Only return image information.
       *
       * Do NOT return:
       *
       * product weight
       * total weight
       * shipping information
       */

      return res.status(
        200
      ).json({
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
        success: false,

        message:
          "Failed to upload print image.",
      });
    }
  };

/* ============================================================
   SAVE PRINT CUSTOMIZATION
============================================================ */

/*
 * PATCH
 * /api/cart/items/:itemId/print-customization
 *
 * Rules:
 *
 * quantity = 1
 *   -> exactly 1 printUnit
 *   -> 1–6 images
 *
 * quantity = 2
 *   -> exactly 2 printUnits
 *   -> each has 1–6 images
 *
 * quantity = 3
 *   -> exactly 3 printUnits
 *   -> each has 1–6 images
 *
 * etc.
 */

export const updatePrintCustomization =
  async (
    req,
    res
  ) => {
    try {
      const userId =
        req.auth.userId;

      const {
        itemId,
      } = req.params;

      const {
        printUnits,
      } = req.body;

      if (
        !Array.isArray(
          printUnits
        )
      ) {
        return res.status(
          400
        ).json({
          success: false,

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
          success: false,

          message:
            "Cart not found.",
        });
      }

      const item =
        cart.items.find(
          (cartItem) =>
            cartItem._id.toString() ===
            itemId
        );

      if (!item) {
        return res.status(
          404
        ).json({
          success: false,

          message:
            "Cart item not found.",
        });
      }

      /*
       * Exactly quantity physical
       * units.
       *
       * Every unit:
       *
       * minimum 1 image
       * maximum 6 images
       */

      const validatedUnits =
        validatePrintUnits(
          printUnits,
          item.quantity
        );

      item.printUnits =
        validatedUnits;

      await cart.save();

      /*
       * Reattach products so
       * shipping is calculated
       * correctly.
       */

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
        success: true,

        message:
          "Print images saved successfully.",

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
        "Update Print Customization Error:",
        error
      );

      return res.status(
        400
      ).json({
        success: false,

        message:
          error.message ||
          "Failed to save print images.",
      });
    }
  };