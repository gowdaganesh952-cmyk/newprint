"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import { useApi } from "@/app/lib/api";
import { useCart } from "@/app/components/cart/CartProvider";

// ============================================================
// TYPES
// ============================================================

interface ProductCategory {
  _id?: string;
  name: string;
  slug?: string;
}

interface ProductOption {
  name: string;
  values: string[];
}

interface ProductOrderSelection {
  name: string;
  values: string[];
  required: boolean;
}

interface ProductVariant {
  _id?: string;
  selections: Record<string, string>;

  /**
   * Original / MRP price before discount.
   */
  originalPrice?: number;

  /**
   * Current selling price.
   */
  price: number;

  sku?: string;
  stock?: number;
  lowStockThreshold?: number;
  status?: "active" | "inactive";
}

interface Product {
  _id: string;
  name: string;
  slug?: string;
  description?: string;

  /**
   * Original / MRP price for fixed-price products.
   */
  originalPrice?: number | null;

  /**
   * Current selling price for fixed-price products.
   */
  price?: number | null;

  pricingType?: "fixed" | "variants";

  stock?: number;
  lowStockThreshold?: number;

  images?: string[];

  category?: ProductCategory | null;

  status: "active" | "inactive";

  featured: boolean;

  options?: ProductOption[];

  orderSelections?: ProductOrderSelection[];

  variants?: ProductVariant[];
}

interface ProductResponse {
  success: boolean;
  product: Product;
  message?: string;
}

interface CartItemLike {
  productId: string;
  quantity: number;
  selections?: Record<string, string>;
}

// ============================================================
// CONSTANTS
// ============================================================

const FALLBACK_IMAGE =
  "/images/product-placeholder.jpg";

// ============================================================
// ICONS
// ============================================================

function CheckIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowLeftIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

// ============================================================
// HELPERS
// ============================================================

function formatPrice(
  price: number
): string {
  return `₹${price.toLocaleString(
    "en-IN"
  )}`;
}

// ============================================================
// DISCOUNT HELPERS
// ============================================================

function getDiscountPercentage(
  originalPrice: number | null | undefined,
  sellingPrice: number | null | undefined
): number {
  if (
    typeof originalPrice !== "number" ||
    !Number.isFinite(originalPrice) ||
    originalPrice <= 0 ||
    typeof sellingPrice !== "number" ||
    !Number.isFinite(sellingPrice) ||
    sellingPrice < 0 ||
    originalPrice <= sellingPrice
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((originalPrice - sellingPrice) /
          originalPrice) *
          100
      )
    )
  );
}

function normalizeSelectionValue(
  value: unknown
): string {
  return String(
    value ?? ""
  ).trim();
}

// ============================================================
// EXACT SELECTION MATCH
// ============================================================

function selectionsMatch(
  first: Record<
    string,
    string
  > = {},
  second: Record<
    string,
    string
  > = {}
): boolean {
  const firstEntries =
    Object.entries(first)
      .map(
        ([key, value]) => [
          normalizeSelectionValue(
            key
          ),
          normalizeSelectionValue(
            value
          ),
        ]
      )
      .filter(
        ([key, value]) =>
          Boolean(key && value)
      )
      .sort(([a], [b]) =>
        a.localeCompare(b)
      );

  const secondEntries =
    Object.entries(second)
      .map(
        ([key, value]) => [
          normalizeSelectionValue(
            key
          ),
          normalizeSelectionValue(
            value
          ),
        ]
      )
      .filter(
        ([key, value]) =>
          Boolean(key && value)
      )
      .sort(([a], [b]) =>
        a.localeCompare(b)
      );

  if (
    firstEntries.length !==
    secondEntries.length
  ) {
    return false;
  }

  return firstEntries.every(
    ([key, value], index) => {
      const [
        secondKey,
        secondValue,
      ] =
        secondEntries[index];

      return (
        key === secondKey &&
        value === secondValue
      );
    }
  );
}

// ============================================================
// PARTIAL VARIANT MATCH
// ============================================================

function selectionPartiallyMatches(
  variantSelections: Record<
    string,
    string
  > = {},
  selectedSelections: Record<
    string,
    string
  > = {}
): boolean {
  const selectedEntries =
    Object.entries(
      selectedSelections
    ).filter(
      ([key, value]) =>
        normalizeSelectionValue(
          key
        ) &&
        normalizeSelectionValue(
          value
        )
    );

  return selectedEntries.every(
    ([key, value]) =>
      normalizeSelectionValue(
        variantSelections[key]
      ) ===
      normalizeSelectionValue(
        value
      )
  );
}

// ============================================================
// SKELETON
// ============================================================

const ProductDetailSkeleton =
  memo(
    function ProductDetailSkeleton() {
      return (
        <main className="min-h-[100svh] bg-[#F7F7F5] pb-20 pt-[82px] sm:pt-[96px]">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
            <div className="mb-6 h-3.5 w-48 animate-pulse rounded bg-[#E5E7EB]" />

            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-10 lg:gap-14">
              <div>
                <div className="aspect-square w-full animate-pulse rounded-[12px] bg-[#E5E7EB]" />

                <div className="mt-3 flex gap-2.5 overflow-hidden">
                  {Array.from({
                    length: 5,
                  }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className="h-[68px] w-[68px] shrink-0 animate-pulse rounded-[9px] bg-[#E5E7EB] sm:h-[76px] sm:w-[76px]"
                      />
                    )
                  )}
                </div>
              </div>

              <div className="pt-1 md:pt-3">
                <div className="h-3 w-24 animate-pulse rounded bg-[#E5E7EB]" />

                <div className="mt-4 h-9 w-4/5 animate-pulse rounded bg-[#E5E7EB]" />

                <div className="mt-4 h-7 w-28 animate-pulse rounded bg-[#E5E7EB]" />

                <div className="mt-7 space-y-3">
                  <div className="h-3 w-full animate-pulse rounded bg-[#E5E7EB]" />
                  <div className="h-3 w-11/12 animate-pulse rounded bg-[#E5E7EB]" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-[#E5E7EB]" />
                </div>

                <div className="mt-7 h-24 animate-pulse rounded-[10px] bg-[#E5E7EB]" />

                <div className="mt-6 h-12 animate-pulse rounded-[10px] bg-[#E5E7EB]" />
              </div>
            </div>
          </div>
        </main>
      );
    }
  );

ProductDetailSkeleton.displayName =
  "ProductDetailSkeleton";

// ============================================================
// PAGE
// ============================================================

export default function ProductDetailPage() {
  const params = useParams();

  const identifier = useMemo(() => {
    const value =
      params?.id;

    if (
      typeof value ===
      "string"
    ) {
      return value;
    }

    if (
      Array.isArray(value)
    ) {
      return value[0] || "";
    }

    return "";
  }, [params]);

  const { get } =
    useApi();

  const {
    items,
    addToCart,
  } = useCart();

  // ==========================================================
  // STATE
  // ==========================================================

  const [product, setProduct] =
    useState<Product | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  const [notFound, setNotFound] =
    useState(false);

  const [activeImageIndex, setActiveImageIndex] =
    useState(0);

  const [selections, setSelections] =
    useState<
      Record<string, string>
    >({});

  const [validationErrors, setValidationErrors] =
    useState<
      Record<string, string>
    >({});

  const [addedSuccess, setAddedSuccess] =
    useState(false);

  const [isAddingToCart, setIsAddingToCart] =
    useState(false);

  const [quantity, setQuantity] =
    useState(1);

  // ==========================================================
  // FETCH PRODUCT
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const fetchProduct =
      async () => {
        if (!identifier) {
          if (mounted) {
            setLoading(false);
            setNotFound(true);
          }

          return;
        }

        try {
          setLoading(true);
          setError(false);
          setNotFound(false);

          const response =
            await get<ProductResponse>(
              `/api/products/${encodeURIComponent(
                identifier
              )}`
            );

          if (!mounted) {
            return;
          }

          if (
            response?.success &&
            response.product
          ) {
            setProduct(
              response.product
            );

            setActiveImageIndex(
              0
            );

            setSelections(
              {}
            );

            setValidationErrors(
              {}
            );

            setQuantity(1);

            setAddedSuccess(
              false
            );
          } else {
            setNotFound(true);
          }
        } catch (
          err: unknown
        ) {
          if (!mounted) {
            return;
          }

          const apiError =
            err as {
              status?: number;
              message?: string;
            };

          const message =
            apiError?.message
              ?.toLowerCase()
              ?.trim() || "";

          if (
            apiError?.status ===
              404 ||
            message.includes(
              "404"
            ) ||
            message.includes(
              "not found"
            )
          ) {
            setNotFound(true);
          } else {
            setError(true);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    fetchProduct();

    return () => {
      mounted = false;
    };
  }, [
    identifier,
    get,
  ]);

  // ==========================================================
  // PRODUCT DATA
  // ==========================================================

  const productImages =
    useMemo(() => {
      if (
        !product?.images?.length
      ) {
        return [
          FALLBACK_IMAGE,
        ];
      }

      const validImages =
        product.images.filter(
          (image) =>
            typeof image ===
              "string" &&
            image.trim()
              .length > 0
        );

      return validImages.length
        ? validImages
        : [
            FALLBACK_IMAGE,
          ];
    }, [product]);

  const safeImageIndex =
    Math.min(
      activeImageIndex,
      productImages.length -
        1
    );

  const activeImage =
    productImages[
      safeImageIndex
    ] ||
    FALLBACK_IMAGE;

  const hasMultipleImages =
    productImages.length >
    1;

  const categoryName =
    product?.category?.name ||
    "Products";

  const isAvailable =
    product?.status ===
    "active";

  const orderSelections =
    product?.orderSelections ||
    [];

  const productOptions =
    product?.options || [];

  const variants =
    product?.variants || [];

  const isVariantPricing =
    product?.pricingType ===
    "variants";

  // ==========================================================
  // FIXED STOCK
  // ==========================================================

  const fixedProductStock =
    !isVariantPricing &&
    typeof product?.stock ===
      "number"
      ? Math.max(
          0,
          Math.floor(
            product.stock
          )
        )
      : 0;

  const fixedLowStockThreshold =
    !isVariantPricing &&
    typeof product?.lowStockThreshold ===
      "number"
      ? Math.max(
          0,
          Math.floor(
            product.lowStockThreshold
          )
        )
      : 5;

  // ==========================================================
  // SELECTED VARIANT
  // ==========================================================

  const selectedVariant =
    useMemo<ProductVariant | null>(
      () => {
        if (
          !product ||
          !isVariantPricing ||
          variants.length ===
            0
        ) {
          return null;
        }

        return (
          variants.find(
            (variant) => {
              if (
                !variant ||
                !variant.selections
              ) {
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
                selections
              );
            }
          ) || null
        );
      },
      [
        product,
        isVariantPricing,
        variants,
        selections,
      ]
    );

  // ==========================================================
  // VARIANT STOCK
  // ==========================================================

  const selectedVariantStock =
    isVariantPricing &&
    selectedVariant &&
    typeof selectedVariant.stock ===
      "number"
      ? Math.max(
          0,
          Math.floor(
            selectedVariant.stock
          )
        )
      : 0;

  const selectedVariantLowStockThreshold =
    isVariantPricing &&
    selectedVariant &&
    typeof selectedVariant.lowStockThreshold ===
      "number"
      ? Math.max(
          0,
          Math.floor(
            selectedVariant.lowStockThreshold
          )
        )
      : 5;

  // ==========================================================
  // DISPLAY PRICE
  // ==========================================================

  const displayPrice =
    useMemo<
      number | null
    >(() => {
      if (!product) {
        return null;
      }

      if (!isVariantPricing) {
        return typeof product.price ===
          "number"
          ? product.price
          : null;
      }

      if (
        selectedVariant &&
        typeof selectedVariant.price ===
          "number"
      ) {
        return selectedVariant.price;
      }

      return null;
    }, [
      product,
      isVariantPricing,
      selectedVariant,
    ]);

  // ==========================================================
  // ORIGINAL / MRP PRICE
  // ==========================================================

  const displayOriginalPrice =
    useMemo<
      number | null
    >(() => {
      if (!product) {
        return null;
      }

      if (!isVariantPricing) {
        if (
          typeof product.originalPrice ===
            "number" &&
          Number.isFinite(
            product.originalPrice
          )
        ) {
          return product.originalPrice;
        }

        // Backward compatibility for older products.
        return displayPrice;
      }

      if (
        selectedVariant &&
        typeof selectedVariant.originalPrice ===
          "number" &&
        Number.isFinite(
          selectedVariant.originalPrice
        )
      ) {
        return selectedVariant.originalPrice;
      }

      return displayPrice;
    }, [
      product,
      isVariantPricing,
      selectedVariant,
      displayPrice,
    ]);

  // ==========================================================
  // DISCOUNT PERCENTAGE
  // ==========================================================

  const discountPercentage =
    useMemo(() => {
      return getDiscountPercentage(
        displayOriginalPrice,
        displayPrice
      );
    }, [
      displayOriginalPrice,
      displayPrice,
    ]);

  const hasDiscount =
    discountPercentage > 0 &&
    displayOriginalPrice !== null &&
    displayPrice !== null &&
    displayOriginalPrice >
      displayPrice;

  // ==========================================================
  // CART QUANTITY FOR CURRENT SELECTION
  // ==========================================================

  const currentCartQuantity =
    useMemo(() => {
      if (!product) {
        return 0;
      }

      const currentItem =
        (
          items as CartItemLike[]
        ).find(
          (item) =>
            String(
              item.productId
            ) ===
              String(
                product._id
              ) &&
            selectionsMatch(
              item.selections ||
                {},
              selections
            )
        );

      const value =
        Number(
          currentItem?.quantity ||
            0
        );

      return Number.isFinite(
        value
      )
        ? Math.max(
            0,
            Math.floor(value)
          )
        : 0;
    }, [
      items,
      product,
      selections,
    ]);

  // ==========================================================
  // STOCK
  // ==========================================================

  const currentStock =
    isVariantPricing
      ? selectedVariant
        ? selectedVariantStock
        : 0
      : fixedProductStock;

  const remainingStock =
    Math.max(
      0,
      currentStock -
        currentCartQuantity
    );

  const hasSelectedVariant =
    !isVariantPricing ||
    Boolean(
      selectedVariant
    );

  const isCurrentSelectionOutOfStock =
    isAvailable &&
    hasSelectedVariant &&
    currentStock <= 0;

  const isCurrentSelectionLowStock =
    isAvailable &&
    hasSelectedVariant &&
    currentStock > 0 &&
    currentStock <=
      (isVariantPricing
        ? selectedVariantLowStockThreshold
        : fixedLowStockThreshold);

  // ==========================================================
  // OPTION AVAILABILITY
  // ==========================================================

  const isSelectionValueAvailable =
    useCallback(
      (
        selectionName: string,
        value: string
      ) => {
        if (
          !isVariantPricing
        ) {
          return true;
        }

        if (
          variants.length ===
          0
        ) {
          return false;
        }

        const nextSelections =
          {
            ...selections,
            [selectionName]:
              value,
          };

        return variants.some(
          (variant) => {
            if (
              !variant ||
              variant.status ===
                "inactive"
            ) {
              return false;
            }

            const stock =
              typeof variant.stock ===
              "number"
                ? Math.max(
                    0,
                    Math.floor(
                      variant.stock
                    )
                  )
                : 0;

            if (stock <= 0) {
              return false;
            }

            return selectionPartiallyMatches(
              variant.selections,
              nextSelections
            );
          }
        );
      },
      [
        isVariantPricing,
        variants,
        selections,
      ]
    );

  // ==========================================================
  // SELECT OPTION
  // ==========================================================

  const handleSelection =
    useCallback(
      (
        selectionName: string,
        value: string
      ) => {
        if (
          !isSelectionValueAvailable(
            selectionName,
            value
          )
        ) {
          return;
        }

        setQuantity(1);
        setAddedSuccess(false);

        setSelections(
          (previous) => ({
            ...previous,
            [selectionName]:
              value,
          })
        );

        setValidationErrors(
          (previous) => {
            const updated = {
              ...previous,
            };

            delete updated[
              selectionName
            ];

            delete updated._variant;

            return updated;
          }
        );
      },
      [
        isSelectionValueAvailable,
      ]
    );

  // ==========================================================
  // QUANTITY
  // ==========================================================

  const decreaseQuantity =
    useCallback(() => {
      setQuantity(
        (previous) =>
          Math.max(
            1,
            previous - 1
          )
      );
    }, []);

  const increaseQuantity =
    useCallback(() => {
      setQuantity(
        (previous) => {
          const safe =
            Number.isInteger(
              previous
            ) &&
            previous >= 1
              ? previous
              : 1;

          if (
            !hasSelectedVariant ||
            remainingStock <= 0
          ) {
            return safe;
          }

          return Math.min(
            safe + 1,
            remainingStock
          );
        }
      );
    }, [
      hasSelectedVariant,
      remainingStock,
    ]);

  // ==========================================================
  // KEEP QUANTITY VALID
  // ==========================================================

  useEffect(() => {
    if (
      !isAvailable ||
      !hasSelectedVariant
    ) {
      return;
    }

    if (
      remainingStock <= 0
    ) {
      setQuantity(1);
      return;
    }

    setQuantity(
      (previous) =>
        Math.min(
          Math.max(
            1,
            Number.isInteger(
              previous
            )
              ? previous
              : 1
          ),
          remainingStock
        )
    );
  }, [
    isAvailable,
    hasSelectedVariant,
    remainingStock,
  ]);

  // ==========================================================
  // IMAGE CONTROLS
  // ==========================================================

  const showPreviousImage =
    useCallback(() => {
      setActiveImageIndex(
        (previous) =>
          previous === 0
            ? productImages.length -
              1
            : previous - 1
      );
    }, [
      productImages.length,
    ]);

  const showNextImage =
    useCallback(() => {
      setActiveImageIndex(
        (previous) =>
          previous ===
          productImages.length -
            1
            ? 0
            : previous + 1
      );
    }, [
      productImages.length,
    ]);

  // ==========================================================
  // KEYBOARD IMAGE NAVIGATION
  // ==========================================================

  useEffect(() => {
    if (
      !hasMultipleImages
    ) {
      return;
    }

    const handleKeyDown =
      (
        event: KeyboardEvent
      ) => {
        if (
          event.key ===
          "ArrowLeft"
        ) {
          showPreviousImage();
        }

        if (
          event.key ===
          "ArrowRight"
        ) {
          showNextImage();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    hasMultipleImages,
    showPreviousImage,
    showNextImage,
  ]);

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateSelections =
    useCallback(() => {
      if (!product) {
        return false;
      }

      const errors: Record<
        string,
        string
      > = {};

      let firstMissing:
        | string
        | null = null;

      if (!isAvailable) {
        setValidationErrors(
          {
            _variant:
              "This product is currently unavailable.",
          }
        );

        return false;
      }

      // ------------------------------------------------------
      // REQUIRED OPTIONS
      // ------------------------------------------------------

      orderSelections.forEach(
        (selection) => {
          const value =
            selections[
              selection.name
            ];

          if (
            selection.required &&
            !value
          ) {
            errors[
              selection.name
            ] =
              `Please select ${selection.name}.`;

            if (
              !firstMissing
            ) {
              firstMissing =
                selection.name;
            }
          }
        }
      );

      if (
        Object.keys(errors)
          .length > 0
      ) {
        setValidationErrors(
          errors
        );

        if (
          firstMissing
        ) {
          requestAnimationFrame(
            () => {
              document
                .getElementById(
                  `selection-${firstMissing}`
                )
                ?.scrollIntoView({
                  behavior:
                    "smooth",
                  block:
                    "center",
                });
            }
          );
        }

        return false;
      }

      // ------------------------------------------------------
      // VARIANT
      // ------------------------------------------------------

      if (
        isVariantPricing
      ) {
        if (
          !selectedVariant
        ) {
          setValidationErrors(
            {
              _variant:
                "Please select all product options.",
            }
          );

          const first =
            orderSelections[0]
              ?.name;

          if (first) {
            requestAnimationFrame(
              () => {
                document
                  .getElementById(
                    `selection-${first}`
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                    block:
                      "center",
                  });
              }
            );
          }

          return false;
        }

        if (
          selectedVariant.status ===
          "inactive"
        ) {
          setValidationErrors(
            {
              _variant:
                "This selected option is currently unavailable.",
            }
          );

          return false;
        }

        if (
          typeof selectedVariant.price !==
            "number" ||
          !Number.isFinite(
            selectedVariant.price
          ) ||
          selectedVariant.price <
            0
        ) {
          setValidationErrors(
            {
              _variant:
                "This selected option does not have a valid price.",
            }
          );

          return false;
        }

        if (
          typeof selectedVariant.originalPrice ===
            "number" &&
          Number.isFinite(
            selectedVariant.originalPrice
          ) &&
          selectedVariant.originalPrice <
            selectedVariant.price
        ) {
          setValidationErrors(
            {
              _variant:
                "This selected option has an invalid original price.",
            }
          );

          return false;
        }

        if (
          selectedVariantStock <=
          0
        ) {
          setValidationErrors(
            {
              _variant:
                "This selected option is out of stock.",
            }
          );

          return false;
        }
      }

      // ------------------------------------------------------
      // FIXED PRICE
      // ------------------------------------------------------

      if (
        !isVariantPricing &&
        (typeof product.price !==
          "number" ||
          !Number.isFinite(
            product.price
          ) ||
          product.price < 0)
      ) {
        setValidationErrors(
          {
            _variant:
              "This product does not have a valid price.",
          }
        );

        return false;
      }

      // ------------------------------------------------------
      // FIXED PRODUCT DISCOUNT VALIDATION
      // ------------------------------------------------------

      if (
        !isVariantPricing &&
        typeof product.originalPrice ===
          "number" &&
        Number.isFinite(
          product.originalPrice
        ) &&
        product.originalPrice <
          (product.price ?? 0)
      ) {
        setValidationErrors(
          {
            _variant:
              "This product has an invalid original price.",
          }
        );

        return false;
      }

      // ------------------------------------------------------
      // FIXED STOCK
      // ------------------------------------------------------

      if (
        !isVariantPricing &&
        fixedProductStock <=
          0
      ) {
        setValidationErrors(
          {
            _variant:
              "This product is currently out of stock.",
          }
        );

        return false;
      }

      // ------------------------------------------------------
      // QUANTITY
      // ------------------------------------------------------

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity < 1
      ) {
        setValidationErrors(
          {
            _variant:
              "Please select a valid quantity.",
          }
        );

        return false;
      }

      // ------------------------------------------------------
      // REMAINING STOCK
      // ------------------------------------------------------

      if (
        quantity >
        remainingStock
      ) {
        setValidationErrors(
          {
            _variant:
              remainingStock <=
              0
                ? "You already have the maximum available quantity in your cart."
                : `Only ${remainingStock} ${
                    remainingStock ===
                    1
                      ? "item"
                      : "items"
                  } remaining.`,
          }
        );

        setQuantity(
          Math.max(
            1,
            remainingStock
          )
        );

        return false;
      }

      setValidationErrors(
        {}
      );

      return true;
    }, [
      product,
      isAvailable,
      orderSelections,
      selections,
      isVariantPricing,
      selectedVariant,
      selectedVariantStock,
      fixedProductStock,
      quantity,
      remainingStock,
    ]);

  // ==========================================================
  // ADD TO CART
  // ==========================================================

  const handleAddToCart =
    useCallback(async () => {
      if (
        !product ||
        !isAvailable ||
        isAddingToCart
      ) {
        return;
      }

      if (
        !validateSelections()
      ) {
        return;
      }

      const finalPrice =
        isVariantPricing
          ? selectedVariant?.price
          : product.price;

      if (
        typeof finalPrice !==
          "number" ||
        !Number.isFinite(
          finalPrice
        ) ||
        finalPrice < 0
      ) {
        return;
      }

      if (
        remainingStock <= 0 ||
        quantity >
          remainingStock
      ) {
        setValidationErrors(
          {
            _variant:
              remainingStock <=
              0
                ? "This item is out of stock."
                : `Only ${remainingStock} ${
                    remainingStock ===
                    1
                      ? "item"
                      : "items"
                  } remaining.`,
          }
        );

        return;
      }

      try {
        setIsAddingToCart(
          true
        );

        const cartProduct = {
          ...product,
          price: finalPrice,
        };

        await addToCart(
          cartProduct,
          selections,
          quantity
        );

        setQuantity(1);
        setAddedSuccess(true);

        window.setTimeout(
          () => {
            setAddedSuccess(
              false
            );
          },
          2200
        );
      } catch (err) {
        console.error(
          "Failed to add product to cart:",
          err
        );
      } finally {
        setIsAddingToCart(
          false
        );
      }
    }, [
      product,
      isAvailable,
      isAddingToCart,
      validateSelections,
      isVariantPricing,
      selectedVariant,
      addToCart,
      selections,
      quantity,
      remainingStock,
    ]);

  // ==========================================================
  // BUTTON TEXT
  // ==========================================================

  const addButtonText =
    quantity === 1
      ? "Add to Cart"
      : `Add ${quantity} to Cart`;

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <>
        <Navbar />
        <ProductDetailSkeleton />
      </>
    );
  }

  // ==========================================================
  // NOT FOUND
  // ==========================================================

  if (notFound) {
    return (
      <>
        <Navbar />

        <main className="flex min-h-[100svh] items-center justify-center bg-[#F7F7F5] px-4 py-16">
          <div className="w-full max-w-md rounded-[12px] border border-[#E5E7EB] bg-white p-7 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F7F5] text-[#64748B]">
              <PackageIcon />
            </div>

            <h1 className="mt-5 text-xl font-extrabold text-[#0A1B2E] sm:text-2xl">
              Product Not Found
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#64748B]">
              The product you're looking
              for does not exist or may
              have been removed.
            </p>

            <Link
              href="/products"
              className="mx-auto mt-7 flex min-h-11 w-full max-w-[230px] items-center justify-center gap-2 rounded-[9px] bg-[#0A1B2E] px-5 text-sm font-bold text-white transition-colors duration-150 hover:bg-[#142C46] active:bg-[#081827]"
            >
              <ArrowLeftIcon />
              Back to Products
            </Link>
          </div>
        </main>
      </>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error ||
    !product
  ) {
    return (
      <>
        <Navbar />

        <main className="flex min-h-[100svh] items-center justify-center bg-[#F7F7F5] px-4 py-16">
          <div className="w-full max-w-md rounded-[12px] border border-[#E5E7EB] bg-white p-7 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F7F5] text-[#64748B]">
              <PackageIcon />
            </div>

            <h1 className="mt-5 text-xl font-extrabold text-[#0A1B2E] sm:text-2xl">
              Unable to Load Product
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              Something went wrong
              while loading this
              product.
            </p>

            <Link
              href="/products"
              className="mx-auto mt-7 flex min-h-11 w-full max-w-[230px] items-center justify-center rounded-[9px] border border-[#D8DDE3] bg-white px-5 text-sm font-bold text-[#0A1B2E] transition-colors duration-150 hover:border-[#0A1B2E]"
            >
              Back to Products
            </Link>
          </div>
        </main>
      </>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <>
      <Navbar />

      <main className="min-h-[100svh] overflow-x-hidden bg-[#F7F7F5] pb-28 pt-[76px] sm:pb-20 sm:pt-[92px] lg:pt-[100px]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <nav
            aria-label="Breadcrumb"
            className="mb-5 overflow-hidden sm:mb-7 lg:mb-9"
          >
            <ol className="flex min-w-0 items-center gap-2 text-[10px] font-medium text-[#64748B] sm:text-xs">
              <li className="shrink-0">
                <Link
                  href="/"
                  className="transition-colors duration-150 hover:text-[#0A1B2E]"
                >
                  Home
                </Link>
              </li>

              <li className="shrink-0 text-[#CBD5E1]">
                /
              </li>

              <li className="shrink-0">
                <Link
                  href="/products"
                  className="transition-colors duration-150 hover:text-[#0A1B2E]"
                >
                  Products
                </Link>
              </li>

              <li className="shrink-0 text-[#CBD5E1]">
                /
              </li>

              <li
                aria-current="page"
                className="min-w-0 truncate font-semibold text-[#0A1B2E]"
              >
                {product.name}
              </li>
            </ol>
          </nav>

          {/* ==================================================
              MAIN CONTENT
          ================================================== */}

          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-10 lg:gap-14 xl:gap-16">

            {/* =================================================
                IMAGES
            ================================================= */}

            <section className="min-w-0">
              <div className="group relative aspect-square w-full overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_4px_20px_-16px_rgba(10,27,46,0.3)]">

                <Image
                  src={
                    activeImage
                  }
                  alt={
                    product.name
                  }
                  fill
                  priority
                  sizes="
                    (max-width: 767px) 100vw,
                    (max-width: 1200px) 50vw,
                    600px
                  "
                  className="object-cover transition-transform duration-300 ease-out md:group-hover:scale-[1.015]"
                />

                {product.featured && (
                  <span className="absolute left-3 top-3 rounded-[5px] bg-[#B9954F] px-2.5 py-1.5 text-[8px] font-extrabold uppercase tracking-[0.12em] text-white sm:left-4 sm:top-4 sm:text-[9px]">
                    Featured
                  </span>
                )}

                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      onClick={
                        showPreviousImage
                      }
                      aria-label="Previous image"
                      className="
                        absolute
                        left-2
                        top-1/2
                        flex
                        h-9
                        w-9
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-white/80
                        bg-white/95
                        text-[#0A1B2E]
                        shadow-sm
                        transition-colors
                        duration-150
                        hover:bg-white
                        active:bg-[#F7F7F5]
                        sm:left-4
                        sm:h-10
                        sm:w-10
                      "
                    >
                      <ChevronLeftIcon />
                    </button>

                    <button
                      type="button"
                      onClick={
                        showNextImage
                      }
                      aria-label="Next image"
                      className="
                        absolute
                        right-2
                        top-1/2
                        flex
                        h-9
                        w-9
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-white/80
                        bg-white/95
                        text-[#0A1B2E]
                        shadow-sm
                        transition-colors
                        duration-150
                        hover:bg-white
                        active:bg-[#F7F7F5]
                        sm:right-4
                        sm:h-10
                        sm:w-10
                      "
                    >
                      <ChevronRightIcon />
                    </button>

                    <div className="absolute bottom-3 right-3 rounded-full bg-[#0A1B2E]/85 px-2.5 py-1 text-[9px] font-bold text-white sm:hidden">
                      {safeImageIndex +
                        1}{" "}
                      /{" "}
                      {
                        productImages.length
                      }
                    </div>
                  </>
                )}
              </div>

              {/* THUMBNAILS */}

              {hasMultipleImages && (
                <div
                  className="mt-3 flex gap-2 overflow-x-auto pb-1"
                  style={{
                    scrollbarWidth:
                      "none",
                    msOverflowStyle:
                      "none",
                  }}
                >
                  {productImages.map(
                    (
                      image,
                      index
                    ) => {
                      const selected =
                        safeImageIndex ===
                        index;

                      return (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() =>
                            setActiveImageIndex(
                              index
                            )
                          }
                          aria-label={`View image ${
                            index + 1
                          }`}
                          aria-current={
                            selected
                              ? "true"
                              : undefined
                          }
                          className={`
                            relative
                            h-[66px]
                            w-[66px]
                            shrink-0
                            overflow-hidden
                            rounded-[9px]
                            border-2
                            bg-white
                            transition-[border-color,box-shadow]
                            duration-150
                            sm:h-[76px]
                            sm:w-[76px]
                            ${
                              selected
                                ? "border-[#B9954F] shadow-[0_2px_10px_rgba(185,149,79,0.18)]"
                                : "border-transparent hover:border-[#D8DDE3]"
                            }
                          `}
                        >
                          <Image
                            src={
                              image
                            }
                            alt={`${product.name} image ${
                              index +
                              1
                            }`}
                            fill
                            sizes="76px"
                            className="object-cover"
                          />
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </section>

            {/* =================================================
                PRODUCT DETAILS
            ================================================= */}

            <section className="min-w-0 md:pt-1 lg:pt-2">

              {/* CATEGORY */}

              <Link
                href="/products"
                className="inline-flex items-center rounded-full bg-[#EEEBDD] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8B6E32] transition-colors duration-150 hover:bg-[#E8E2CF]"
              >
                {categoryName}
              </Link>

              {/* NAME */}

              <h1 className="mt-4 break-words text-[28px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#0A1B2E] sm:text-3xl lg:text-[40px] lg:leading-[1.05]">
                {product.name}
              </h1>

              {/* PRICE + DISCOUNT */}

              <div className="mt-4">
                {displayPrice !==
                null ? (
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                    {hasDiscount && (
                      <span className="inline-flex items-center rounded-[5px] bg-[#E8F5E9] px-2 py-1 text-[10px] font-extrabold text-[#15803D] sm:text-[11px]">
                        ↓{discountPercentage}%
                      </span>
                    )}

                    {hasDiscount &&
                      displayOriginalPrice !==
                        null && (
                        <span className="text-[15px] font-semibold text-[#94A3B8] line-through decoration-[#94A3B8] sm:text-base">
                          {formatPrice(
                            displayOriginalPrice
                          )}
                        </span>
                      )}

                    <span className="text-[25px] font-extrabold tracking-[-0.02em] text-[#0A1B2E] sm:text-3xl">
                      {formatPrice(
                        displayPrice
                      )}
                    </span>

                    {isVariantPricing && (
                      <span className="self-end pb-1 text-[10px] font-medium text-[#94A3B8]">
                        selected
                      </span>
                    )}
                  </div>
                ) : isVariantPricing ? (
                  <span className="text-sm font-bold text-[#64748B]">
                    Select options
                  </span>
                ) : (
                  <span className="text-sm font-bold uppercase tracking-wide text-[#64748B]">
                    Custom Pricing
                  </span>
                )}

                {hasDiscount && (
                  <p className="mt-1.5 text-[10px] font-medium text-[#64748B]">
                    You save{" "}
                    <span className="font-extrabold text-[#15803D]">
                      {formatPrice(
                        (displayOriginalPrice ?? 0) -
                          (displayPrice ?? 0)
                      )}
                    </span>
                  </p>
                )}
              </div>

              {/* STOCK PILL */}

              {isAvailable &&
                hasSelectedVariant && (
                  <div className="mt-3">
                    {isCurrentSelectionOutOfStock ? (
                      <span className="inline-flex rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-extrabold text-red-600">
                        Out of stock
                      </span>
                    ) : isCurrentSelectionLowStock ? (
                      <span className="inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-extrabold text-amber-700">
                        Only{" "}
                        {
                          remainingStock
                        }{" "}
                        left
                      </span>
                    ) : remainingStock >
                      0 ? (
                      <span className="inline-flex rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-bold text-green-700">
                        In stock
                      </span>
                    ) : null}
                  </div>
                )}

              {/* DESCRIPTION */}

              {product.description && (
                <div className="mt-5 border-b border-[#E5E7EB] pb-6 sm:mt-6 sm:pb-7">
                  <p className="text-[13px] leading-6 text-[#64748B] sm:text-sm sm:leading-7">
                    {
                      product.description
                    }
                  </p>
                </div>
              )}

              {/* ERROR */}

              {validationErrors._variant && (
                <div className="mt-5 rounded-[9px] border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-xs font-semibold leading-5 text-red-600">
                    {
                      validationErrors._variant
                    }
                  </p>
                </div>
              )}

              {/* =================================================
                  OPTIONS
              ================================================= */}

              {isAvailable &&
                orderSelections.length >
                  0 && (
                  <div className="mt-6 space-y-6 sm:mt-7">
                    {orderSelections.map(
                      (
                        selection,
                        selectionIndex
                      ) => {
                        const selectedValue =
                          selections[
                            selection.name
                          ];

                        const hasError =
                          Boolean(
                            validationErrors[
                              selection.name
                            ]
                          );

                        return (
                          <div
                            key={`${selection.name}-${selectionIndex}`}
                            id={`selection-${selection.name}`}
                            className={`scroll-mt-24 ${
                              hasError
                                ? "rounded-[9px] bg-red-50/50 p-3"
                                : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h2 className="text-sm font-extrabold text-[#0A1B2E]">
                                    {
                                      selection.name
                                    }
                                  </h2>

                                  <span
                                    className={`
                                      rounded-full
                                      px-2
                                      py-0.5
                                      text-[8px]
                                      font-extrabold
                                      uppercase
                                      tracking-[0.1em]
                                      ${
                                        selection.required
                                          ? "bg-[#EEEBDD] text-[#8B6E32]"
                                          : "bg-[#F1F5F9] text-[#94A3B8]"
                                      }
                                    `}
                                  >
                                    {selection.required
                                      ? "Required"
                                      : "Optional"}
                                  </span>
                                </div>
                              </div>

                              {selectedValue && (
                                <span className="max-w-[40%] shrink-0 truncate text-xs font-semibold text-[#64748B]">
                                  {
                                    selectedValue
                                  }
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {selection.values.map(
                                (
                                  value
                                ) => {
                                  const isSelected =
                                    selectedValue ===
                                    value;

                                  const available =
                                    isSelectionValueAvailable(
                                      selection.name,
                                      value
                                    );

                                  return (
                                    <button
                                      key={
                                        value
                                      }
                                      type="button"
                                      onClick={() =>
                                        handleSelection(
                                          selection.name,
                                          value
                                        )
                                      }
                                      disabled={
                                        !available
                                      }
                                      className={`
                                        min-h-11
                                        rounded-[9px]
                                        border
                                        px-4
                                        py-2
                                        text-sm
                                        font-bold
                                        transition-[background-color,border-color,color]
                                        duration-150
                                        focus-visible:outline-none
                                        focus-visible:ring-2
                                        focus-visible:ring-[#B9954F]
                                        focus-visible:ring-offset-2
                                        ${
                                          isSelected
                                            ? "border-[#0A1B2E] bg-[#0A1B2E] text-white"
                                            : available
                                            ? "border-[#DDE2E7] bg-white text-[#0A1B2E] hover:border-[#B9954F] hover:bg-[#FBFAF6]"
                                            : "cursor-not-allowed border-[#E5E7EB] bg-[#F1F5F9] text-[#B8C0CA] line-through opacity-60"
                                        }
                                      `}
                                    >
                                      <span className="flex items-center gap-2">
                                        {isSelected && (
                                          <CheckIcon className="h-4 w-4" />
                                        )}

                                        {
                                          value
                                        }
                                      </span>
                                    </button>
                                  );
                                }
                              )}
                            </div>

                            {hasError && (
                              <p className="mt-2 text-xs font-semibold text-red-600">
                                {
                                  validationErrors[
                                    selection.name
                                  ]
                                }
                              </p>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

              {/* =================================================
                  VARIANT STOCK BOX
              ================================================= */}

              {isAvailable &&
                isVariantPricing &&
                selectedVariant && (
                  <div className="mt-5">
                    {selectedVariantStock <=
                    0 ? (
                      <div className="rounded-[9px] border border-red-200 bg-red-50 px-4 py-3">
                        <p className="text-sm font-extrabold text-red-700">
                          This variant is out of stock
                        </p>

                        <p className="mt-1 text-xs text-red-600">
                          Please choose
                          another option.
                        </p>
                      </div>
                    ) : selectedVariantStock <=
                      selectedVariantLowStockThreshold ? (
                      <div className="rounded-[9px] border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-extrabold text-amber-700">
                          Limited stock
                        </p>

                        <p className="mt-1 text-xs text-amber-700">
                          Only{" "}
                          <strong>
                            {
                              selectedVariantStock
                            }
                          </strong>{" "}
                          available.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-[9px] border border-green-200 bg-green-50 px-4 py-3">
                        <p className="text-sm font-bold text-green-700">
                          In stock
                        </p>

                        <p className="mt-1 text-xs text-green-600">
                          {
                            selectedVariantStock
                          }{" "}
                          available.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {/* =================================================
                  FIXED STOCK
              ================================================= */}

              {isAvailable &&
                !isVariantPricing &&
                fixedProductStock <=
                  fixedLowStockThreshold && (
                  <div className="mt-5">
                    {fixedProductStock <=
                    0 ? (
                      <div className="rounded-[9px] border border-red-200 bg-red-50 px-4 py-3">
                        <p className="text-sm font-extrabold text-red-700">
                          Out of stock
                        </p>

                        <p className="mt-1 text-xs text-red-600">
                          This product is
                          currently
                          unavailable.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-[9px] border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-extrabold text-amber-700">
                          Limited stock
                        </p>

                        <p className="mt-1 text-xs text-amber-700">
                          Only{" "}
                          <strong>
                            {
                              fixedProductStock
                            }
                          </strong>{" "}
                          available.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {/* =================================================
                  QUANTITY
              ================================================= */}

              {isAvailable && (
                <div className="mt-6 rounded-[10px] border border-[#E5E7EB] bg-white p-4 sm:mt-7 sm:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#0A1B2E]">
                        Quantity
                      </p>

                      <p className="mt-1 text-[11px] text-[#64748B]">
                        {currentCartQuantity >
                        0 ? (
                          <>
                            Already in
                            cart:{" "}
                            <strong className="text-[#0A1B2E]">
                              {
                                currentCartQuantity
                              }
                            </strong>
                          </>
                        ) : (
                          "Not in cart yet"
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center overflow-hidden rounded-[9px] border border-[#DDE2E7] bg-white">
                      <button
                        type="button"
                        onClick={
                          decreaseQuantity
                        }
                        disabled={
                          quantity <=
                            1 ||
                          isAddingToCart ||
                          isCurrentSelectionOutOfStock
                        }
                        aria-label="Decrease quantity"
                        className="flex h-11 w-11 items-center justify-center text-lg font-bold text-[#0A1B2E] transition-colors duration-150 hover:bg-[#F7F7F5] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        −
                      </button>

                      <span className="flex h-11 min-w-[46px] items-center justify-center border-x border-[#DDE2E7] text-sm font-extrabold text-[#0A1B2E]">
                        {
                          quantity
                        }
                      </span>

                      <button
                        type="button"
                        onClick={
                          increaseQuantity
                        }
                        disabled={
                          isAddingToCart ||
                          !hasSelectedVariant ||
                          remainingStock <=
                            0 ||
                          quantity >=
                            remainingStock
                        }
                        aria-label="Increase quantity"
                        className="flex h-11 w-11 items-center justify-center text-lg font-bold text-[#0A1B2E] transition-colors duration-150 hover:bg-[#F7F7F5] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {isAvailable &&
                    hasSelectedVariant &&
                    remainingStock >
                      0 && (
                      <p className="mt-3 text-[11px] font-medium text-[#64748B]">
                        {
                          remainingStock
                        }{" "}
                        {remainingStock ===
                        1
                          ? "item"
                          : "items"}{" "}
                        available to add
                      </p>
                    )}

                  {isAvailable &&
                    hasSelectedVariant &&
                    remainingStock <=
                      0 && (
                      <p className="mt-3 text-[11px] font-bold text-red-600">
                        No more quantity
                        available for
                        this selection.
                      </p>
                    )}

                  {displayPrice !==
                    null && (
                    <div className="mt-4 flex items-center justify-between border-t border-[#EEF0F2] pt-4">
                      <span className="text-[11px] font-medium text-[#94A3B8]">
                        {
                          quantity
                        }{" "}
                        ×{" "}
                        {formatPrice(
                          displayPrice
                        )}
                      </span>

                      <span className="text-sm font-extrabold text-[#0A1B2E]">
                        {formatPrice(
                          displayPrice *
                            quantity
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* =================================================
                  UNAVAILABLE
              ================================================= */}

              {!isAvailable && (
                <div className="mt-6 rounded-[10px] border border-[#E5E7EB] bg-white p-5">
                  <p className="text-sm font-bold text-[#0A1B2E]">
                    Currently unavailable
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#64748B]">
                    This product is
                    currently not
                    available for
                    ordering.
                  </p>
                </div>
              )}

              {/* =================================================
                  DESKTOP ADD BUTTON
              ================================================= */}

              {isAvailable && (
                <div className="mt-6 hidden sm:block">
                  <button
                    type="button"
                    onClick={
                      handleAddToCart
                    }
                    disabled={
                      isAddingToCart ||
                      !hasSelectedVariant ||
                      isCurrentSelectionOutOfStock ||
                      remainingStock <=
                        0
                    }
                    className={`
                      flex
                      h-14
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-[9px]
                      px-5
                      text-base
                      font-extrabold
                      text-white
                      transition-colors
                      duration-150
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-[#B9954F]
                      focus-visible:ring-offset-2
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      ${
                        addedSuccess
                          ? "bg-[#16A34A]"
                          : "bg-[#0A1B2E] hover:bg-[#142C46]"
                      }
                    `}
                  >
                    {isAddingToCart ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Adding...
                      </>
                    ) : addedSuccess ? (
                      <>
                        <CheckIcon />
                        Added to Cart
                      </>
                    ) : !hasSelectedVariant ? (
                      "Select Options"
                    ) : isCurrentSelectionOutOfStock ? (
                      "Out of Stock"
                    ) : remainingStock <=
                      0 ? (
                      "Maximum in Cart"
                    ) : (
                      addButtonText
                    )}
                  </button>

                  {addedSuccess && (
                    <div className="mt-3 text-center">
                      <Link
                        href="/cart"
                        className="text-sm font-semibold text-[#0A1B2E] underline decoration-[#B9954F] underline-offset-4 transition-colors duration-150 hover:text-[#B9954F]"
                      >
                        View Cart
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* =================================================
                  PRODUCT OPTIONS INFO
              ================================================= */}

              {productOptions.length >
                0 && (
                <div className="mt-7 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-3">
                  <div className="rounded-[9px] border border-[#E5E7EB] bg-white p-3.5">
                    <p className="text-xs font-bold text-[#0A1B2E]">
                      Quality
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-[#94A3B8]">
                      Carefully selected
                      products
                    </p>
                  </div>

                  <div className="rounded-[9px] border border-[#E5E7EB] bg-white p-3.5">
                    <p className="text-xs font-bold text-[#0A1B2E]">
                      Custom
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-[#94A3B8]">
                      Options available
                      per product
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* ========================================================
          MOBILE STICKY ADD TO CART
      ======================================================== */}

      {isAvailable && (
        <div
          className="
            fixed
            inset-x-0
            bottom-0
            z-40
            border-t
            border-[#E5E7EB]
            bg-white
            px-3
            pb-[calc(0.75rem+env(safe-area-inset-bottom))]
            pt-3
            shadow-[0_-8px_30px_rgba(10,27,46,0.08)]
            sm:hidden
          "
        >
          <div className="mx-auto flex w-full max-w-xl items-center gap-3">
            {/* PRICE INFO */}

            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold text-[#0A1B2E]">
                {
                  product.name
                }
              </p>

              {displayPrice !==
              null ? (
                <>
                  <div className="flex items-center gap-1.5">
                    {hasDiscount && (
                      <span className="rounded-[4px] bg-[#E8F5E9] px-1.5 py-0.5 text-[8px] font-extrabold text-[#15803D]">
                        ↓{discountPercentage}%
                      </span>
                    )}

                    {hasDiscount &&
                      displayOriginalPrice !==
                        null && (
                        <span className="text-[9px] font-semibold text-[#94A3B8] line-through">
                          {formatPrice(
                            displayOriginalPrice
                          )}
                        </span>
                      )}

                    <p className="text-sm font-extrabold text-[#B9954F]">
                      {formatPrice(
                        displayPrice
                      )}
                    </p>
                  </div>

                  <p className="mt-0.5 truncate text-[9px] font-medium text-[#64748B]">
                    {!hasSelectedVariant
                      ? "Select options"
                      : isCurrentSelectionOutOfStock
                      ? "Out of stock"
                      : remainingStock <=
                        0
                      ? "Maximum in cart"
                      : currentCartQuantity >
                        0
                      ? `${currentCartQuantity} already in cart`
                      : `${remainingStock} available`}
                  </p>
                </>
              ) : (
                <p className="mt-0.5 text-[9px] font-semibold text-[#94A3B8]">
                  Select options
                </p>
              )}
            </div>

            {/* BUTTON */}

            <button
              type="button"
              onClick={
                handleAddToCart
              }
              disabled={
                isAddingToCart ||
                !hasSelectedVariant ||
                isCurrentSelectionOutOfStock ||
                remainingStock <=
                  0
              }
              className={`
                flex
                h-12
                min-w-[142px]
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-[9px]
                px-3
                text-xs
                font-extrabold
                text-white
                transition-colors
                duration-150
                active:bg-[#081827]
                disabled:cursor-not-allowed
                disabled:opacity-60
                ${
                  addedSuccess
                    ? "bg-[#16A34A]"
                    : "bg-[#0A1B2E]"
                }
              `}
            >
              {isAddingToCart ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Adding
                </>
              ) : addedSuccess ? (
                <>
                  <CheckIcon />
                  Added
                </>
              ) : !hasSelectedVariant ? (
                "Select Options"
              ) : isCurrentSelectionOutOfStock ? (
                "Out of Stock"
              ) : remainingStock <=
                0 ? (
                "Maximum in Cart"
              ) : quantity ===
                1 ? (
                "Add to Cart"
              ) : (
                `Add ${quantity}`
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}