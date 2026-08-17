"use client";

import {
  memo,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useApi } from "../lib/api";

// ============================================================
// TYPES
// ============================================================

interface ProductCategory {
  _id?: string;
  name: string;
  slug?: string;
  status?: string;
}

interface ProductVariant {
  _id?: string;
  selections: Record<string, string>;
  originalPrice?: number;
  price: number;
  stock?: number;
  lowStockThreshold?: number;
  status?: "active" | "inactive";
}

interface Product {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  originalPrice?: number;
  price?: number;
  pricingType?: "fixed" | "variants";
  images?: string[];
  category?: ProductCategory | null;
  featured?: boolean;
  status?: "active" | "inactive" | string;
  options?: {
    name: string;
    values: string[];
  }[];
  variants?: ProductVariant[];
}

interface ProductsResponse {
  success?: boolean;
  products?: Product[];
  data?: Product[];
}

// ============================================================
// CONSTANTS
// ============================================================

const FEATURED_LIMIT = 6;

/*
 * Safety timeout for product-image readiness.
 *
 * We don't want one broken/slow image to keep the entire
 * homepage behind the loader forever.
 */
const IMAGE_READY_TIMEOUT = 4500;

// ============================================================
// ARROW ICON
// ============================================================

const ArrowUpRightIcon = memo(
  ({ className = "" }: { className?: string }) => (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7" />
      <path d="M7 7H17V17" />
    </svg>
  )
);

ArrowUpRightIcon.displayName = "ArrowUpRightIcon";

// ============================================================
// SKELETON
// ============================================================

const ProductSkeleton = memo(() => {
  return (
    <div
      className="
        overflow-hidden
        rounded-[12px]
        border
        border-[#E5E7EB]
        bg-white
      "
      aria-hidden="true"
    >
      <div
        className="
          aspect-square
          w-full
          animate-pulse
          bg-[#E8E7E3]
        "
      />

      <div className="p-3.5 sm:p-5">
        <div className="h-2.5 w-20 animate-pulse rounded bg-[#E5E7EB]" />

        <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-[#E5E7EB]" />

        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-[#E5E7EB]" />

        <div className="mt-4 flex items-center justify-between border-t border-[#E5E7EB] pt-3">
          <div className="h-4 w-14 animate-pulse rounded bg-[#E5E7EB]" />

          <div className="h-8 w-8 animate-pulse rounded-full bg-[#E5E7EB]" />
        </div>
      </div>
    </div>
  );
});

ProductSkeleton.displayName = "ProductSkeleton";

// ============================================================
// EMPTY STATE
// ============================================================

const EmptyState = memo(() => {
  return (
    <div className="mx-auto max-w-xl rounded-[12px] border border-[#E5E7EB] bg-white px-6 py-10 text-center sm:px-10 sm:py-14">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F7F5] text-[#B9954F]">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 7h18" />
          <path d="M5 7l1 13h12l1-13" />
          <path d="M9 7V5a3 3 0 016 0v2" />
        </svg>
      </div>

      <h3 className="mt-5 text-lg font-extrabold tracking-[-0.02em] text-[#0A1B2E] sm:text-xl">
        Featured Products Coming Soon
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
        We are preparing our featured collection. Check back soon to explore
        our custom printing products.
      </p>
    </div>
  );
});

EmptyState.displayName = "EmptyState";

// ============================================================
// ERROR STATE
// ============================================================

const ErrorState = memo(() => {
  return (
    <div className="mx-auto max-w-xl rounded-[12px] border border-[#E5E7EB] bg-white px-6 py-10 text-center sm:px-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F7F5] text-[#0A1B2E]">
        <svg
          width="23"
          height="23"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      </div>

      <h3 className="mt-4 text-base font-bold text-[#0A1B2E] sm:text-lg">
        Products are temporarily unavailable
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
        Please try again later.
      </p>
    </div>
  );
});

ErrorState.displayName = "ErrorState";

// ============================================================
// PRICE / DISCOUNT HELPERS
// ============================================================

function getDiscountPercentage(
  originalPrice?: number | null,
  sellingPrice?: number | null
): number {
  if (
    typeof originalPrice !== "number" ||
    typeof sellingPrice !== "number" ||
    !Number.isFinite(originalPrice) ||
    !Number.isFinite(sellingPrice) ||
    originalPrice <= 0 ||
    sellingPrice < 0 ||
    originalPrice <= sellingPrice
  ) {
    return 0;
  }

  return Math.min(
    99,
    Math.max(
      0,
      Math.round(
        ((originalPrice - sellingPrice) / originalPrice) * 100
      )
    )
  );
}

function formatProductPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

function getVariantDisplayPrices(product: Product) {
  const variants = Array.isArray(product.variants)
    ? product.variants.filter(
        (variant) =>
          variant &&
          variant.status !== "inactive" &&
          typeof variant.price === "number" &&
          Number.isFinite(variant.price)
      )
    : [];

  if (variants.length === 0) {
    return null;
  }

  const sellingPrices = variants.map(
    (variant) => variant.price
  );

  const minSellingPrice = Math.min(...sellingPrices);
  const maxSellingPrice = Math.max(...sellingPrices);

  const discountedVariants = variants.filter(
    (variant) =>
      typeof variant.originalPrice === "number" &&
      variant.originalPrice > variant.price
  );

  const variantWithBestDiscount =
    discountedVariants.length > 0
      ? discountedVariants.reduce((best, current) => {
          const bestDiscount = getDiscountPercentage(
            best.originalPrice,
            best.price
          );

          const currentDiscount = getDiscountPercentage(
            current.originalPrice,
            current.price
          );

          return currentDiscount > bestDiscount
            ? current
            : best;
        })
      : null;

  return {
    minSellingPrice,
    maxSellingPrice,
    hasPriceRange:
      minSellingPrice !== maxSellingPrice,
    discountedVariant: variantWithBestDiscount,
  };
}

// ============================================================
// IMAGE VALIDATION
// ============================================================

function getProductImage(product: Product): string {
  const rawImage = product.images?.[0];

  if (
    typeof rawImage === "string" &&
    rawImage.trim().length > 0 &&
    (
      rawImage.startsWith("https://") ||
      rawImage.startsWith("http://") ||
      rawImage.startsWith("/")
    )
  ) {
    return rawImage;
  }

  return "/images/product-placeholder.jpg";
}

// ============================================================
// WAIT FOR INITIAL PRODUCT IMAGES
// ============================================================

async function waitForInitialProductImages(): Promise<void> {
  /*
   * Only wait for images that are actually present in the
   * rendered featured-product grid.
   */
  const images = Array.from(
    document.querySelectorAll<HTMLImageElement>(
      "[data-newprint-featured-image='true']"
    )
  );

  /*
   * No images means the page has nothing to wait for.
   */
  if (images.length === 0) {
    return;
  }

  /*
   * Wait for each image to either:
   *
   * - already be complete,
   * - successfully decode,
   * - load,
   * - or fail.
   *
   * We don't reject on image errors because the page itself
   * should still become usable.
   */
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          const finish = () => {
            image.removeEventListener("load", finish);
            image.removeEventListener("error", finish);
            resolve();
          };

          image.addEventListener("load", finish, {
            once: true,
          });

          image.addEventListener("error", finish, {
            once: true,
          });

          /*
           * Extra safety for a browser/network edge case.
           */
          window.setTimeout(finish, IMAGE_READY_TIMEOUT);
        })
    )
  );

  /*
   * If supported, allow the browser to finish decoding
   * images before the loader is removed.
   */
  await Promise.all(
    images.map(async (image) => {
      if (typeof image.decode !== "function") {
        return;
      }

      try {
        await image.decode();
      } catch {
        /*
         * A failed decode should never block the homepage.
         */
      }
    })
  );
}

// ============================================================
// DISPATCH HOMEPAGE READY EVENT
// ============================================================

function dispatchProductsReady() {
  /*
   * Custom event consumed by HomePageReady.
   */
  window.dispatchEvent(
    new CustomEvent("newprint:products-ready")
  );
}

// ============================================================
// PRODUCT CARD
// ============================================================

const ProductCard = memo(
  ({
    product,
    index,
  }: {
    product: Product;
    index: number;
  }) => {
    const image = getProductImage(product);

    const productHref =
      `/products/${product.slug || product._id}`;

    /*
     * Only the first two images receive priority.
     *
     * This is especially useful for the mobile 2-column
     * layout where the first two products are immediately
     * visible.
     */
    const isPriority = index < 2;

    const isVariantProduct =
      product.pricingType === "variants";

    const variantPrices = isVariantProduct
      ? getVariantDisplayPrices(product)
      : null;

    const sellingPrice =
      !isVariantProduct &&
      typeof product.price === "number"
        ? product.price
        : null;

    const originalPrice =
      !isVariantProduct &&
      typeof product.originalPrice === "number"
        ? product.originalPrice
        : null;

    const discountPercentage =
      getDiscountPercentage(
        originalPrice,
        sellingPrice
      );

    const hasFixedDiscount =
      discountPercentage > 0;

    const variantDiscount =
      variantPrices?.discountedVariant
        ? getDiscountPercentage(
            variantPrices.discountedVariant.originalPrice,
            variantPrices.discountedVariant.price
          )
        : 0;

    return (
      <article
        className="
          group
          relative
          min-w-0
          overflow-hidden
          rounded-[12px]
          border
          border-[#E5E7EB]
          bg-white
          transition-[transform,border-color,box-shadow]
          duration-200
          ease-out
          md:hover:-translate-y-1
          md:hover:border-[#B9954F]/60
          md:hover:shadow-[0_14px_32px_-18px_rgba(10,27,46,0.3)]
        "
      >
        <Link
          href={productHref}
          className="block"
          aria-label={`View ${product.name}`}
        >
          <div className="relative aspect-square w-full overflow-hidden bg-[#F5F4F0]">
            <Image
              src={image}
              alt={product.name}
              fill
              priority={isPriority}
              loading={isPriority ? undefined : "lazy"}
              sizes="
                (max-width: 639px) 50vw,
                (max-width: 1023px) 33vw,
                25vw
              "
              data-newprint-featured-image="true"
              className="
                object-cover
                transition-transform
                duration-300
                ease-out
                md:group-hover:scale-[1.035]
              "
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.12] via-transparent to-transparent" />

            {product.category?.name && (
              <div className="absolute left-2.5 top-2.5 z-10 max-w-[55%] sm:left-3 sm:top-3">
                <span className="block truncate rounded-[5px] bg-[#0A1B2E]/90 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-white sm:px-2.5 sm:text-[9px]">
                  {product.category.name}
                </span>
              </div>
            )}

            {(hasFixedDiscount || variantDiscount > 0) && (
              <div className="absolute bottom-2.5 left-2.5 z-10 sm:bottom-3 sm:left-3">
                <span className="inline-flex items-center rounded-[5px] bg-[#D92D20] px-2 py-1.5 text-[9px] font-extrabold leading-none text-white shadow-sm sm:px-2.5 sm:text-[10px]">
                  {variantDiscount > 0 &&
                  !hasFixedDiscount
                    ? `↓${variantDiscount}%`
                    : `↓${discountPercentage}%`}
                </span>
              </div>
            )}

            {product.featured && (
              <div className="absolute right-2.5 top-2.5 z-10 sm:right-3 sm:top-3">
                <span className="rounded-[5px] bg-[#B9954F] px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.1em] text-white sm:px-2.5 sm:text-[9px]">
                  Featured
                </span>
              </div>
            )}
          </div>

          <div className="p-3.5 sm:p-5">
            <p className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-[#B9954F] sm:text-[9px]">
              New Print
            </p>

            <h3 className="mt-1.5 truncate text-[13px] font-bold tracking-[-0.01em] text-[#0A1B2E] sm:text-base md:transition-colors md:duration-200 md:group-hover:text-[#B9954F]">
              {product.name}
            </h3>

            {product.description ? (
              <p className="mt-1.5 line-clamp-1 text-[10px] leading-4 text-[#64748B] sm:text-xs sm:leading-5">
                {product.description}
              </p>
            ) : (
              <p className="mt-1.5 text-[10px] leading-4 text-[#94A3B8] sm:text-xs">
                Custom printing available
              </p>
            )}

            <div className="mt-3 border-t border-[#E5E7EB] pt-3 sm:mt-4 sm:pt-3.5">
              {!isVariantProduct &&
              sellingPrice !== null ? (
                <div className="min-w-0">
                  {hasFixedDiscount ? (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[9px] font-extrabold text-[#D92D20] sm:text-[10px]">
                        {discountPercentage}% OFF
                      </span>

                      <span className="text-[10px] font-semibold text-[#94A3B8] line-through sm:text-xs">
                        {formatProductPrice(
                          originalPrice!
                        )}
                      </span>

                      <span className="text-sm font-extrabold tracking-[-0.01em] text-[#0A1B2E] sm:text-base">
                        {formatProductPrice(
                          sellingPrice
                        )}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-extrabold tracking-[-0.01em] text-[#0A1B2E] sm:text-base">
                      {formatProductPrice(
                        sellingPrice
                      )}
                    </span>
                  )}
                </div>
              ) : variantPrices ? (
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    {variantPrices.discountedVariant &&
                      variantDiscount > 0 && (
                        <span className="text-[9px] font-extrabold text-[#D92D20] sm:text-[10px]">
                          {variantDiscount}% OFF
                        </span>
                      )}

                    <span className="text-sm font-extrabold tracking-[-0.01em] text-[#0A1B2E] sm:text-base">
                      {variantPrices.hasPriceRange
                        ? `From ${formatProductPrice(
                            variantPrices.minSellingPrice
                          )}`
                        : formatProductPrice(
                            variantPrices.minSellingPrice
                          )}
                    </span>
                  </div>

                  {variantPrices.discountedVariant &&
                    variantDiscount > 0 && (
                      <p className="mt-1 text-[9px] font-medium text-[#94A3B8]">
                        Selected options may have different
                        prices
                      </p>
                    )}
                </div>
              ) : (
                <span className="text-[10px] font-semibold text-[#64748B] sm:text-xs">
                  Select options
                </span>
              )}

              <div className="mt-3 flex items-center justify-end">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F7F7F5] text-[#0A1B2E] transition-colors duration-200 md:group-hover:bg-[#0A1B2E] md:group-hover:text-white sm:h-8 sm:w-8">
                  <ArrowUpRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }
);

ProductCard.displayName = "ProductCard";

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function FeaturedProducts() {
  const { get } = useApi();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const readyDispatchedRef = useRef(false);

  // ==========================================================
  // DISPATCH READY ONCE
  // ==========================================================

  const notifyHomepageReady = () => {
    if (readyDispatchedRef.current) {
      return;
    }

    readyDispatchedRef.current = true;

    dispatchProductsReady();
  };

  // ==========================================================
  // FETCH FEATURED PRODUCTS
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(false);

        const response =
          await get<ProductsResponse>(
            "/api/products?status=active&featured=true&limit=6"
          );

        if (!mounted) {
          return;
        }

        const rawProducts =
          response?.products ||
          response?.data ||
          [];

        if (!Array.isArray(rawProducts)) {
          setProducts([]);
          return;
        }

        const featuredProducts =
          rawProducts
            .filter(
              (product) =>
                product &&
                product.status === "active" &&
                product.featured === true
            )
            .slice(0, FEATURED_LIMIT);

        setProducts(featuredProducts);
      } catch (err) {
        console.error(
          "Failed to fetch featured products:",
          err
        );

        if (mounted) {
          setError(true);
          setProducts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedProducts();

    return () => {
      mounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================
  // WAIT FOR RENDERED PRODUCT IMAGES
  // ==========================================================

  useEffect(() => {
    if (loading) {
      return;
    }

    let cancelled = false;

    const finishReadiness = async () => {
      /*
       * Give React one frame to commit the product cards.
       */
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          resolve();
        });
      });

      if (cancelled) {
        return;
      }

      /*
       * Wait for the initial visible product images.
       */
      await waitForInitialProductImages();

      if (cancelled) {
        return;
      }

      /*
       * Give the browser another frame after image decoding.
       */
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          resolve();
        });
      });

      if (cancelled) {
        return;
      }

      /*
       * Tell HomePageReady:
       *
       * Featured Products data is ready.
       * Initial product layout is rendered.
       * Initial product images are ready enough to reveal.
       */
      notifyHomepageReady();
    };

    finishReadiness();

    return () => {
      cancelled = true;
    };
  }, [loading, products.length]);

  // ==========================================================
  // SAFETY READY FALLBACK
  // ==========================================================

  useEffect(() => {
    /*
     * If there are no products because the API returned an
     * empty collection or an error, there are no product images
     * to wait for.
     */
    if (loading) {
      return;
    }

    if (products.length === 0) {
      const timer = window.setTimeout(() => {
        notifyHomepageReady();
      }, 80);

      return () => {
        window.clearTimeout(timer);
      };
    }

    return;
  }, [loading, products.length]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-[#F7F7F5]
        py-12
        sm:py-16
        lg:py-20
      "
      aria-labelledby="featured-products-heading"
    >
      {/* =====================================================
          LIGHT DECORATION
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -right-32
          top-10
          h-64
          w-64
          rounded-full
          bg-[#B9954F]/[0.04]
          sm:-right-20
          sm:h-80
          sm:w-80
        "
        aria-hidden="true"
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-20
          -left-32
          h-64
          w-64
          rounded-full
          bg-[#0A1B2E]/[0.02]
          sm:h-80
          sm:w-80
        "
        aria-hidden="true"
      />

      {/* =====================================================
          CONTAINER
      ====================================================== */}

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-7 flex flex-col gap-5 sm:mb-9 lg:mb-11 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-[2px] w-7 shrink-0 bg-[#B9954F]" />

              <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#B9954F] sm:text-[10px] lg:text-xs">
                Featured Collection
              </span>
            </div>

            <h2
              id="featured-products-heading"
              className="
                max-w-2xl
                text-[29px]
                font-extrabold
                leading-[1.08]
                tracking-[-0.035em]
                text-[#0A1B2E]
                sm:text-4xl
                lg:text-5xl
              "
            >
              Our most popular
              <br />
              <span className="text-[#B9954F]">
                printing products.
              </span>
            </h2>

            <p className="mt-4 max-w-xl text-[13px] leading-6 text-[#64748B] sm:text-sm sm:leading-7 lg:text-base">
              Discover custom products made for teams,
              businesses, events, and everyday moments.
            </p>
          </div>

          <Link
            href="/products"
            className="
              inline-flex
              min-h-[44px]
              w-fit
              items-center
              justify-center
              gap-2
              rounded-[8px]
              border
              border-[#D8DDE3]
              bg-white
              px-4
              text-xs
              font-semibold
              text-[#0A1B2E]
              transition-colors
              duration-200
              hover:border-[#B9954F]
              hover:bg-[#FBFBF9]
              active:bg-[#F7F7F5]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#B9954F]
              focus-visible:ring-offset-2
              sm:px-5
              sm:text-sm
            "
          >
            View All Products

            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading && (
          <div
            className="
              grid
              grid-cols-2
              gap-3
              sm:gap-5
              lg:grid-cols-4
              lg:gap-6
            "
            aria-label="Loading products"
          >
            {Array.from({
              length: 4,
            }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        )}

        {/* ===================================================
            ERROR
        =================================================== */}

        {!loading && error && <ErrorState />}

        {/* ===================================================
            EMPTY
        =================================================== */}

        {!loading &&
          !error &&
          products.length === 0 && (
            <EmptyState />
          )}

        {/* ===================================================
            PRODUCTS
        =================================================== */}

        {!loading &&
          !error &&
          products.length > 0 && (
            <div
              className="
                grid
                grid-cols-2
                gap-3
                sm:gap-5
                lg:grid-cols-4
                lg:gap-6
              "
            >
              {products.map(
                (product, index) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    index={index}
                  />
                )
              )}
            </div>
          )}
      </div>
    </section>
  );
}