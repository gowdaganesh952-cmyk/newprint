"use client";

import { memo, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useApi } from "../lib/api";

/* ============================================================
   TYPES
============================================================ */

interface ProductCategory {
  _id?: string;
  name: string;
  slug?: string;
  status?: string;
}

interface Product {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  images?: string[];
  category?: ProductCategory | null;
  featured?: boolean;
  status?: "active" | "inactive" | string;
}

interface ProductsResponse {
  success?: boolean;
  products?: Product[];
  data?: Product[];
}

/* ============================================================
   ICON
============================================================ */

const ArrowUpRightIcon = memo(
  ({ className = "" }: { className?: string }) => (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
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

/* ============================================================
   SKELETON
============================================================ */

const ProductSkeleton = memo(() => {
  return (
    <div
      className="
        overflow-hidden
        rounded-[18px]
        border
        border-[#E5E7EB]
        bg-white
      "
      aria-hidden="true"
    >
      <div className="aspect-square animate-pulse bg-[#E5E7EB]" />

      <div className="space-y-3 p-4 sm:p-5">
        <div className="h-3 w-20 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="h-3 w-2/5 animate-pulse rounded bg-[#E5E7EB]" />

        <div className="mt-5 flex items-center justify-between border-t border-[#E5E7EB] pt-4">
          <div className="h-5 w-16 animate-pulse rounded bg-[#E5E7EB]" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-[#E5E7EB]" />
        </div>
      </div>
    </div>
  );
});

ProductSkeleton.displayName = "ProductSkeleton";

/* ============================================================
   EMPTY STATE
============================================================ */

const EmptyState = memo(() => {
  return (
    <div className="mx-auto max-w-xl rounded-[18px] border border-[#E5E7EB] bg-white px-6 py-12 text-center sm:px-10">
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

      <h3 className="mt-5 text-lg font-extrabold text-[#0A1B2E] sm:text-xl">
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

/* ============================================================
   ERROR STATE
============================================================ */

const ErrorState = memo(() => {
  return (
    <div className="mx-auto max-w-xl rounded-[18px] border border-[#E5E7EB] bg-white px-6 py-10 text-center sm:px-10">
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

      <p className="mt-2 text-sm leading-6 text-[#64748B]">
        Please try again later.
      </p>
    </div>
  );
});

ErrorState.displayName = "ErrorState";

/* ============================================================
   PRODUCT CARD
============================================================ */

const ProductCard = memo(
  ({
    product,
    index,
  }: {
    product: Product;
    index: number;
  }) => {
    const rawImage = product.images?.[0];

    const image =
      typeof rawImage === "string" &&
      rawImage.trim().length > 0 &&
      (rawImage.startsWith("https://") ||
        rawImage.startsWith("http://") ||
        rawImage.startsWith("/"))
        ? rawImage
        : "/images/product-placeholder.jpg";

    const productHref = `/products/${product.slug || product._id}`;

    const isPriority = index < 2;

    const price =
      typeof product.price === "number"
        ? `₹${product.price.toLocaleString("en-IN")}`
        : "Custom pricing";

    const originalPrice =
      typeof product.originalPrice === "number" &&
      typeof product.price === "number" &&
      product.originalPrice > product.price
        ? `₹${product.originalPrice.toLocaleString("en-IN")}`
        : null;

    return (
      <article
        className="
          group
          relative
          min-w-0
          overflow-hidden
          rounded-[18px]
          border
          border-[#E4E7EB]
          bg-white
          shadow-[0_3px_18px_-14px_rgba(10,27,46,0.45)]
          transition-[border-color,box-shadow]
          duration-200
          ease-out
          md:hover:border-[#B9954F]/70
          md:hover:shadow-[0_14px_35px_-20px_rgba(10,27,46,0.4)]
        "
      >
        <Link
          href={productHref}
          aria-label={`View ${product.name}`}
          className="
            absolute
            inset-0
            z-20
            rounded-[18px]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#B9954F]
            focus-visible:ring-inset
          "
        />

        {/* IMAGE */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#F3F3F0]">
          <Image
            src={image}
            alt={product.name}
            fill
            priority={isPriority}
            loading={isPriority ? undefined : "lazy"}
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
            className="
              object-cover
              transition-transform
              duration-500
              ease-out
              md:group-hover:scale-[1.035]
            "
          />

          {/* Light image overlay */}
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-t
              from-black/20
              via-transparent
              to-transparent
            "
          />

          {/* CATEGORY — ONLY ONE CATEGORY LABEL */}
          {product.category?.name && (
            <span
              className="
                absolute
                left-3
                top-3
                z-10
                max-w-[68%]
                truncate
                rounded-[7px]
                border
                border-white/10
                bg-[#0A1B2E]/95
                px-2.5
                py-1.5
                text-[8px]
                font-extrabold
                uppercase
                tracking-[0.11em]
                text-white
                shadow-sm
                sm:left-3.5
                sm:top-3.5
                sm:text-[9px]
              "
            >
              {product.category.name}
            </span>
          )}

          {/* FEATURED BADGE */}
          {product.featured && (
            <span
              className="
                absolute
                right-3
                top-3
                z-10
                rounded-[7px]
                bg-[#B9954F]
                px-2.5
                py-1.5
                text-[8px]
                font-extrabold
                uppercase
                tracking-[0.1em]
                text-white
                shadow-sm
                sm:right-3.5
                sm:top-3.5
                sm:text-[9px]
              "
            >
              Featured
            </span>
          )}

          {/* DISCOUNT */}
          {originalPrice && typeof product.price === "number" && (
            <span
              className="
                absolute
                bottom-3
                left-3
                z-10
                rounded-[6px]
                bg-[#D92D20]
                px-2
                py-1
                text-[9px]
                font-extrabold
                text-white
                sm:bottom-3.5
                sm:left-3.5
              "
            >
              Save{" "}
              {Math.round(
                ((product.originalPrice! - product.price) /
                  product.originalPrice!) *
                  100
              )}
              %
            </span>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-5">
          {/* Product name only — category is not repeated here */}
          <h3
            className="
              min-h-[38px]
              text-[13px]
              font-extrabold
              leading-5
              tracking-[-0.015em]
              text-[#0A1B2E]
              transition-colors
              duration-200
              md:group-hover:text-[#B9954F]
              sm:min-h-[44px]
              sm:text-base
              sm:leading-6
            "
          >
            {product.name}
          </h3>

          <p
            className="
              mt-1.5
              line-clamp-1
              min-h-[16px]
              text-[10px]
              leading-4
              text-[#64748B]
              sm:text-xs
              sm:leading-5
            "
          >
            {product.description?.trim() ||
              "Custom printing available"}
          </p>

          {/* PRICE */}
          <div
            className="
              mt-4
              flex
              items-center
              justify-between
              gap-3
              border-t
              border-[#E5E7EB]
              pt-4
            "
          >
            <div className="flex min-w-0 items-center gap-2">
              {originalPrice && (
                <span className="truncate text-[10px] font-semibold text-[#94A3B8] line-through sm:text-xs">
                  {originalPrice}
                </span>
              )}

              <span
                className="
                  truncate
                  text-base
                  font-extrabold
                  tracking-[-0.02em]
                  text-[#0A1B2E]
                  sm:text-lg
                "
              >
                {price}
              </span>
            </div>

            <span
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#F6F6F3]
                text-[#0A1B2E]
                transition-colors
                duration-200
                md:group-hover:bg-[#0A1B2E]
                md:group-hover:text-white
                sm:h-10
                sm:w-10
              "
              aria-hidden="true"
            >
              <ArrowUpRightIcon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </span>
          </div>
        </div>
      </article>
    );
  }
);

ProductCard.displayName = "ProductCard";

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function FeaturedProducts() {
  const { get } = useApi();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await get<ProductsResponse>(
          "/api/products?status=active&featured=true&limit=6"
        );

        if (!mounted) return;

        const rawProducts =
          response?.products || response?.data || [];

        if (!Array.isArray(rawProducts)) {
          setProducts([]);
          return;
        }

        const featuredProducts = rawProducts
          .filter(
            (product) =>
              product.status === "active" &&
              product.featured === true
          )
          .slice(0, 6);

        setProducts(featuredProducts);
      } catch (fetchError) {
        console.error(
          "Failed to fetch featured products:",
          fetchError
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

    void fetchFeaturedProducts();

    return () => {
      mounted = false;
    };

    // This section intentionally loads only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-[#F7F7F5]
        py-14
        sm:py-18
        lg:py-22
      "
      aria-labelledby="featured-products-heading"
    >
      <div
        className="
          pointer-events-none
          absolute
          -right-32
          top-16
          h-72
          w-72
          rounded-full
          bg-[#B9954F]/[0.045]
          sm:-right-20
          sm:h-96
          sm:w-96
        "
        aria-hidden="true"
      />

      <div
        className="
          pointer-events-none
          absolute
          -left-36
          bottom-0
          h-72
          w-72
          rounded-full
          bg-[#0A1B2E]/[0.025]
          sm:h-96
          sm:w-96
        "
        aria-hidden="true"
      />

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
        {/* HEADER */}
        <div
          className="
            mb-8
            flex
            flex-col
            gap-5
            sm:mb-10
            lg:mb-12
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-[2px] w-7 bg-[#B9954F]" />

              <span
                className="
                  text-[9px]
                  font-extrabold
                  uppercase
                  tracking-[0.2em]
                  text-[#B9954F]
                  sm:text-[10px]
                  lg:text-xs
                "
              >
                Featured Collection
              </span>
            </div>

            <h2
              id="featured-products-heading"
              className="
                max-w-2xl
                text-[30px]
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
              rounded-[9px]
              border
              border-[#D8DDE3]
              bg-white
              px-4
              text-xs
              font-bold
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
            <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* LOADING */}
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

        {/* ERROR */}
        {!loading && error && <ErrorState />}

        {/* EMPTY */}
        {!loading && !error && products.length === 0 && (
          <EmptyState />
        )}

        {/* PRODUCTS */}
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
              <ProductCard
                key={product._id}
                product={product}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}