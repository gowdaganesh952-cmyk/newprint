"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi, ApiError } from "@/app/lib/api";
import { Product, Category } from "./types";
import ProductDeleteDialog from "./ProductDeleteDialog";

export default function ProductsView() {
  const api = useApi();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // FILTER STATES
  // ============================================================

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // ============================================================
  // DELETE STATES
  // ============================================================

  const [deletingProduct, setDeletingProduct] =
    useState<Product | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================================
  // FEATURED TOGGLE STATE
  //
  // Stores the product ID currently being updated.
  // This prevents multiple products from appearing/loading
  // unnecessarily when one toggle is clicked.
  // ============================================================

  const [updatingFeaturedId, setUpdatingFeaturedId] =
    useState<string | null>(null);

  // ============================================================
  // LOAD DATA
  // ============================================================

  const loadData = async () => {
    try {
      setLoading(true);

      const [catsRes, prodsRes] = await Promise.all([
        api.get<{
          success: boolean;
          categories: Category[];
        }>("/api/categories"),

        api.get<{
          success: boolean;
          products: Product[];
        }>("/api/products"),
      ]);

      if (catsRes.success) {
        setCategories(catsRes.categories);
      }

      if (prodsRes.success) {
        setProducts(prodsRes.products);
      }
    } catch (err) {
      console.error(
        "Failed to load products view data:",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================================================
  // FEATURED TOGGLE
  //
  // Updates only the selected product.
  //
  // Backend already supports:
  // PUT /api/products/:id
  //
  // and accepts:
  // featured: true / false
  // ============================================================

  const handleFeaturedToggle = async (
    product: Product
  ) => {
    if (updatingFeaturedId === product._id) {
      return;
    }

    const previousFeatured = product.featured;
    const nextFeatured = !previousFeatured;

    // ----------------------------------------------------------
    // Optimistic UI update
    // ----------------------------------------------------------

    setProducts((previousProducts) =>
      previousProducts.map((item) =>
        item._id === product._id
          ? {
              ...item,
              featured: nextFeatured,
            }
          : item
      )
    );

    setUpdatingFeaturedId(product._id);

    try {
      const formData = new FormData();

      formData.append(
        "featured",
        nextFeatured ? "true" : "false"
      );

      const response = await api.put<{
        success: boolean;
        product: Product;
        message?: string;
      }>(
        `/api/products/${product._id}`,
        formData
      );

      // --------------------------------------------------------
      // Use backend's saved value if returned.
      // --------------------------------------------------------

      if (
        response?.success &&
        response.product
      ) {
        setProducts((previousProducts) =>
          previousProducts.map((item) =>
            item._id === product._id
              ? {
                  ...item,
                  featured:
                    response.product.featured,
                }
              : item
          )
        );
      }
    } catch (err: any) {
      console.error(
        "Failed to update featured status:",
        err
      );

      // --------------------------------------------------------
      // Revert optimistic update on failure.
      // --------------------------------------------------------

      setProducts((previousProducts) =>
        previousProducts.map((item) =>
          item._id === product._id
            ? {
                ...item,
                featured: previousFeatured,
              }
            : item
        )
      );

      alert(
        err instanceof ApiError
          ? err.message
          : "Failed to update featured status."
      );
    } finally {
      setUpdatingFeaturedId(null);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;

    try {
      setIsDeleting(true);

      await api.delete(
        `/api/products/${deletingProduct._id}`
      );

      setProducts((previousProducts) =>
        previousProducts.filter(
          (product) =>
            product._id !== deletingProduct._id
        )
      );

      setDeletingProduct(null);
    } catch (err: any) {
      alert(
        err instanceof ApiError
          ? err.message
          : "Failed to delete product"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================
  // CATEGORY NAME
  // ============================================================

  const getCategoryName = (idOrObj: any) => {
    if (!idOrObj) {
      return "Unknown Category";
    }

    const id =
      typeof idOrObj === "object"
        ? idOrObj?._id
        : idOrObj;

    const cat = categories.find(
      (category) => category._id === id
    );

    if (cat) {
      return cat.name;
    }

    return typeof idOrObj === "object"
      ? idOrObj?.name || "Unknown Category"
      : "Unknown Category";
  };

  // ============================================================
  // FILTER PRODUCTS
  // ============================================================

  const filteredProducts = products.filter(
    (product) => {
      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(
            searchQuery.toLowerCase()
          );

      const productCategoryId =
        typeof product.category === "object"
          ? (product.category as any)?._id
          : product.category;

      const matchesCategory =
        categoryFilter === "all"
          ? true
          : productCategoryId ===
            categoryFilter;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : product.status ===
            statusFilter;

      const matchesFeatured =
        featuredFilter === "all"
          ? true
          : featuredFilter ===
            "featured"
          ? product.featured
          : !product.featured;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesFeatured
      );
    }
  );

  // ============================================================
  // SORT
  // ============================================================

  filteredProducts.sort(
    (a, b) => {
      if (sortBy === "price_asc") {
        return (
          (a.price || 0) -
          (b.price || 0)
        );
      }

      if (sortBy === "price_desc") {
        return (
          (b.price || 0) -
          (a.price || 0)
        );
      }

      if (sortBy === "name_asc") {
        return a.name.localeCompare(
          b.name
        );
      }

      // Backend returns newest first.
      return 0;
    }
  );

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#B9954F]" />
      </div>
    );
  }

  // ============================================================
  // FEATURED TOGGLE COMPONENT
  // ============================================================

  const FeaturedToggle = ({
    product,
  }: {
    product: Product;
  }) => {
    const isUpdating =
      updatingFeaturedId ===
      product._id;

    const isFeatured =
      Boolean(product.featured);

    return (
      <button
        type="button"
        role="switch"
        aria-checked={isFeatured}
        aria-label={
          isFeatured
            ? `Remove ${product.name} from featured products`
            : `Add ${product.name} to featured products`
        }
        disabled={isUpdating}
        onClick={() =>
          handleFeaturedToggle(product)
        }
        className={`group relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#B9954F]/30 focus:ring-offset-1 ${
          isFeatured
            ? "border-[#B9954F] bg-[#B9954F]"
            : "border-[#CBD5E1] bg-[#E2E8F0]"
        } ${
          isUpdating
            ? "cursor-wait opacity-70"
            : "cursor-pointer"
        }`}
      >
        <span
          className={`pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
            isFeatured
              ? "translate-x-[21px]"
              : "translate-x-[2px]"
          }`}
        >
          {isUpdating && (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#E5E7EB] border-t-[#B9954F]" />
          )}
        </span>
      </button>
    );
  };

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="space-y-6">
      {/* ======================================================
          FILTER BAR
      ======================================================= */}

      <div className="flex flex-col gap-4 rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:flex-1 xl:flex-nowrap">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
            className="w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm placeholder-[#64748B] focus:border-[#B9954F] focus:outline-none sm:w-64"
          />

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(
                e.target.value
              )
            }
            className="w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm sm:w-auto"
          >
            <option value="all">
              All Categories
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category._id}
                  value={category._id}
                >
                  {category.name}
                </option>
              )
            )}
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm sm:w-auto"
          >
            <option value="all">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>

          <select
            value={featuredFilter}
            onChange={(e) =>
              setFeaturedFilter(
                e.target.value
              )
            }
            className="w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm sm:w-auto"
          >
            <option value="all">
              All Visibility
            </option>

            <option value="featured">
              Featured
            </option>

            <option value="not_featured">
              Not Featured
            </option>
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value)
            }
            className="w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm sm:w-auto"
          >
            <option value="newest">
              Newest
            </option>

            <option value="price_asc">
              Price: Low to High
            </option>

            <option value="price_desc">
              Price: High to Low
            </option>

            <option value="name_asc">
              Name: A-Z
            </option>
          </select>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex w-full items-center justify-center rounded-[9px] bg-[#0A1B2E] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#142C46] xl:w-auto"
        >
          Add Product
        </Link>
      </div>

      {/* ======================================================
          EMPTY PRODUCTS
      ======================================================= */}

      {products.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#E5E7EB] bg-white p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F7F5]">
            <svg
              className="h-6 w-6 text-[#64748B]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>

          <h3 className="mt-4 text-sm font-semibold text-[#0A1B2E]">
            No products yet
          </h3>

          <p className="mt-1 text-sm text-[#64748B]">
            Add your first product to
            start building the New Print
            catalog.
          </p>

          <Link
            href="/admin/products/new"
            className="mt-6 inline-flex items-center rounded-[9px] bg-[#0A1B2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#142C46]"
          >
            Add Product
          </Link>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#E5E7EB] bg-white p-8 text-center">
          <h3 className="text-sm font-semibold text-[#0A1B2E]">
            No matching products
          </h3>

          <p className="mt-1 text-sm text-[#64748B]">
            Try changing your search or
            filters.
          </p>
        </div>
      ) : (
        <>
          {/* ==================================================
              MOBILE CARDS
          =================================================== */}

          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredProducts.map(
              (product) => (
                <div
                  key={product._id}
                  className="flex flex-col overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm"
                >
                  <div className="flex gap-4 p-4">
                    {/* IMAGE */}

                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[6px] bg-gray-100">
                      {product.images &&
                      product.images.length >
                        0 ? (
                        <img
                          src={
                            product.images[0]
                          }
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          No Img
                        </div>
                      )}
                    </div>

                    {/* PRODUCT INFO */}

                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="truncate font-semibold text-[#0A1B2E]">
                        {product.name}
                      </h3>

                      <p className="truncate text-xs text-[#64748B]">
                        {getCategoryName(
                          product.category
                        )}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="font-medium text-[#B9954F]">
                          {product.pricingType ===
                          "variants"
                            ? "From variants"
                            : product.price !==
                              undefined
                            ? `₹${product.price}`
                            : "N/A"}
                        </span>

                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            product.status ===
                            "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {product.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* FEATURED MOBILE */}

                  <div className="flex items-center justify-between border-t border-[#E5E7EB] px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold text-[#0A1B2E]">
                        Featured Product
                      </p>

                      <p className="mt-0.5 text-[11px] text-[#94A3B8]">
                        Show in featured section
                      </p>
                    </div>

                    <FeaturedToggle
                      product={product}
                    />
                  </div>

                  {/* ACTIONS */}

                  <div className="flex border-t border-[#E5E7EB] bg-[#F7F7F5]">
                    <Link
                      href={`/admin/products/${product._id}/edit`}
                      className="flex-1 py-2 text-center text-sm font-semibold text-[#0A1B2E] hover:bg-gray-200"
                    >
                      Edit
                    </Link>

                    <div className="w-[1px] bg-[#E5E7EB]" />

                    <button
                      type="button"
                      onClick={() =>
                        setDeletingProduct(
                          product
                        )
                      }
                      className="flex-1 py-2 text-center text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          {/* ==================================================
              DESKTOP TABLE
          =================================================== */}

          <div className="hidden overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB]">
                <thead className="bg-[#F7F7F5]">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                    >
                      Image
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                    >
                      Product
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                    >
                      Category
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                    >
                      Price
                    </th>

                    {/* NEW FEATURED COLUMN */}

                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                    >
                      Featured
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                    >
                      Status
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#64748B]"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E5E7EB] bg-white">
                  {filteredProducts.map(
                    (product) => (
                      <tr
                        key={product._id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        {/* IMAGE */}

                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-12 w-12 overflow-hidden rounded-[6px] bg-gray-100">
                            {product.images &&
                            product.images.length >
                              0 ? (
                              <img
                                src={
                                  product.images[0]
                                }
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full items-center justify-center text-[10px] text-gray-400">
                                No Img
                              </span>
                            )}
                          </div>
                        </td>

                        {/* PRODUCT */}

                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-[#0A1B2E]">
                            {product.name}
                          </div>

                          {product.featured && (
                            <span className="mt-1 inline-flex rounded-full bg-[#B9954F]/10 px-2 py-0.5 text-[10px] font-medium text-[#B9954F]">
                              Featured
                            </span>
                          )}
                        </td>

                        {/* CATEGORY */}

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-[#64748B]">
                          {getCategoryName(
                            product.category
                          )}
                        </td>

                        {/* PRICE */}

                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-[#0A1B2E]">
                          {product.pricingType ===
                          "variants"
                            ? "Variants"
                            : product.price !==
                              undefined
                            ? `₹${product.price}`
                            : "-"}
                        </td>

                        {/* FEATURED TOGGLE */}

                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex justify-center">
                            <FeaturedToggle
                              product={product}
                            />
                          </div>
                        </td>

                        {/* STATUS */}

                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              product.status ===
                              "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {product.status}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <Link
                            href={`/admin/products/${product._id}/edit`}
                            className="mr-4 text-[#0A1B2E] hover:text-[#B9954F]"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              setDeletingProduct(
                                product
                              )
                            }
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ======================================================
          DELETE DIALOG
      ======================================================= */}

      {deletingProduct && (
        <ProductDeleteDialog
          product={deletingProduct}
          loading={isDeleting}
          onConfirm={
            handleDeleteConfirm
          }
          onCancel={() =>
            setDeletingProduct(null)
          }
        />
      )}
    </div>
  );
}