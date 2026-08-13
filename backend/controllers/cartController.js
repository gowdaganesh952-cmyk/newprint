import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_PRINT_IMAGES = 3;

/* ============================================================
   BASIC HELPERS
============================================================ */

const normalizeValue = (value) => {
  return String(value ?? "").trim();
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

  if (selections instanceof Map) {
    return Object.fromEntries(
      selections.entries()
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
        .filter(
          ([key, value]) =>
            key.length > 0 &&
            value.length > 0
        )
    );
  }

  return {};
};

/* ============================================================
   GENERATE ITEM KEY
============================================================ */

const generateItemKey = (
  productId,
  selections = {}
) => {
  const normalizedSelections =
    normalizeSelections(
      selections
    );

  const sortedEntries =
    Object.entries(
      normalizedSelections
    ).sort(([a], [b]) =>
      a.localeCompare(b)
    );

  const selectionString =
    sortedEntries
      .map(
        ([key, value]) =>
          `${encodeURIComponent(
            key
          )}:${encodeURIComponent(
            value
          )}`
      )
      .join("|");

  return selectionString
    ? `${productId}|${selectionString}`
    : String(productId);
};

/* ============================================================
   COMPARE SELECTIONS
============================================================ */

const selectionsMatch = (
  first = {},
  second = {}
) => {
  const a =
    normalizeSelections(first);

  const b =
    normalizeSelections(second);

  const aKeys =
    Object.keys(a).sort();

  const bKeys =
    Object.keys(b).sort();

  if (
    aKeys.length !==
    bKeys.length
  ) {
    return false;
  }

  return aKeys.every(
    (key, index) => {
      if (
        key !==
        bKeys[index]
      ) {
        return false;
      }

      return (
        normalizeValue(
          a[key]
        ) ===
        normalizeValue(
          b[key]
        )
      );
    }
  );
};

/* ============================================================
   GENERATE PRINT UNIT ID
============================================================ */

const generateUnitId = () => {
  return `unit_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

/* ============================================================
   CREATE EMPTY PRINT UNIT
============================================================ */

const createPrintUnit = () => {
  return {
    unitId:
      generateUnitId(),

    images: [],
  };
};

/* ============================================================
   CREATE PRINT UNITS
============================================================ */

const createPrintUnits = (
  quantity
) => {
  const safeQuantity =
    Math.max(
      1,
      Number(quantity) || 1
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
 * Makes sure:
 *
 * printUnits.length === quantity
 *
 * Existing images are preserved.
 *
 * Missing units are created empty.
 *
 * Extra units are removed from the end.
 */

const normalizePrintUnits = (
  item
) => {
  const quantity =
    Math.max(
      1,
      Number(
        item?.quantity || 1
      )
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
      existingUnits[index];

    if (existing) {
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
   SYNC PRINT UNITS WITH QUANTITY
============================================================ */

const syncPrintUnitsToQuantity = (
  item
) => {
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
    Number(quantity);

  if (
    printUnits.length !==
    expectedQuantity
  ) {
    throw new Error(
      `Please provide print images for all ${expectedQuantity} product${expectedQuantity === 1 ? "" : "s"}.`
    );
  }

  return printUnits.map(
    (unit, index) => {
      const images =
        Array.isArray(
          unit?.images
        )
          ? unit.images
          : [];

      /*
       * Minimum 1 image.
       */
      if (
        images.length < 1
      ) {
        throw new Error(
          `Product ${
            index + 1
          } requires at least 1 image.`
        );
      }

      /*
       * Maximum 3 images.
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
   FIND MATCHING VARIANT
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
   GET PRODUCT PRICE
============================================================ */

const getProductPrice = (
  product,
  selections
) => {
  /*
   * Fixed-price product.
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
   * Variant product.
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
   VALIDATE PRODUCT + SELECTIONS + PRICE
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
        "Product is currently unavailable."
      );
    }

    const normalizedRequested =
      normalizeSelections(
        requestedSelections
      );

    const orderSelections =
      Array.isArray(
        product.orderSelections
      )
        ? product.orderSelections
        : [];

    const allowedSelectionNames =
      new Set(
        orderSelections.map(
          (selection) =>
            normalizeValue(
              selection.name
            )
        )
      );

    /*
     * Reject unknown selections.
     */
    for (
      const key of Object.keys(
        normalizedRequested
      )
    ) {
      if (
        !allowedSelectionNames.has(
          key
        )
      ) {
        throw new Error(
          `Invalid product selection: ${key}`
        );
      }
    }

    const validatedSelections =
      {};

    /*
     * Validate configured selections.
     */
    for (
      const reqSel of
        orderSelections
    ) {
      const name =
        normalizeValue(
          reqSel.name
        );

      const value =
        normalizeValue(
          normalizedRequested[
            name
          ]
        );

      /*
       * Required selection.
       */
      if (
        reqSel.required &&
        !value
      ) {
        throw new Error(
          `Missing required selection: ${name}`
        );
      }

      /*
       * Optional selection.
       */
      if (!value) {
        continue;
      }

      const allowedValues =
        Array.isArray(
          reqSel.values
        )
          ? reqSel.values.map(
              normalizeValue
            )
          : [];

      if (
        !allowedValues.includes(
          value
        )
      ) {
        throw new Error(
          `Invalid value for ${name}`
        );
      }

      validatedSelections[
        name
      ] = value;
    }

    /*
     * NEVER trust frontend price.
     */
    const {
      price,
      variant,
    } =
      getProductPrice(
        product,
        validatedSelections
      );

    return {
      product,
      validatedSelections,
      price,
      variant,
    };
  };

/* ============================================================
   CART TOTALS
============================================================ */

const calculateCartTotals =
  (items = []) => {
    const subtotal =
      items.reduce(
        (sum, item) =>
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
        (sum, item) =>
          sum +
          Number(
            item.quantity
          ),
        0
      );

    return {
      subtotal,
      itemCount,
    };
  };

/* ============================================================
   GET CART
============================================================ */

export const getCart =
  async (req, res) => {
    try {
      const userId =
        req.auth.userId;

      let cart =
        await Cart.findOne({
          userId,
        });

      /*
       * No cart yet.
       */
      if (!cart) {
        cart =
          await Cart.create({
            userId,
            items: [],
          });

        return res.status(200).json({
          success: true,

          cart: {
            items: [],
            subtotal: 0,
            itemCount: 0,
          },

          messages: [],
        });
      }

      let isModified =
        false;

      const messages = [];

      const validItems = [];

      /*
       * Reconcile every item against
       * the current product.
       */
      for (
        const item of cart.items
      ) {
        try {
          const {
            product,
            validatedSelections,
            price,
          } =
            await validateCartItem(
              item.productId,
              normalizeSelections(
                item.selections
              )
            );

          /*
           * Correct item key.
           */
          const correctItemKey =
            generateItemKey(
              product._id.toString(),
              validatedSelections
            );

          if (
            item.itemKey !==
            correctItemKey
          ) {
            item.itemKey =
              correctItemKey;

            isModified =
              true;
          }

          /*
           * Correct name.
           */
          if (
            item.name !==
            product.name
          ) {
            item.name =
              product.name;

            isModified =
              true;
          }

          /*
           * Correct main product image.
           */
          const latestImage =
            product.images?.[0] ||
            "";

          if (
            item.image !==
            latestImage
          ) {
            item.image =
              latestImage;

            isModified =
              true;
          }

          /*
           * Correct selections.
           */
          const oldSelections =
            normalizeSelections(
              item.selections
            );

          if (
            !selectionsMatch(
              oldSelections,
              validatedSelections
            )
          ) {
            item.selections =
              validatedSelections;

            isModified =
              true;
          }

          /*
           * Correct current price.
           */
          if (
            Number(
              item.price
            ) !==
            Number(price)
          ) {
            messages.push(
              `The price of ${
                product.name
              } has changed from ₹${Number(
                item.price
              ).toLocaleString(
                "en-IN"
              )} to ₹${Number(
                price
              ).toLocaleString(
                "en-IN"
              )}.`
            );

            item.price =
              price;

            isModified =
              true;
          }

          /*
           * IMPORTANT:
           *
           * Upgrade old cart items
           * to printUnits.
           */
          const beforeUnits =
            Array.isArray(
              item.printUnits
            )
              ? item.printUnits
                  .length
              : 0;

          syncPrintUnitsToQuantity(
            item
          );

          if (
            beforeUnits !==
            item.printUnits.length
          ) {
            isModified =
              true;
          }

          validItems.push(
            item
          );
        } catch (error) {
          messages.push(
            `${item.name} was removed from your cart because the selected product or variant is no longer available.`
          );

          isModified =
            true;
        }
      }

      /*
       * Save reconciliation.
       */
      if (isModified) {
        cart.items =
          validItems;

        await cart.save();
      }

      const {
        subtotal,
        itemCount,
      } =
        calculateCartTotals(
          cart.items
        );

      return res.status(200).json({
        success: true,

        cart: {
          items:
            cart.items,

          subtotal,

          itemCount,
        },

        messages,
      });
    } catch (error) {
      console.error(
        "Get Cart Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch cart.",
      });
    }
  };

/* ============================================================
   ADD ITEM
============================================================ */

export const addItem =
  async (req, res) => {
    try {
      const userId =
        req.auth.userId;

      const {
        productId,
        quantity = 1,
        selections = {},
      } = req.body;

      /*
       * Validate quantity.
       */
      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity < 1
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid quantity.",
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

      /*
       * Generate exact variant-aware
       * cart key.
       */
      const itemKey =
        generateItemKey(
          product._id.toString(),
          validatedSelections
        );

      let cart =
        await Cart.findOne({
          userId,
        });

      /*
       * Create cart if necessary.
       */
      if (!cart) {
        cart =
          new Cart({
            userId,
            items: [],
          });
      }

      /*
       * Find same product + same
       * selections.
       */
      const existingItem =
        cart.items.find(
          (item) =>
            item.itemKey ===
            itemKey
        );

      if (existingItem) {
        /*
         * Preserve existing physical
         * product units and images.
         */

        syncPrintUnitsToQuantity(
          existingItem
        );

        const oldQuantity =
          Number(
            existingItem.quantity
          );

        const newQuantity =
          oldQuantity +
          quantity;

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
         * Add empty units for newly
         * added physical products.
         */
        while (
          existingItem
            .printUnits
            .length <
          newQuantity
        ) {
          existingItem.printUnits.push(
            createPrintUnit()
          );
        }
      } else {
        /*
         * New cart line.
         *
         * Every physical product
         * gets its own empty unit.
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

      const {
        subtotal,
        itemCount,
      } =
        calculateCartTotals(
          cart.items
        );

      return res.status(200).json({
        success: true,

        message:
          "Item added to cart.",

        cart: {
          items:
            cart.items,

          subtotal,

          itemCount,
        },
      });
    } catch (error) {
      console.error(
        "Add Item Error:",
        error
      );

      return res.status(400).json({
        success: false,

        message:
          error.message ||
          "Failed to add item.",
      });
    }
  };

/* ============================================================
   UPDATE QUANTITY
============================================================ */

export const updateItemQuantity =
  async (req, res) => {
    try {
      const userId =
        req.auth.userId;

      const {
        itemId,
      } = req.params;

      const {
        quantity,
      } = req.body;

      /*
       * Validate quantity.
       */
      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity < 1
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid quantity.",
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
            cartItem._id.toString() ===
            itemId
        );

      if (!item) {
        return res.status(404).json({
          success: false,

          message:
            "Item not found in cart.",
        });
      }

      /*
       * Preserve existing units.
       */
      syncPrintUnitsToQuantity(
        item
      );

      const oldQuantity =
        Number(
          item.quantity
        );

      /*
       * Update quantity.
       */
      item.quantity =
        quantity;

      /*
       * Sync units.
       *
       * If increased:
       * new empty units are added.
       *
       * If decreased:
       * units are removed from the end.
       *
       * Earlier images remain.
       */
      syncPrintUnitsToQuantity(
        item
      );

      await cart.save();

      const {
        subtotal,
        itemCount,
      } =
        calculateCartTotals(
          cart.items
        );

      return res.status(200).json({
        success: true,

        message:
          quantity >
          oldQuantity
            ? "Quantity increased. New product requires its own print image."
            : "Quantity updated.",

        cart: {
          items:
            cart.items,

          subtotal,

          itemCount,
        },
      });
    } catch (error) {
      console.error(
        "Update Quantity Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to update quantity.",
      });
    }
  };

/* ============================================================
   REMOVE ITEM
============================================================ */

export const removeItem =
  async (req, res) => {
    try {
      const userId =
        req.auth.userId;

      const {
        itemId,
      } = req.params;

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

      const originalLength =
        cart.items.length;

      cart.items =
        cart.items.filter(
          (item) =>
            item._id.toString() !==
            itemId
        );

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

      await cart.save();

      const {
        subtotal,
        itemCount,
      } =
        calculateCartTotals(
          cart.items
        );

      return res.status(200).json({
        success: true,

        message:
          "Item removed.",

        cart: {
          items:
            cart.items,

          subtotal,

          itemCount,
        },
      });
    } catch (error) {
      console.error(
        "Remove Item Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to remove item.",
      });
    }
  };

/* ============================================================
   CLEAR CART
============================================================ */

export const clearCart =
  async (req, res) => {
    try {
      const userId =
        req.auth.userId;

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
          }
        );

      if (!cart) {
        return res.status(200).json({
          success: true,

          message:
            "Cart cleared.",

          cart: {
            items: [],

            subtotal: 0,

            itemCount: 0,
          },
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Cart cleared.",

        cart: {
          items: [],

          subtotal: 0,

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

export const mergeCart =
  async (req, res) => {
    try {
      const userId =
        req.auth.userId;

      const {
        items = [],
      } = req.body;

      if (
        !Array.isArray(items)
      ) {
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
        cart =
          new Cart({
            userId,
            items: [],
          });
      }

      const messages = [];

      /*
       * Merge every guest item.
       */
      for (
        const guestItem of items
      ) {
        try {
          const guestQuantity =
            Number(
              guestItem?.quantity
            );

          if (
            !Number.isInteger(
              guestQuantity
            ) ||
            guestQuantity < 1
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
           * Sanitize guest print units.
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
           * If guest units are missing,
           * create empty units.
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
          if (existingItem) {
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
              oldQuantity +
              guestQuantity;

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
             * Add new empty units.
             */
            syncPrintUnitsToQuantity(
              existingItem
            );

            /*
             * Copy guest customization
             * into the newly-added units.
             */
            for (
              let i = 0;
              i <
                guestUnits.length &&
              oldQuantity + i <
                existingItem
                  .printUnits
                  .length;
              i++
            ) {
              existingItem.printUnits[
                oldQuantity + i
              ] =
                guestUnits[i];
            }
          } else {
            /*
             * New server cart item.
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

              quantity:
                guestQuantity,

              selections:
                validatedSelections,

              printUnits:
                guestUnits,
            });
          }
        } catch (error) {
          console.warn(
            `Guest cart merge skipped for product ${guestItem?.productId}:`,
            error.message
          );

          messages.push(
            error.message ||
              "One cart item could not be merged."
          );
        }
      }

      await cart.save();

      const {
        subtotal,
        itemCount,
      } =
        calculateCartTotals(
          cart.items
        );

      return res.status(200).json({
        success: true,

        message:
          "Cart merged successfully.",

        cart: {
          items:
            cart.items,

          subtotal,

          itemCount,
        },

        messages,
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

/*
 * POST /api/cart/print-image
 *
 * FormData:
 *
 * image = File
 *
 * This uploads one image to Cloudinary.
 *
 * It does not attach the image to
 * a specific product yet.
 *
 * The frontend does that through
 * savePrintCustomization.
 */

export const uploadPrintImage =
  async (req, res) => {
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

      /*
       * Your existing multer middleware
       * already limits image size.
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
                  if (error) {
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

            /*
             * Same Cloudinary stream
             * approach as your existing
             * working product upload.
             */
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
        "PRINT IMAGE UPLOAD ERROR:",
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

/*
 * PATCH
 * /api/cart/items/:itemId/print-customization
 *
 * Rules:
 *
 * quantity = 1
 *   -> exactly 1 printUnit
 *   -> minimum 1 image
 *   -> maximum 3 images
 *
 * quantity = 2
 *   -> exactly 2 printUnits
 *   -> each needs 1–3 images
 *
 * quantity = 3
 *   -> exactly 3 printUnits
 *   -> each needs 1–3 images
 */

export const updatePrintCustomization =
  async (req, res) => {
    try {
      const userId =
        req.auth.userId;

      const {
        itemId,
      } = req.params;

      const {
        printUnits,
      } = req.body;

      /*
       * Validate request body.
       */
      if (
        !Array.isArray(
          printUnits
        )
      ) {
        return res.status(400).json({
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
        return res.status(404).json({
          success: false,

          message:
            "Cart not found.",
        });
      }

      /*
       * Find exact cart line.
       */
      const item =
        cart.items.find(
          (cartItem) =>
            cartItem._id.toString() ===
            itemId
        );

      if (!item) {
        return res.status(404).json({
          success: false,

          message:
            "Cart item not found.",
        });
      }

      /*
       * Validate 1–3 images for
       * every physical product.
       */
      const validatedUnits =
        validatePrintUnits(
          printUnits,
          item.quantity
        );

      /*
       * Save customization.
       */
      item.printUnits =
        validatedUnits;

      await cart.save();

      const {
        subtotal,
        itemCount,
      } =
        calculateCartTotals(
          cart.items
        );

      return res.status(200).json({
        success: true,

        message:
          "Print images saved successfully.",

        cart: {
          items:
            cart.items,

          subtotal,

          itemCount,
        },
      });
    } catch (error) {
      console.error(
        "Update Print Customization Error:",
        error
      );

      return res.status(400).json({
        success: false,

        message:
          error.message ||
          "Failed to save print images.",
      });
    }
  };