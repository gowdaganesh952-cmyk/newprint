"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@clerk/nextjs";
import { useApi } from "../../lib/api";

/* ============================================================
   TYPES
============================================================ */

export interface PrintImage {
  url: string;
  publicId: string;
}

export interface PrintUnit {
  unitId: string;
  images: PrintImage[];
}

export interface CartProduct {
  _id: string;
  name?: string;
  price?: number | null;
  image?: string;
  images?: string[];
  slug?: string;

  [key: string]: unknown;
}

export interface CartItem {
  _id: string;
  productId: string;
  itemKey: string;

  name: string;
  image: string;

  price: number;
  quantity: number;

  selections: Record<string, string>;

  printUnits: PrintUnit[];
}

export interface CartData {
  items: CartItem[];

  subtotal: number;
  shippingCharge: number;
  total: number;
  itemCount: number;
}

/* ============================================================
   EMPTY CART
============================================================ */

const EMPTY_CART: CartData = {
  items: [],
  subtotal: 0,
  shippingCharge: 0,
  total: 0,
  itemCount: 0,
};

/* ============================================================
   CONTEXT TYPE
============================================================ */

interface CartContextType {
  items: CartItem[];

  subtotal: number;
  shippingCharge: number;
  total: number;
  itemCount: number;

  loading: boolean;
  updating: boolean;

  error: string | null;

  refreshCart: () => Promise<void>;

  addToCart: (
    product: CartProduct,
    selections?: Record<string, string>,
    quantity?: number
  ) => Promise<boolean>;

  updateQuantity: (
    itemId: string,
    quantity: number
  ) => Promise<boolean>;

  removeItem: (
    itemId: string
  ) => Promise<boolean>;

  clearCart: () => Promise<boolean>;

  savePrintCustomization: (
    itemId: string,
    printUnits: PrintUnit[]
  ) => Promise<boolean>;

  uploadPrintImage: (
    file: File
  ) => Promise<PrintImage | null>;
}

/* ============================================================
   CONTEXT
============================================================ */

const CartContext =
  createContext<CartContextType | undefined>(
    undefined
  );

/* ============================================================
   NORMALIZE PRINT UNIT
============================================================ */

function normalizePrintUnit(
  unit: any,
  index: number
): PrintUnit {
  const images =
    Array.isArray(unit?.images)
      ? unit.images
          .slice(0, 6)
          .filter(
            (image: any) =>
              Boolean(image?.url) &&
              Boolean(image?.publicId)
          )
          .map(
            (image: any) => ({
              url: String(image.url),
              publicId: String(
                image.publicId
              ),
            })
          )
      : [];

  return {
    unitId:
      typeof unit?.unitId === "string" &&
      unit.unitId.trim()
        ? unit.unitId
        : `unit_${index}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`,

    images,
  };
}

/* ============================================================
   NORMALIZE CART ITEM
============================================================ */

function normalizeCartItem(
  item: any
): CartItem {
  const quantity = Math.max(
    1,
    Number(item?.quantity) || 1
  );

  let printUnits: PrintUnit[] =
    Array.isArray(item?.printUnits)
      ? item.printUnits.map(
          (
            unit: any,
            index: number
          ) =>
            normalizePrintUnit(
              unit,
              index
            )
        )
      : [];

  /*
   * Never allow more physical units
   * than the actual quantity.
   */

  if (
    printUnits.length >
    quantity
  ) {
    printUnits =
      printUnits.slice(
        0,
        quantity
      );
  }

  /*
   * Always keep exactly one print unit
   * for every physical product.
   */

  while (
    printUnits.length <
    quantity
  ) {
    printUnits.push(
      normalizePrintUnit(
        null,
        printUnits.length
      )
    );
  }

  const selections =
    item?.selections &&
    typeof item.selections ===
      "object"
      ? Object.fromEntries(
          Object.entries(
            item.selections
          )
            .map(
              ([
                key,
                value,
              ]) => [
                String(key),
                String(value ?? ""),
              ]
            )
            .filter(
              ([key, value]) =>
                key.trim() !== "" &&
                value.trim() !== ""
            )
        )
      : {};

  return {
    _id: String(
      item?._id || ""
    ),

    productId: String(
      item?.productId || ""
    ),

    itemKey: String(
      item?.itemKey || ""
    ),

    name: String(
      item?.name ||
        "Product"
    ),

    image: String(
      item?.image || ""
    ),

    price:
      Number.isFinite(
        Number(item?.price)
      )
        ? Number(item.price)
        : 0,

    quantity,

    selections,

    printUnits,
  };
}

/* ============================================================
   NORMALIZE CART RESPONSE
============================================================ */

function normalizeCart(
  data: any
): CartData {
  const rawCart =
    data?.cart ||
    data ||
    {};

  const items =
    Array.isArray(
      rawCart.items
    )
      ? rawCart.items.map(
          normalizeCartItem
        )
      : [];

  const calculatedSubtotal =
    items.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.price *
          item.quantity,
      0
    );

  const calculatedItemCount =
    items.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.quantity,
      0
    );

  const backendSubtotal =
    Number(
      rawCart.subtotal
    );

  const backendShipping =
    Number(
      rawCart.shippingCharge
    );

  const backendTotal =
    Number(
      rawCart.total
    );

  const backendItemCount =
    Number(
      rawCart.itemCount
    );

  const subtotal =
    Number.isFinite(
      backendSubtotal
    )
      ? backendSubtotal
      : calculatedSubtotal;

  const shippingCharge =
    Number.isFinite(
      backendShipping
    )
      ? backendShipping
      : 0;

  const total =
    Number.isFinite(
      backendTotal
    )
      ? backendTotal
      : subtotal +
        shippingCharge;

  const itemCount =
    Number.isFinite(
      backendItemCount
    )
      ? backendItemCount
      : calculatedItemCount;

  return {
    items,
    subtotal,
    shippingCharge,
    total,
    itemCount,
  };
}

/* ============================================================
   PROVIDER PROPS
============================================================ */

interface CartProviderProps {
  children: ReactNode;
}

/* ============================================================
   PROVIDER
============================================================ */

export function CartProvider({
  children,
}: CartProviderProps) {
  const {
    isLoaded,
    isSignedIn,
    userId,
  } = useAuth();

  const api = useApi();

  /*
   * Prevent an older request from overwriting
   * the cart belonging to a newly logged-in user.
   */

  const requestVersion =
    useRef(0);

  const [cart, setCart] =
    useState<CartData>(
      EMPTY_CART
    );

  const [loading, setLoading] =
    useState(true);

  const [updating, setUpdating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null
    );

  /* ==========================================================
     RESET LOCAL CART
  ========================================================== */

  const resetLocalCart =
    useCallback(() => {
      requestVersion.current += 1;

      setCart(
        EMPTY_CART
      );

      setError(null);
      setUpdating(false);
    }, []);

  /* ==========================================================
     REFRESH CART
  ========================================================== */

  const refreshCart =
    useCallback(async () => {
      /*
       * Never request the authenticated
       * cart before Clerk is ready.
       */

      if (
        !isLoaded
      ) {
        return;
      }

      /*
       * Logged-out users must always
       * have an empty server-cart view.
       */

      if (
        !isSignedIn ||
        !userId
      ) {
        resetLocalCart();
        setLoading(false);
        return;
      }

      const version =
        ++requestVersion.current;

      try {
        setError(null);

        const data =
          await api.get<any>(
            "/api/cart"
          );

        /*
         * Ignore an old request if:
         *
         * - user logged out
         * - another user logged in
         * - another refresh started
         */

        if (
          version !==
          requestVersion.current
        ) {
          return;
        }

        setCart(
          normalizeCart(data)
        );
      } catch (
        requestError
      ) {
        /*
         * If authentication changed while
         * the request was running, do not
         * display the old user's cart/error.
         */

        if (
          version !==
          requestVersion.current
        ) {
          return;
        }

        const message =
          requestError instanceof
          Error
            ? requestError.message
            : "Failed to load cart.";

        console.error(
          "Cart refresh error:",
          requestError
        );

        /*
         * Authentication failure means
         * the client must not keep showing
         * the previous user's cart.
         */

        if (
          message.includes(
            "401"
          ) ||
          message
            .toLowerCase()
            .includes(
              "unauth"
            )
        ) {
          resetLocalCart();
          return;
        }

        setError(message);
      } finally {
        if (
          version ===
          requestVersion.current
        ) {
          setLoading(false);
        }
      }
    }, [
      api,
      isLoaded,
      isSignedIn,
      userId,
      resetLocalCart,
    ]);

  /* ==========================================================
     AUTHENTICATION / USER CHANGE
  ========================================================== */

  useEffect(() => {
    /*
     * Clerk has not finished loading yet.
     */

    if (!isLoaded) {
      setLoading(true);
      return;
    }

    /*
     * IMPORTANT:
     *
     * When the user logs out:
     *
     * previous cart is immediately removed
     * from React memory.
     *
     * This prevents:
     *
     * User A cart
     *      ↓ logout
     * User B / guest
     *      ↓
     * User A cart appearing temporarily
     */

    if (
      !isSignedIn ||
      !userId
    ) {
      resetLocalCart();
      setLoading(false);
      return;
    }

    /*
     * New authenticated user.
     *
     * Clear previous user's cart BEFORE
     * loading the new user's cart.
     */

    setCart(
      EMPTY_CART
    );

    setError(null);
    setLoading(true);

    let cancelled = false;

    const loadUserCart =
      async () => {
        const version =
          ++requestVersion.current;

        try {
          const data =
            await api.get<any>(
              "/api/cart"
            );

          if (
            cancelled ||
            version !==
              requestVersion.current
          ) {
            return;
          }

          setCart(
            normalizeCart(data)
          );
        } catch (
          requestError
        ) {
          if (
            cancelled ||
            version !==
              requestVersion.current
          ) {
            return;
          }

          const message =
            requestError instanceof
            Error
              ? requestError.message
              : "Failed to load cart.";

          console.error(
            "Authenticated cart load error:",
            requestError
          );

          /*
           * Do not expose stale cart data.
           */

          setCart(
            EMPTY_CART
          );

          setError(
            message
          );
        } finally {
          if (
            !cancelled &&
            version ===
              requestVersion.current
          ) {
            setLoading(false);
          }
        }
      };

    loadUserCart();

    return () => {
      cancelled = true;
    };
  }, [
    api,
    isLoaded,
    isSignedIn,
    userId,
    resetLocalCart,
  ]);

  /* ==========================================================
     ADD TO CART
  ========================================================== */

  const addToCart =
    useCallback(
      async (
        product: CartProduct,
        selections: Record<
          string,
          string
        > = {},
        quantity = 1
      ): Promise<boolean> => {
        if (
          !isLoaded ||
          !isSignedIn ||
          !userId
        ) {
          setError(
            "Please sign in before adding items to your cart."
          );

          return false;
        }

        try {
          setUpdating(true);
          setError(null);

          if (
            !product?._id
          ) {
            throw new Error(
              "Product information is missing."
            );
          }

          const safeQuantity =
            Number.isInteger(
              quantity
            ) &&
            quantity > 0
              ? quantity
              : 1;

          const cleanSelections =
            Object.fromEntries(
              Object.entries(
                selections || {}
              )
                .map(
                  ([
                    key,
                    value,
                  ]) => [
                    String(
                      key
                    ).trim(),

                    String(
                      value ?? ""
                    ).trim(),
                  ]
                )
                .filter(
                  ([key, value]) =>
                    key.length >
                      0 &&
                    value.length >
                      0
                )
            );

          const payload = {
            productId:
              String(
                product._id
              ),

            quantity:
              safeQuantity,

            selections:
              cleanSelections,
          };

          const version =
            requestVersion.current;

          const data =
            await api.post<any>(
              "/api/cart/items",
              payload
            );

          /*
           * Do not allow a stale request to
           * update another user's cart.
           */

          if (
            version !==
            requestVersion.current ||
            !isSignedIn ||
            !userId
          ) {
            return false;
          }

          setCart(
            normalizeCart(data)
          );

          return true;
        } catch (
          requestError
        ) {
          const message =
            requestError instanceof
            Error
              ? requestError.message
              : "Failed to add item to cart.";

          console.error(
            "Add to cart error:",
            requestError
          );

          setError(message);

          return false;
        } finally {
          setUpdating(false);
        }
      },
      [
        api,
        isLoaded,
        isSignedIn,
        userId,
      ]
    );

  /* ==========================================================
     UPDATE QUANTITY
  ========================================================== */

  const updateQuantity =
    useCallback(
      async (
        itemId: string,
        quantity: number
      ): Promise<boolean> => {
        if (
          !isLoaded ||
          !isSignedIn ||
          !userId
        ) {
          setError(
            "Please sign in to update your cart."
          );

          return false;
        }

        if (
          !itemId ||
          !Number.isInteger(
            quantity
          ) ||
          quantity < 1
        ) {
          return false;
        }

        try {
          setUpdating(true);
          setError(null);

          const version =
            requestVersion.current;

          const data =
            await api.patch<any>(
              `/api/cart/items/${encodeURIComponent(
                itemId
              )}`,
              {
                quantity,
              }
            );

          if (
            version !==
              requestVersion.current ||
            !isSignedIn ||
            !userId
          ) {
            return false;
          }

          setCart(
            normalizeCart(data)
          );

          return true;
        } catch (
          requestError
        ) {
          const message =
            requestError instanceof
            Error
              ? requestError.message
              : "Failed to update quantity.";

          console.error(
            "Update quantity error:",
            requestError
          );

          setError(message);

          /*
           * Refresh after a failed mutation
           * because the backend remains the
           * source of truth.
           */

          if (
            isSignedIn &&
            userId
          ) {
            await refreshCart();
          }

          return false;
        } finally {
          setUpdating(false);
        }
      },
      [
        api,
        isLoaded,
        isSignedIn,
        userId,
        refreshCart,
      ]
    );

  /* ==========================================================
     REMOVE ITEM
  ========================================================== */

  const removeItem =
    useCallback(
      async (
        itemId: string
      ): Promise<boolean> => {
        if (
          !isLoaded ||
          !isSignedIn ||
          !userId
        ) {
          setError(
            "Please sign in to modify your cart."
          );

          return false;
        }

        if (!itemId) {
          setError(
            "Cart item ID is missing."
          );

          return false;
        }

        try {
          setUpdating(true);
          setError(null);

          const version =
            requestVersion.current;

          /*
           * DELETE must succeed on the server
           * before treating the operation as
           * successful.
           */

          const data =
            await api.delete<any>(
              `/api/cart/items/${encodeURIComponent(
                itemId
              )}`
            );

          if (
            version !==
              requestVersion.current ||
            !isSignedIn ||
            !userId
          ) {
            return false;
          }

          /*
           * Backend response is the source
           * of truth.
           */

          setCart(
            normalizeCart(data)
          );

          /*
           * Extra protection:
           *
           * If the backend unexpectedly returns
           * the deleted item, immediately reload
           * the authenticated cart.
           */

          const normalized =
            normalizeCart(data);

          if (
            normalized.items.some(
              (item) =>
                item._id ===
                itemId
            )
          ) {
            await refreshCart();
          }

          return true;
        } catch (
          requestError
        ) {
          const message =
            requestError instanceof
            Error
              ? requestError.message
              : "Failed to remove item.";

          console.error(
            "Remove cart item error:",
            requestError
          );

          setError(message);

          /*
           * Re-sync from backend after a
           * failed delete.
           */

          if (
            isSignedIn &&
            userId
          ) {
            await refreshCart();
          }

          return false;
        } finally {
          setUpdating(false);
        }
      },
      [
        api,
        isLoaded,
        isSignedIn,
        userId,
        refreshCart,
      ]
    );

  /* ==========================================================
     CLEAR CART
  ========================================================== */

  const clearCart =
    useCallback(
      async (): Promise<boolean> => {
        if (
          !isLoaded ||
          !isSignedIn ||
          !userId
        ) {
          /*
           * Local cart is already empty when
           * logged out.
           */

          resetLocalCart();
          return true;
        }

        try {
          setUpdating(true);
          setError(null);

          const version =
            requestVersion.current;

          /*
           * Optimistically clear the UI.
           *
           * If the server fails, refreshCart()
           * restores the actual server state.
           */

          setCart(
            EMPTY_CART
          );

          const data =
            await api.delete<any>(
              "/api/cart"
            );

          if (
            version !==
              requestVersion.current ||
            !isSignedIn ||
            !userId
          ) {
            return false;
          }

          setCart(
            normalizeCart(data)
          );

          return true;
        } catch (
          requestError
        ) {
          const message =
            requestError instanceof
            Error
              ? requestError.message
              : "Failed to clear cart.";

          console.error(
            "Clear cart error:",
            requestError
          );

          setError(message);

          if (
            isSignedIn &&
            userId
          ) {
            await refreshCart();
          }

          return false;
        } finally {
          setUpdating(false);
        }
      },
      [
        api,
        isLoaded,
        isSignedIn,
        userId,
        refreshCart,
        resetLocalCart,
      ]
    );

  /* ==========================================================
     SAVE PRINT CUSTOMIZATION
  ========================================================== */

  const savePrintCustomization =
    useCallback(
      async (
        itemId: string,
        printUnits: PrintUnit[]
      ): Promise<boolean> => {
        if (
          !isLoaded ||
          !isSignedIn ||
          !userId
        ) {
          setError(
            "Please sign in to save your customization."
          );

          return false;
        }

        if (!itemId) {
          setError(
            "Cart item ID is missing."
          );

          return false;
        }

        try {
          setUpdating(true);
          setError(null);

          const cleanedUnits =
            Array.isArray(
              printUnits
            )
              ? printUnits.map(
                  (
                    unit,
                    index
                  ) => ({
                    unitId:
                      String(
                        unit?.unitId ||
                          `unit_${index}`
                      ),

                    images:
                      Array.isArray(
                        unit?.images
                      )
                        ? unit.images
                            .slice(
                              0,
                              6
                            )
                            .filter(
                              (
                                image
                              ) =>
                                Boolean(
                                  image?.url
                                ) &&
                                Boolean(
                                  image?.publicId
                                )
                            )
                            .map(
                              (
                                image
                              ) => ({
                                url: String(
                                  image.url
                                ),

                                publicId:
                                  String(
                                    image.publicId
                                  ),
                              })
                            )
                        : [],
                  })
                )
              : [];

          const version =
            requestVersion.current;

          const data =
            await api.patch<any>(
              `/api/cart/items/${encodeURIComponent(
                itemId
              )}/print-customization`,
              {
                printUnits:
                  cleanedUnits,
              }
            );

          if (
            version !==
              requestVersion.current ||
            !isSignedIn ||
            !userId
          ) {
            return false;
          }

          setCart(
            normalizeCart(data)
          );

          return true;
        } catch (
          requestError
        ) {
          const message =
            requestError instanceof
            Error
              ? requestError.message
              : "Failed to save print customization.";

          console.error(
            "Print customization error:",
            requestError
          );

          setError(message);

          return false;
        } finally {
          setUpdating(false);
        }
      },
      [
        api,
        isLoaded,
        isSignedIn,
        userId,
      ]
    );

  /* ==========================================================
     UPLOAD PRINT IMAGE
  ========================================================== */

  const uploadPrintImage =
    useCallback(
      async (
        file: File
      ): Promise<PrintImage | null> => {
        if (
          !isLoaded ||
          !isSignedIn ||
          !userId
        ) {
          setError(
            "Please sign in before uploading a print image."
          );

          return null;
        }

        try {
          setError(null);

          if (
            !file ||
            !(file instanceof File)
          ) {
            throw new Error(
              "Please select an image."
            );
          }

          if (
            !file.type.startsWith(
              "image/"
            )
          ) {
            throw new Error(
              "Please upload an image file."
            );
          }

          if (
            file.size >
            10 *
              1024 *
              1024
          ) {
            throw new Error(
              "Image must be 10MB or smaller."
            );
          }

          const formData =
            new FormData();

          formData.append(
            "image",
            file
          );

          const data =
            await api.post<any>(
              "/api/cart/print-image",
              formData
            );

          if (
            !data?.image?.url ||
            !data?.image?.publicId
          ) {
            throw new Error(
              "Invalid image response from server."
            );
          }

          return {
            url: String(
              data.image.url
            ),

            publicId: String(
              data.image.publicId
            ),
          };
        } catch (
          requestError
        ) {
          const message =
            requestError instanceof
            Error
              ? requestError.message
              : "Failed to upload image.";

          console.error(
            "Print image upload error:",
            requestError
          );

          setError(message);

          return null;
        }
      },
      [
        api,
        isLoaded,
        isSignedIn,
        userId,
      ]
    );

  /* ==========================================================
     CONTEXT VALUE
  ========================================================== */

  const value =
    useMemo<CartContextType>(
      () => ({
        items:
          cart.items,

        subtotal:
          cart.subtotal,

        shippingCharge:
          cart.shippingCharge,

        total:
          cart.total,

        itemCount:
          cart.itemCount,

        loading,

        updating,

        error,

        refreshCart,

        addToCart,

        updateQuantity,

        removeItem,

        clearCart,

        savePrintCustomization,

        uploadPrintImage,
      }),
      [
        cart,
        loading,
        updating,
        error,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        savePrintCustomization,
        uploadPrintImage,
      ]
    );

  return (
    <CartContext.Provider
      value={value}
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
      "useCart must be used inside CartProvider."
    );
  }

  return context;
}