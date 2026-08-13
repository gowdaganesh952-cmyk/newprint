"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@clerk/nextjs";

/* ============================================================
   CONFIG
============================================================ */

const LOCAL_STORAGE_KEY =
  "new_print_cart";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const MAX_PRINT_IMAGES = 3;

/* ============================================================
   TYPES
============================================================ */

export interface PrintImage {
  _id?: string;
  url: string;
  publicId: string;
}

export interface PrintUnit {
  /*
   * ONE PrintUnit = ONE physical product.
   *
   * quantity = 2
   *
   * printUnits:
   *
   * [
   *   Product 1 images,
   *   Product 2 images
   * ]
   */
  unitId: string;
  images: PrintImage[];
}

export interface CartItem {
  _id?: string;

  productId: string;

  itemKey: string;

  name: string;

  image: string;

  price: number;

  quantity: number;

  selections: Record<
    string,
    string
  >;

  printUnits: PrintUnit[];
}

interface CartContextType {
  items: CartItem[];

  itemCount: number;

  subtotal: number;

  isInitializing: boolean;

  isUpdating: boolean;

  serverMessages: string[];

  addToCart: (
    product: any,
    selections: Record<
      string,
      string
    >,
    quantity?: number
  ) => Promise<void>;

  updateQuantity: (
    itemIdOrKey: string,
    quantity: number
  ) => Promise<void>;

  removeFromCart: (
    itemIdOrKey: string
  ) => Promise<void>;

  clearCart: () => Promise<void>;

  /*
   * Upload ONE image to Cloudinary.
   *
   * The returned image is NOT attached
   * to a product until savePrintCustomization()
   * is called.
   */
  uploadPrintImage: (
    file: File
  ) => Promise<PrintImage>;

  /*
   * Save all images for one cart line.
   */
  savePrintCustomization: (
    itemIdOrKey: string,
    printUnits: PrintUnit[]
  ) => Promise<void>;

  /*
   * True only when EVERY physical
   * product has 1–3 images.
   */
  isCartPrintReady: boolean;

  clearServerMessages: () => void;
}

/* ============================================================
   CONTEXT
============================================================ */

const CartContext =
  createContext<
    CartContextType | undefined
  >(undefined);

/* ============================================================
   HELPERS
============================================================ */

function normalizeValue(
  value: unknown
): string {
  return String(
    value ?? ""
  ).trim();
}

/* ============================================================
   ITEM KEY
============================================================ */

function createItemKey(
  productId: string,
  selections: Record<
    string,
    string
  > = {}
): string {
  const sortedEntries =
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
          key.length > 0 &&
          value.length > 0
      )
      .sort(
        ([a], [b]) =>
          a.localeCompare(b)
      );

  const selectionPart =
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

  return selectionPart
    ? `${productId}|${selectionPart}`
    : productId;
}

/* ============================================================
   UNIT ID
============================================================ */

function generateUnitId(): string {
  return `unit_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/* ============================================================
   CREATE EMPTY PRINT UNITS
============================================================ */

function createEmptyPrintUnits(
  quantity: number
): PrintUnit[] {
  const safeQuantity =
    Math.max(
      1,
      Number(quantity) || 1
    );

  return Array.from(
    {
      length: safeQuantity,
    },
    () => ({
      unitId:
        generateUnitId(),

      images: [],
    })
  );
}

/* ============================================================
   NORMALIZE PRINT IMAGE
============================================================ */

function normalizePrintImage(
  image: any
): PrintImage | null {
  const url =
    normalizeValue(
      image?.url
    );

  const publicId =
    normalizeValue(
      image?.publicId
    );

  if (!url || !publicId) {
    return null;
  }

  return {
    _id:
      image?._id,

    url,

    publicId,
  };
}

/* ============================================================
   NORMALIZE PRINT UNIT
============================================================ */

function normalizePrintUnit(
  unit: any
): PrintUnit {
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
            normalizePrintImage
          )
          .filter(
            (
              image
            ): image is PrintImage =>
              Boolean(image)
          )
      : [];

  return {
    unitId:
      normalizeValue(
        unit?.unitId
      ) ||
      generateUnitId(),

    images,
  };
}

/* ============================================================
   NORMALIZE CART ITEM
============================================================ */

function normalizeCartItem(
  item: any
): CartItem {
  const rawSelections =
    item?.selections;

  const selections: Record<
    string,
    string
  > =
    rawSelections instanceof Map
      ? Object.fromEntries(
          rawSelections.entries()
        )
      : rawSelections &&
        typeof rawSelections ===
          "object" &&
        !Array.isArray(
          rawSelections
        )
      ? Object.fromEntries(
          Object.entries(
            rawSelections
          ).map(
            ([key, value]) => [
              key,
              String(value ?? ""),
            ]
          )
        )
      : {};

  const quantity = Math.max(
    1,
    Number(
      item?.quantity ?? 1
    )
  );

  const serverUnits =
    Array.isArray(
      item?.printUnits
    )
      ? item.printUnits
          .map(
            normalizePrintUnit
          )
      : [];

  /*
   * Always make exactly
   * quantity units.
   *
   * Existing images are preserved.
   */
  const printUnits: PrintUnit[] =
    [];

  for (
    let index = 0;
    index < quantity;
    index++
  ) {
    if (
      serverUnits[index]
    ) {
      printUnits.push(
        serverUnits[index]
      );
    } else {
      printUnits.push({
        unitId:
          generateUnitId(),

        images: [],
      });
    }
  }

  return {
    _id:
      item?._id,

    productId:
      String(
        item?.productId ?? ""
      ),

    itemKey:
      item?.itemKey ||
      createItemKey(
        String(
          item?.productId ?? ""
        ),
        selections
      ),

    name:
      String(
        item?.name ||
          "Product"
      ),

    image:
      String(
        item?.image || ""
      ),

    price:
      Number(
        item?.price ?? 0
      ),

    quantity,

    selections,

    printUnits,
  };
}

/* ============================================================
   NORMALIZE SERVER ITEMS
============================================================ */

function normalizeServerItems(
  items: any
): CartItem[] {
  if (
    !Array.isArray(items)
  ) {
    return [];
  }

  return items.map(
    normalizeCartItem
  );
}

/* ============================================================
   PROVIDER
============================================================ */

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  const [items, setItems] =
    useState<CartItem[]>([]);

  const [
    isInitializing,
    setIsInitializing,
  ] = useState(true);

  const [
    isUpdating,
    setIsUpdating,
  ] = useState(false);

  const [
    serverMessages,
    setServerMessages,
  ] = useState<string[]>([]);

  /* ==========================================================
     SAVE LOCAL CART
  ========================================================== */

  const saveLocalCart =
    useCallback(
      (
        cartItems: CartItem[]
      ) => {
        try {
          localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify(
              cartItems
            )
          );
        } catch (error) {
          console.error(
            "Failed to save local cart:",
            error
          );
        }
      },
      []
    );

  /* ==========================================================
     LOAD LOCAL CART
  ========================================================== */

  const loadLocalCart =
    useCallback((): CartItem[] => {
      try {
        const stored =
          localStorage.getItem(
            LOCAL_STORAGE_KEY
          );

        if (!stored) {
          return [];
        }

        const parsed =
          JSON.parse(stored);

        if (
          !Array.isArray(parsed)
        ) {
          return [];
        }

        return parsed.map(
          normalizeCartItem
        );
      } catch (error) {
        console.error(
          "Failed to load local cart:",
          error
        );

        localStorage.removeItem(
          LOCAL_STORAGE_KEY
        );

        return [];
      }
    }, []);

  /* ==========================================================
     INITIALIZE CART
  ========================================================== */

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let cancelled = false;

    const initializeCart =
      async () => {
        setIsInitializing(
          true
        );

        try {
          /* ================================================
             GUEST CART
          ================================================ */

          if (!isSignedIn) {
            const localCart =
              loadLocalCart();

            if (!cancelled) {
              setItems(
                localCart
              );
            }

            return;
          }

          /* ================================================
             AUTHENTICATED USER
          ================================================ */

          const token =
            await getToken();

          if (!token) {
            if (!cancelled) {
              setItems([]);
            }

            return;
          }

          /* ================================================
             MERGE LOCAL CART
          ================================================ */

          const guestCart =
            loadLocalCart();

          if (
            guestCart.length >
            0
          ) {
            try {
              const mergeResponse =
                await fetch(
                  `${API_URL}/api/cart/merge`,
                  {
                    method:
                      "POST",

                    headers: {
                      "Content-Type":
                        "application/json",

                      Authorization:
                        `Bearer ${token}`,
                    },

                    body:
                      JSON.stringify(
                        {
                          items:
                            guestCart,
                        }
                      ),
                  }
                );

              const mergeData =
                await mergeResponse
                  .json()
                  .catch(
                    () => null
                  );

              if (
                !mergeResponse.ok
              ) {
                console.error(
                  "Cart merge failed:",
                  mergeData
                );
              }
            } catch (error) {
              console.error(
                "Cart merge error:",
                error
              );
            }
          }

          /*
           * Local cart has now been
           * sent to server.
           */
          localStorage.removeItem(
            LOCAL_STORAGE_KEY
          );

          /* ================================================
             GET SERVER CART
          ================================================ */

          const response =
            await fetch(
              `${API_URL}/api/cart`,
              {
                method: "GET",

                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },

                cache: "no-store",
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (
            !response.ok
          ) {
            throw new Error(
              data?.message ||
                `Cart request failed: ${response.status}`
            );
          }

          if (
            !cancelled
          ) {
            if (
              data?.success &&
              data?.cart
            ) {
              setItems(
                normalizeServerItems(
                  data.cart.items
                )
              );

              setServerMessages(
                Array.isArray(
                  data.messages
                )
                  ? data.messages
                  : []
              );
            } else {
              setItems([]);
            }
          }
        } catch (error) {
          console.error(
            "Cart initialization error:",
            error
          );

          if (!cancelled) {
            setItems([]);
          }
        } finally {
          if (!cancelled) {
            setIsInitializing(
              false
            );
          }
        }
      };

    initializeCart();

    return () => {
      cancelled = true;
    };
  }, [
    isLoaded,
    isSignedIn,
    getToken,
    loadLocalCart,
  ]);

  /* ==========================================================
     ADD TO CART
  ========================================================== */

  const addToCart =
    useCallback(
      async (
        product: any,
        selections: Record<
          string,
          string
        > = {},
        quantity = 1
      ) => {
        if (!product?._id) {
          throw new Error(
            "Invalid product."
          );
        }

        if (
          !Number.isInteger(
            quantity
          ) ||
          quantity < 1
        ) {
          throw new Error(
            "Invalid quantity."
          );
        }

        setIsUpdating(
          true
        );

        try {
          const productId =
            String(
              product._id
            );

          const normalizedSelections =
            Object.fromEntries(
              Object.entries(
                selections
              )
                .map(
                  ([
                    key,
                    value,
                  ]) => [
                    normalizeValue(
                      key
                    ),
                    normalizeValue(
                      value
                    ),
                  ]
                )
                .filter(
                  ([
                    key,
                    value,
                  ]) =>
                    key &&
                    value
                )
            );

          /* ================================================
             AUTHENTICATED
          ================================================ */

          if (isSignedIn) {
            const token =
              await getToken();

            if (!token) {
              throw new Error(
                "Authentication token unavailable."
              );
            }

            const response =
              await fetch(
                `${API_URL}/api/cart/items`,
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "application/json",

                    Authorization:
                      `Bearer ${token}`,
                  },

                  body:
                    JSON.stringify(
                      {
                        productId,

                        quantity,

                        selections:
                          normalizedSelections,
                      }
                    ),
                }
              );

            const data =
              await response
                .json()
                .catch(
                  () => null
                );

            if (
              !response.ok ||
              !data?.success
            ) {
              throw new Error(
                data?.message ||
                  "Failed to add item to cart."
              );
            }

            setItems(
              normalizeServerItems(
                data?.cart?.items
              )
            );

            setServerMessages(
              Array.isArray(
                data?.messages
              )
                ? data.messages
                : []
            );

            return;
          }

          /* ================================================
             GUEST
          ================================================ */

          setItems(
            (
              previousItems
            ) => {
              const itemKey =
                createItemKey(
                  productId,
                  normalizedSelections
                );

              const existingIndex =
                previousItems.findIndex(
                  (item) =>
                    item.itemKey ===
                    itemKey
                );

              let nextItems:
                CartItem[];

              if (
                existingIndex !==
                -1
              ) {
                nextItems = [
                  ...previousItems,
                ];

                const existing =
                  nextItems[
                    existingIndex
                  ];

                const newQuantity =
                  existing.quantity +
                  quantity;

                const units =
                  Array.isArray(
                    existing.printUnits
                  )
                    ? [
                        ...existing.printUnits,
                      ]
                    : [];

                while (
                  units.length <
                  newQuantity
                ) {
                  units.push({
                    unitId:
                      generateUnitId(),

                    images: [],
                  });
                }

                nextItems[
                  existingIndex
                ] = {
                  ...existing,

                  quantity:
                    newQuantity,

                  printUnits:
                    units,
                };
              } else {
                nextItems = [
                  ...previousItems,

                  {
                    productId,

                    itemKey,

                    name:
                      product.name ||
                      "Product",

                    image:
                      product
                        .images?.[0] ||
                      "",

                    price:
                      Number(
                        product.price ??
                          0
                      ),

                    quantity,

                    selections:
                      normalizedSelections,

                    printUnits:
                      createEmptyPrintUnits(
                        quantity
                      ),
                  },
                ];
              }

              saveLocalCart(
                nextItems
              );

              return nextItems;
            }
          );
        } finally {
          setIsUpdating(
            false
          );
        }
      },
      [
        isSignedIn,
        getToken,
        saveLocalCart,
      ]
    );

  /* ==========================================================
     UPDATE QUANTITY
  ========================================================== */

  const updateQuantity =
    useCallback(
      async (
        itemIdOrKey: string,
        quantity: number
      ) => {
        if (
          !Number.isInteger(
            quantity
          ) ||
          quantity < 1
        ) {
          return;
        }

        setIsUpdating(
          true
        );

        try {
          /* ================================================
             AUTHENTICATED
          ================================================ */

          if (isSignedIn) {
            const token =
              await getToken();

            if (!token) {
              throw new Error(
                "Authentication token unavailable."
              );
            }

            const response =
              await fetch(
                `${API_URL}/api/cart/items/${encodeURIComponent(
                  itemIdOrKey
                )}`,
                {
                  method:
                    "PATCH",

                  headers: {
                    "Content-Type":
                      "application/json",

                    Authorization:
                      `Bearer ${token}`,
                  },

                  body:
                    JSON.stringify(
                      {
                        quantity,
                      }
                    ),
                }
              );

            const data =
              await response
                .json()
                .catch(
                  () => null
                );

            if (
              !response.ok ||
              !data?.success
            ) {
              throw new Error(
                data?.message ||
                  "Failed to update quantity."
              );
            }

            setItems(
              normalizeServerItems(
                data?.cart?.items
              )
            );

            return;
          }

          /* ================================================
             GUEST
          ================================================ */

          setItems(
            (
              previousItems
            ) => {
              const nextItems =
                previousItems.map(
                  (item) => {
                    if (
                      item.itemKey !==
                      itemIdOrKey
                    ) {
                      return item;
                    }

                    const units =
                      Array.isArray(
                        item.printUnits
                      )
                        ? [
                            ...item.printUnits,
                          ]
                        : [];

                    /*
                     * Increasing quantity:
                     * create NEW empty
                     * physical product units.
                     */
                    while (
                      units.length <
                      quantity
                    ) {
                      units.push({
                        unitId:
                          generateUnitId(),

                        images: [],
                      });
                    }

                    /*
                     * Decreasing quantity:
                     * remove units from
                     * the end.
                     *
                     * Earlier images remain.
                     */
                    const finalUnits =
                      units.slice(
                        0,
                        quantity
                      );

                    return {
                      ...item,

                      quantity,

                      printUnits:
                        finalUnits,
                    };
                  }
                );

              saveLocalCart(
                nextItems
              );

              return nextItems;
            }
          );
        } catch (error) {
          console.error(
            "Update quantity error:",
            error
          );

          throw error;
        } finally {
          setIsUpdating(
            false
          );
        }
      },
      [
        isSignedIn,
        getToken,
        saveLocalCart,
      ]
    );

  /* ==========================================================
     UPLOAD PRINT IMAGE
  ========================================================== */

  const uploadPrintImage =
    useCallback(
      async (
        file: File
      ): Promise<PrintImage> => {
        if (!file) {
          throw new Error(
            "Please select an image."
          );
        }

        /*
         * Only image files.
         */
        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          throw new Error(
            "Only image files are allowed."
          );
        }

        /*
         * Frontend safety limit.
         *
         * Backend multer has its own
         * 5MB limit, so keep this at
         * 5MB too.
         */
        if (
          file.size >
          5 * 1024 * 1024
        ) {
          throw new Error(
            "Image must be smaller than 5MB."
          );
        }

        if (!isSignedIn) {
          throw new Error(
            "Please sign in before uploading print images."
          );
        }

        const token =
          await getToken();

        if (!token) {
          throw new Error(
            "Authentication token unavailable."
          );
        }

        const formData =
          new FormData();

        formData.append(
          "image",
          file
        );

        /*
         * IMPORTANT
         *
         * Correct backend endpoint:
         *
         * POST /api/cart/print-image
         *
         * NOT:
         *
         * /api/upload/cart-image
         */
        const response =
          await fetch(
            `${API_URL}/api/cart/print-image`,
            {
              method:
                "POST",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              body:
                formData,
            }
          );

        const data =
          await response
            .json()
            .catch(
              () => null
            );

        if (
          !response.ok ||
          !data?.success ||
          !data?.image?.url ||
          !data?.image?.publicId
        ) {
          throw new Error(
            data?.message ||
              "Failed to upload print image."
          );
        }

        return {
          url:
            data.image.url,

          publicId:
            data.image.publicId,
        };
      },
      [
        isSignedIn,
        getToken,
      ]
    );

  /* ==========================================================
     SAVE PRINT CUSTOMIZATION
  ========================================================== */

  const savePrintCustomization =
    useCallback(
      async (
        itemIdOrKey: string,
        printUnits: PrintUnit[]
      ) => {
        /*
         * Find cart item.
         */
        const item =
          items.find(
            (cartItem) =>
              cartItem._id ===
                itemIdOrKey ||
              cartItem.itemKey ===
                itemIdOrKey
          );

        if (!item) {
          throw new Error(
            "Cart item not found."
          );
        }

        /*
         * Exactly one unit per
         * physical product.
         */
        if (
          printUnits.length !==
          item.quantity
        ) {
          throw new Error(
            `This product requires ${item.quantity} physical product units.`
          );
        }

        /*
         * Validate every unit.
         */
        const normalizedUnits =
          printUnits.map(
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

              if (
                images.length >
                MAX_PRINT_IMAGES
              ) {
                throw new Error(
                  `Product ${
                    index + 1
                  } can have maximum 3 images.`
                );
              }

              const validImages =
                images
                  .map(
                    (
                      image
                    ) =>
                      normalizePrintImage(
                        image
                      )
                  )
                  .filter(
                    (
                      image
                    ): image is PrintImage =>
                      Boolean(
                        image
                      )
                  );

              if (
                validImages.length <
                1
              ) {
                throw new Error(
                  `Product ${
                    index + 1
                  } contains no valid image.`
                );
              }

              return {
                unitId:
                  normalizeValue(
                    unit?.unitId
                  ) ||
                  generateUnitId(),

                images:
                  validImages.slice(
                    0,
                    MAX_PRINT_IMAGES
                  ),
              };
            }
          );

        /* ================================================
           GUEST
        ================================================ */

        if (!isSignedIn) {
          setItems(
            (
              previousItems
            ) => {
              const nextItems =
                previousItems.map(
                  (cartItem) =>
                    cartItem.itemKey ===
                    itemIdOrKey
                      ? {
                          ...cartItem,

                          printUnits:
                            normalizedUnits,
                        }
                      : cartItem
                );

              saveLocalCart(
                nextItems
              );

              return nextItems;
            }
          );

          return;
        }

        /* ================================================
           AUTHENTICATED
        ================================================ */

        const token =
          await getToken();

        if (!token) {
          throw new Error(
            "Authentication token unavailable."
          );
        }

        /*
         * Correct backend endpoint:
         *
         * PATCH
         * /api/cart/items/:itemId/print-customization
         */
        const response =
          await fetch(
            `${API_URL}/api/cart/items/${encodeURIComponent(
              itemIdOrKey
            )}/print-customization`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify(
                  {
                    printUnits:
                      normalizedUnits,
                  }
                ),
            }
          );

        const data =
          await response
            .json()
            .catch(
              () => null
            );

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              "Failed to save print images."
          );
        }

        setItems(
          normalizeServerItems(
            data?.cart?.items
          )
        );

        setServerMessages(
          Array.isArray(
            data?.messages
          )
            ? data.messages
            : []
        );
      },
      [
        items,
        isSignedIn,
        getToken,
        saveLocalCart,
      ]
    );

  /* ==========================================================
     REMOVE ITEM
  ========================================================== */

  const removeFromCart =
    useCallback(
      async (
        itemIdOrKey: string
      ) => {
        setIsUpdating(
          true
        );

        try {
          /* ================================================
             AUTHENTICATED
          ================================================ */

          if (isSignedIn) {
            const token =
              await getToken();

            if (!token) {
              throw new Error(
                "Authentication token unavailable."
              );
            }

            const response =
              await fetch(
                `${API_URL}/api/cart/items/${encodeURIComponent(
                  itemIdOrKey
                )}`,
                {
                  method:
                    "DELETE",

                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                }
              );

            const data =
              await response
                .json()
                .catch(
                  () => null
                );

            if (
              !response.ok ||
              !data?.success
            ) {
              throw new Error(
                data?.message ||
                  "Failed to remove item."
              );
            }

            setItems(
              normalizeServerItems(
                data?.cart?.items
              )
            );

            return;
          }

          /* ================================================
             GUEST
          ================================================ */

          setItems(
            (
              previousItems
            ) => {
              const nextItems =
                previousItems.filter(
                  (item) =>
                    item.itemKey !==
                    itemIdOrKey
                );

              saveLocalCart(
                nextItems
              );

              return nextItems;
            }
          );
        } catch (error) {
          console.error(
            "Remove cart item error:",
            error
          );

          throw error;
        } finally {
          setIsUpdating(
            false
          );
        }
      },
      [
        isSignedIn,
        getToken,
        saveLocalCart,
      ]
    );

  /* ==========================================================
     CLEAR CART
  ========================================================== */

  const clearCart =
    useCallback(
      async () => {
        setIsUpdating(
          true
        );

        try {
          if (isSignedIn) {
            const token =
              await getToken();

            if (!token) {
              throw new Error(
                "Authentication token unavailable."
              );
            }

            const response =
              await fetch(
                `${API_URL}/api/cart`,
                {
                  method:
                    "DELETE",

                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                }
              );

            const data =
              await response
                .json()
                .catch(
                  () => null
                );

            if (
              !response.ok ||
              !data?.success
            ) {
              throw new Error(
                data?.message ||
                  "Failed to clear cart."
              );
            }
          }

          setItems([]);

          localStorage.removeItem(
            LOCAL_STORAGE_KEY
          );
        } catch (error) {
          console.error(
            "Clear cart error:",
            error
          );

          throw error;
        } finally {
          setIsUpdating(
            false
          );
        }
      },
      [
        isSignedIn,
        getToken,
      ]
    );

  /* ==========================================================
     CLEAR SERVER MESSAGES
  ========================================================== */

  const clearServerMessages =
    useCallback(() => {
      setServerMessages(
        []
      );
    }, []);

  /* ==========================================================
     ITEM COUNT
  ========================================================== */

  const itemCount =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.quantity
            ),
          0
        ),
      [items]
    );

  /* ==========================================================
     SUBTOTAL
  ========================================================== */

  const subtotal =
    useMemo(
      () =>
        items.reduce(
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
        ),
      [items]
    );

  /* ==========================================================
     PRINT READINESS
  ========================================================== */

  const isCartPrintReady =
    useMemo(() => {
      /*
       * Empty cart is not ready.
       */
      if (
        items.length ===
        0
      ) {
        return false;
      }

      /*
       * Every cart line must have
       * exactly quantity physical
       * units.
       *
       * Every unit must have
       * 1–3 images.
       */
      return items.every(
        (item) => {
          if (
            item.printUnits
              .length !==
            item.quantity
          ) {
            return false;
          }

          return item.printUnits.every(
            (unit) => {
              const imageCount =
                Array.isArray(
                  unit.images
                )
                  ? unit.images.length
                  : 0;

              return (
                imageCount >=
                  1 &&
                imageCount <=
                  MAX_PRINT_IMAGES
              );
            }
          );
        }
      );
    }, [items]);

  /* ==========================================================
     PROVIDER
  ========================================================== */

  return (
    <CartContext.Provider
      value={{
        items,

        itemCount,

        subtotal,

        isInitializing,

        isUpdating,

        serverMessages,

        addToCart,

        updateQuantity,

        removeFromCart,

        clearCart,

        uploadPrintImage,

        savePrintCustomization,

        isCartPrintReady,

        clearServerMessages,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* ============================================================
   HOOK
============================================================ */

export function useCart() {
  const context =
    useContext(
      CartContext
    );

  if (!context) {
    throw new Error(
      "useCart must be used within CartProvider"
    );
  }

  return context;
}