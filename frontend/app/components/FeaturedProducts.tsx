"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
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
const IMAGE_READY_TIMEOUT = 4500;
const PLACEHOLDER_IMAGE = "/images/product-placeholder.jpg";

// ============================================================
// SMALL ARROW ICON
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
        min-w-0
        overflow-hidden
        rounded-[12px]
        border
        border-[#E5E7EB]
        bg-white
      "
      aria-hidden="true"
    >
      {/* IMAGE */}
      <div className="aspect-square w-full animate-pulse bg-[#E8E7E3]" />

      {/* CONTENT */}
      <div className="p-3.5 sm:p-5">
        <div className="h-2.5 w-16 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="mt-4 h-4 w-28 animate-pulse rounded bg-[#E5E7EB]" />
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
    <div
      className="
        mx-auto
        max-w-xl
        rounded-[12px]
        border
        border-[#E5E7EB]
        bg-white
        px-6
        py-10
        text-center
        sm:px-10
        sm:py-12
      "
    >
      <div
        className="
          mx-auto
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-full
          bg-[#F7F7F5]
          text-[#B9954F]
        "
      >
        <svg
          width="24"
          height="24"
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

      <h3
        className="
          mt-4
          text-lg
          font-extrabold
          tracking-[-0.02em]
          text-[#0A1B2E]
          sm:text-xl
        "
      >
        Featured Products Coming Soon
      </h3>

      <p
        className="
          mx-auto
          mt-2
          max-w-md
          text-sm
          leading-6
          text-[#64748B]
        "
      >
        Our featured collection is being prepared. Check back soon.
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
    <div
      className="
        mx-auto
        max-w-xl
        rounded-[12px]
        border
        border-[#E5E7EB]
        bg-white
        px-6
        py-10
        text-center
        sm:px-10
        sm:py-12
      "
    >
      <div
        className="
          mx-auto
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-full
          bg-[#F7F7F5]
          text-[#0A1B2E]
        "
      >
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

      <h3
        className="
          mt-4
          text-base
          font-bold
          text-[#0A1B2E]
          sm:text-lg
        "
      >
        Products are temporarily unavailable
      </h3>

      <p
        className="
          mx-auto
          mt-2
          max-w-md
          text-sm
          leading-6
          text-[#64748B]
        "
      >
        Please try again later.
      </p>
    </div>
  );
});

ErrorState.displayName = "ErrorState";

// ============================================================
// PRICE HELPERS
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
      Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
    )
  );
}

function formatProductPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

// ============================================================
// VARIANT PRICE HELPERS
// ============================================================

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

  const sellingPrices = variants.map((variant) => variant.price);
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
          return currentDiscount > bestDiscount ? current : best;
        })
      : null;

  return {
    minSellingPrice,
    maxSellingPrice,
    hasPriceRange: minSellingPrice !== maxSellingPrice,
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
    (rawImage.startsWith("https://") ||
      rawImage.startsWith("http://") ||
      rawImage.startsWith("/"))
  ) {
    return rawImage.trim();
  }

  return PLACEHOLDER_IMAGE;
}

// ============================================================
// PRODUCT IMAGE
// ============================================================

const ProductImage = memo(
  ({
    src,
    alt,
    priority,
  }: {
    src: string;
    alt: string;
    priority: boolean;
  }) => {
    const [imageSrc, setImageSrc] = useState(src);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
      setImageSrc(src);
      setFailed(false);
    }, [src]);

    const handleError = useCallback(() => {
      if (failed) return;
      setFailed(true);
      if (imageSrc !== PLACEHOLDER_IMAGE) {
        setImageSrc(PLACEHOLDER_IMAGE);
      }
    }, [failed, imageSrc]);

    return (
      <>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
          onError={handleError}
          data-newprint-featured-image="true"
          className="
            object-cover
            transform-gpu
            transition-transform
            duration-500
            ease-out
            will-change-transform
            md:group-hover:scale-[1.045]
          "
        />

        {failed && imageSrc === PLACEHOLDER_IMAGE && (
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              z-10
              flex
              items-center
              justify-center
              bg-[#F5F4F0]
            "
            aria-hidden="true"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.35"
              className="text-[#B9954F]"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="8.5" cy="9" r="1.5" />
              <path d="M21 15l-4.5-4.5L7 20" />
            </svg>
          </div>
        )}
      </>
    );
  }
);

ProductImage.displayName = "ProductImage";

// ============================================================
// WAIT FOR PRODUCT IMAGES
// ============================================================

async function waitForInitialProductImages(): Promise<void> {
  if (typeof document === "undefined") {
    return;
  }

  const images = Array.from(
    document.querySelectorAll<HTMLImageElement>(
      "img[data-newprint-featured-image='true']"
    )
  );

  if (images.length === 0) {
    return;
  }

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          let finished = false;

          const finish = () => {
            if (finished) return;
            finished = true;
            image.removeEventListener("load", finish);
            image.removeEventListener("error", finish);
            resolve();
          };

          if (image.complete) {
            finish();
            return;
          }

          image.addEventListener("load", finish, { once: true });
          image.addEventListener("error", finish, { once: true });

          window.setTimeout(finish, IMAGE_READY_TIMEOUT);
        })
    )
  );

  await Promise.all(
    images.map(async (image) => {
      if (typeof image.decode !== "function") return;
      try {
        await image.decode();
      } catch {
        // Never block homepage readiness.
      }
    })
  );
}

// ============================================================
// HOMEPAGE READY EVENT
// ============================================================

function dispatchProductsReady() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("newprint:products-ready"));
}

// ============================================================
// PRODUCT CARD
// ============================================================

const ProductCard = memo(
  ({ product, index }: { product: Product; index: number }) => {
    const image = getProductImage(product);
    const productHref = `/products/${product.slug || product._id}`;
    const isPriority = index < 2;
    const isVariantProduct = product.pricingType === "variants";
    const variantPrices = isVariantProduct ? getVariantDisplayPrices(product) : null;

    const sellingPrice =
      !isVariantProduct && typeof product.price === "number" ? product.price : null;

    const originalPrice =
      !isVariantProduct && typeof product.originalPrice === "number"
        ? product.originalPrice
        : null;

    const discountPercentage = getDiscountPercentage(originalPrice, sellingPrice);
    const hasFixedDiscount = discountPercentage > 0;

    const variantDiscount = variantPrices?.discountedVariant
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
          transform-gpu
          transition-[transform,border-color,box-shadow]
          duration-300
          ease-out
          will-change-[transform,border-color,box-shadow]
          md:hover:-translate-y-1
          md:hover:border-[#B9954F]/60
          md:hover:shadow-[0_14px_32px_-16px_rgba(10,27,46,0.25)]
        "
      >
        <Link
          href={productHref}
          prefetch={true}
          aria-label={`View ${product.name}`}
          className="
            absolute
            inset-0
            z-20
            rounded-[12px]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#B9954F]
            focus-visible:ring-inset
          "
        />

        {/* ==================================================
            IMAGE
        =================================================== */}

        <div className="relative aspect-square w-full overflow-hidden bg-[#F5F4F0]">
          <ProductImage src={image} alt={product.name} priority={isPriority} />

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              z-10
              bg-gradient-to-t
              from-black/15
              via-transparent
              to-transparent
            "
            aria-hidden="true"
          />

          {/* CATEGORY */}
          {product.category?.name && (
            <div className="absolute left-2.5 top-2.5 z-10 max-w-[62%] sm:left-3 sm:top-3">
              <span
                className="
                  block
                  truncate
                  rounded-[5px]
                  bg-[#0A1B2E]/95
                  px-2
                  py-1
                  text-[8px]
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-white
                  shadow-sm
                  sm:px-2.5
                  sm:text-[9px]
                "
              >
                {product.category.name}
              </span>
            </div>
          )}

          {/* DISCOUNT */}
          {(hasFixedDiscount || variantDiscount > 0) && (
            <div className="absolute bottom-2.5 left-2.5 z-10 sm:bottom-3 sm:left-3">
              <span
                className="
                  inline-flex
                  items-center
                  rounded-[5px]
                  bg-[#D92D20]
                  px-2
                  py-1.5
                  text-[9px]
                  font-extrabold
                  leading-none
                  text-white
                  shadow-sm
                  sm:px-2.5
                  sm:text-[10px]
                "
              >
                {variantDiscount > 0 && !hasFixedDiscount
                  ? `↓${variantDiscount}%`
                  : `↓${discountPercentage}%`}
              </span>
            </div>
          )}

          {/* INACTIVE OVERLAY */}
          {product.status !== "active" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0A1B2E]/30 backdrop-blur-[2px]">
              <span className="rounded-[6px] bg-white px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#64748B] shadow-sm">
                Unavailable
              </span>
            </div>
          )}
        </div>

        {/* ==================================================
            CONTENT
        =================================================== */}

        <div className="p-3.5 sm:p-5">
          <p className="truncate text-[8px] font-extrabold uppercase tracking-[0.16em] text-[#B9954F] sm:text-[9px]">
            {product.category?.name || "Products"}
          </p>

          {/* PRODUCT NAME */}
          <h3
            className="
              mt-1.5
              line-clamp-2
              min-h-[36px]
              text-[13px]
              font-bold
              leading-5
              tracking-[-0.01em]
              text-[#0A1B2E]
              transition-colors
              duration-200
              group-hover:text-[#B9954F]
              sm:min-h-[40px]
              sm:text-[15px]
            "
          >
            {product.name}
          </h3>

          {/* PRICE ROW */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#E5E7EB] pt-3 sm:mt-4 sm:pt-3.5">
            <div className="min-w-0">
              {/* FIXED PRICE */}
              {!isVariantProduct && sellingPrice !== null ? (
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-1">
                  {originalPrice !== null && hasFixedDiscount && (
                    <span className="text-[10px] font-semibold text-[#94A3B8] line-through sm:text-xs">
                      {formatProductPrice(originalPrice)}
                    </span>
                  )}
                  <span className="text-[14px] font-extrabold tracking-[-0.02em] text-[#0A1B2E] sm:text-base">
                    {formatProductPrice(sellingPrice)}
                  </span>
                </div>
              ) : variantPrices ? (
                /* VARIANT PRICE */
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-1">
                  <span className="text-[14px] font-extrabold tracking-[-0.02em] text-[#0A1B2E] sm:text-base">
                    {variantPrices.hasPriceRange
                      ? `From ${formatProductPrice(variantPrices.minSellingPrice)}`
                      : formatProductPrice(variantPrices.minSellingPrice)}
                  </span>
                </div>
              ) : (
                /* FALLBACK */
                <span className="text-[10px] font-semibold text-[#64748B] sm:text-xs">
                  Select options
                </span>
              )}
            </div>

            <span
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#F7F7F5]
                text-[#0A1B2E]
                transition-colors
                duration-300
                md:group-hover:bg-[#0A1B2E]
                md:group-hover:text-white
                sm:h-8
                sm:w-8
              "
            >
              <ArrowUpRightIcon />
            </span>
          </div>
        </div>
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
  // READY
  // ==========================================================

  const notifyHomepageReady = useCallback(() => {
    if (readyDispatchedRef.current) return;
    readyDispatchedRef.current = true;
    dispatchProductsReady();
  }, []);

  // ==========================================================
  // FETCH FEATURED PRODUCTS
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await get<ProductsResponse>(
          `/api/products?status=active&featured=true&limit=${FEATURED_LIMIT}`
        );

        if (!mounted) return;

        const rawProducts = response?.products || response?.data || [];

        if (!Array.isArray(rawProducts)) {
          setProducts([]);
          return;
        }

        const featuredProducts = rawProducts
          .filter(
            (product) =>
              product && product.status === "active" && product.featured === true
          )
          .slice(0, FEATURED_LIMIT);

        setProducts(featuredProducts);
      } catch (err) {
        console.error("Failed to fetch featured products:", err);
        if (mounted) {
          setError(true);
          setProducts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchFeaturedProducts();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================
  // WAIT FOR INITIAL IMAGES
  // ==========================================================

  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    const finishReadiness = async () => {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });

      if (cancelled) return;

      await waitForInitialProductImages();

      if (cancelled) return;

      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });

      if (cancelled) return;
      notifyHomepageReady();
    };

    finishReadiness();

    return () => {
      cancelled = true;
    };
  }, [loading, products.length, notifyHomepageReady]);

  // ==========================================================
  // EMPTY / ERROR READY
  // ==========================================================

  useEffect(() => {
    if (loading) return;

    if (products.length === 0 || error) {
      const timer = window.setTimeout(() => {
        notifyHomepageReady();
      }, 80);

      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [loading, products.length, error, notifyHomepageReady]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section
      className="relative w-full overflow-hidden py-10 sm:py-14 lg:py-16"
      style={{
        backgroundImage: 'url("/image_f4dd83.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#F7F7F5",
      }}
      aria-labelledby="featured-products-heading"
    >
      {/* =====================================================
          CONTAINER
      ====================================================== */}
      <div
        className="
          relative
          mx-auto
          w-full
          max-w-7xl
          px-4
          sm:px-6
          lg:px-8
        "
      >
        {/* ===================================================
            HEADER
        ==================================================== */}
        <div
          className="
            mb-6
            flex
            flex-col
            gap-5
            sm:mb-8
            lg:mb-10
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >
          <div className="max-w-2xl">
            {/* SMALL GOLD LABEL */}
            <div className="mb-2.5 flex items-center gap-2 sm:mb-3">
              <span className="h-[2px] w-6 shrink-0 bg-[#B9954F] sm:w-7" />
              <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#B9954F] sm:text-[10px]">
                Featured Collection
              </span>
            </div>

            {/* TITLE */}
            <h2
              id="featured-products-heading"
              className="
                max-w-2xl
                text-[28px]
                font-extrabold
                leading-[1.08]
                tracking-[-0.035em]
                text-[#0A1B2E]
                sm:text-4xl
                lg:text-[42px]
              "
            >
              Our most popular{" "}
              <br className="hidden sm:block lg:hidden" />
              <span className="text-[#B9954F]">products.</span>
            </h2>

            {/* DESCRIPTION */}
            <p
              className="
                mt-3
                max-w-xl
                text-[13px]
                leading-6
                text-[#64748B]
                sm:mt-4
                sm:text-sm
                sm:leading-7
                lg:text-base
              "
            >
              Discover custom products made for teams, businesses, events, and everyday moments.
            </p>
          </div>

          {/* ==================================================
              VIEW ALL BUTTON
          ================================================== */}
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
        ==================================================== */}
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
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        )}

        {/* ===================================================
            ERROR
        ==================================================== */}
        {!loading && error && <ErrorState />}

        {/* ===================================================
            EMPTY
        ==================================================== */}
        {!loading && !error && products.length === 0 && <EmptyState />}

        {/* ===================================================
            PRODUCTS
        ==================================================== */}
        {!loading && !error && products.length > 0 && (
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
            {products.map((product, index) => (
              <ProductCard key={product._id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}