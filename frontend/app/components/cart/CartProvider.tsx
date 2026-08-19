"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
   API BASE URL
============================================================ */

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

/* ============================================================
   API REQUEST
============================================================ */

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,

      credentials: "include",

      headers: {
        ...(options.body instanceof FormData
          ? {}
          : {
              "Content-Type":
                "application/json",
            }),

        ...(options.headers || {}),
      },

      cache: "no-store",
    }
  );

  const responseText =
    await response.text();

  let data: any = null;

  if (responseText) {
    try {
      data =
        JSON.parse(responseText);
    } catch {
      data = {
        message: responseText,
      };
    }
  }

  if (!response.ok) {
    console.error(
      "========================================"
    );

    console.error(
      "CART API ERROR"
    );

    console.error(
      "Path:",
      path
    );

    console.error(
      "Status:",
      response.status
    );

    console.error(
      "Response:",
      data
    );

    console.error(
      "========================================"
    );

    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}.`
    );
  }

  return data as T;
}

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
              image?.url &&
              image?.publicId
          )
          .map(
            (image: any) => ({
              url: String(
                image.url
              ),
              publicId: String(
                image.publicId
              ),
            })
          )
      : [];

  return {
    unitId:
      typeof unit?.unitId ===
        "string" &&
      unit.unitId.trim()
        ? unit.unitId
        : `unit_${index}_${Date.now()}`,

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

  let printUnits =
    Array.isArray(
      item?.printUnits
    )
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
                Boolean(
                  key.trim()
                ) &&
                Boolean(
                  value.trim()
                )
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
        Number(
          item?.price
        )
      )
        ? Number(
            item.price
          )
        : 0,

    quantity,

    selections,

    printUnits,
  };
}

/* ============================================================
   NORMALIZE CART
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

  const subtotal = Number(
    rawCart.subtotal
  );

  const shippingCharge =
    Number(
      rawCart.shippingCharge
    );

  const total = Number(
    rawCart.total
  );

  const itemCount = Number(
    rawCart.itemCount
  );

  const calculatedSubtotal =
    items.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.quantity,
      0
    );

  const calculatedItemCount =
    items.reduce(
      (sum, item) =>
        sum +
        item.quantity,
      0
    );

  const safeSubtotal =
    Number.isFinite(
      subtotal
    )
      ? subtotal
      : calculatedSubtotal;

  const safeShipping =
    Number.isFinite(
      shippingCharge
    )
      ? shippingCharge
      : 0;

  return {
    items,

    subtotal:
      safeSubtotal,

    shippingCharge:
      safeShipping,

    total:
      Number.isFinite(
        total
      )
        ? total
        : safeSubtotal +
          safeShipping,

    itemCount:
      Number.isFinite(
        itemCount
      )
        ? itemCount
        : calculatedItemCount,
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
  const [cart, setCart] =
    useState<CartData>({
      items: [],
      subtotal: 0,
      shippingCharge: 0,
      total: 0,
      itemCount: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [updating, setUpdating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null
    );

  /* ==========================================================
     REFRESH CART
  ========================================================== */

  const refreshCart =
    useCallback(async () => {
      try {
        setError(null);

        const data =
          await apiRequest<any>(
            "/api/cart"
          );

        setCart(
          normalizeCart(data)
        );
      } catch (
        requestError
      ) {
        const message =
          requestError instanceof
          Error
            ? requestError.message
            : "Failed to load cart.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }, []);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadCart =
      async () => {
        try {
          setError(null);

          const data =
            await apiRequest<any>(
              "/api/cart"
            );

          if (!cancelled) {
            setCart(
              normalizeCart(
                data
              )
            );
          }
        } catch (
          requestError
        ) {
          if (!cancelled) {
            setError(
              requestError instanceof
                Error
                ? requestError.message
                : "Failed to load cart."
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    loadCart();

    return () => {
      cancelled = true;
    };
  }, []);

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
                    String(key).trim(),
                    String(
                      value ?? ""
                    ).trim(),
                  ]
                )
                .filter(
                  ([key, value]) =>
                    Boolean(key) &&
                    Boolean(value)
                )
            );

          /*
           * IMPORTANT:
           *
           * Do NOT send the frontend
           * price to the backend.
           *
           * Backend calculates the
           * trusted price from Product.
           */

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

          console.log(
            "ADD TO CART REQUEST:",
            payload
          );

          const data =
            await apiRequest<any>(
              "/api/cart/items",
              {
                method:
                  "POST",

                body:
                  JSON.stringify(
                    payload
                  ),
              }
            );

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

          setError(message);

          console.error(
            "Failed to add product to cart:",
            message
          );

          return false;
        } finally {
          setUpdating(false);
        }
      },
      []
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

          const data =
            await apiRequest<any>(
              `/api/cart/items/${encodeURIComponent(
                itemId
              )}`,
              {
                method:
                  "PATCH",

                body:
                  JSON.stringify({
                    quantity,
                  }),
              }
            );

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

          setError(message);

          return false;
        } finally {
          setUpdating(false);
        }
      },
      []
    );

  /* ==========================================================
     REMOVE ITEM
  ========================================================== */

  const removeItem =
    useCallback(
      async (
        itemId: string
      ): Promise<boolean> => {
        if (!itemId) {
          return false;
        }

        try {
          setUpdating(true);
          setError(null);

          const data =
            await apiRequest<any>(
              `/api/cart/items/${encodeURIComponent(
                itemId
              )}`,
              {
                method:
                  "DELETE",
              }
            );

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
              : "Failed to remove item.";

          setError(message);

          return false;
        } finally {
          setUpdating(false);
        }
      },
      []
    );

  /* ==========================================================
     CLEAR CART
  ========================================================== */

  const clearCart =
    useCallback(
      async (): Promise<boolean> => {
        try {
          setUpdating(true);
          setError(null);

          const data =
            await apiRequest<any>(
              "/api/cart",
              {
                method:
                  "DELETE",
              }
            );

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

          setError(message);

          return false;
        } finally {
          setUpdating(false);
        }
      },
      []
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
        try {
          setUpdating(true);
          setError(null);

          const cleanedUnits =
            Array.isArray(
              printUnits
            )
              ? printUnits.map(
                  (unit) => ({
                    unitId:
                      String(
                        unit?.unitId ||
                          ""
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

          const data =
            await apiRequest<any>(
              `/api/cart/items/${encodeURIComponent(
                itemId
              )}/print-customization`,
              {
                method:
                  "PATCH",

                body:
                  JSON.stringify({
                    printUnits:
                      cleanedUnits,
                  }),
              }
            );

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

          setError(message);

          return false;
        } finally {
          setUpdating(false);
        }
      },
      []
    );

  /* ==========================================================
     UPLOAD PRINT IMAGE
  ========================================================== */

  const uploadPrintImage =
    useCallback(
      async (
        file: File
      ): Promise<PrintImage | null> => {
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
            await apiRequest<any>(
              "/api/cart/print-image",
              {
                method:
                  "POST",

                body:
                  formData,
              }
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

          setError(message);

          return null;
        }
      },
      []
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