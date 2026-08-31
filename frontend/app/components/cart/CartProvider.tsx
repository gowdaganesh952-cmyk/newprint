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
  const api = useApi();

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
          await api.get<any>(
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

        console.error(
          "Cart refresh error:",
          requestError
        );

        setError(message);
      } finally {
        setLoading(false);
      }
    }, [api]);

  /* ==========================================================
     INITIAL CART LOAD
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadCart =
      async () => {
        try {
          setError(null);

          const data =
            await api.get<any>(
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
            const message =
              requestError instanceof
              Error
                ? requestError.message
                : "Failed to load cart.";

            console.error(
              "Initial cart error:",
              requestError
            );

            setError(message);
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
  }, [api]);

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

          console.log(
            "ADD TO CART REQUEST:",
            payload
          );

          const data =
            await api.post<any>(
              "/api/cart/items",
              payload
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
      [api]
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
            await api.patch<any>(
              `/api/cart/items/${encodeURIComponent(
                itemId
              )}`,
              {
                quantity,
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

          console.error(
            "Update quantity error:",
            requestError
          );

          setError(message);

          return false;
        } finally {
          setUpdating(false);
        }
      },
      [api]
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
          setError(null);

          const data =
            await api.delete<any>(
              `/api/cart/items/${encodeURIComponent(
                itemId
              )}`
            );

          setCart(
            normalizeCart(data)
          );

          return true;
        } catch (
          requestError
        ) {
          console.error(
            "Remove cart item error:",
            requestError
          );

          return false;
        }
      },
      [api]
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
            await api.delete<any>(
              "/api/cart"
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

          console.error(
            "Clear cart error:",
            requestError
          );

          setError(message);

          return false;
        } finally {
          setUpdating(false);
        }
      },
      [api]
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
      [api]
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
      [api]
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

