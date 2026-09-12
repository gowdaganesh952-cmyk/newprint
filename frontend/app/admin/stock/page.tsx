"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useApi } from "@/app/lib/api";
import type {
  Product,
  ProductVariant,
} from "@/app/admin/products/types";

/* ============================================================
   TYPES
============================================================ */

type StockFilter =
  | "all"
  | "in-stock"
  | "low-stock"
  | "out-of-stock";

type CategoryValue =
  | string
  | {
      _id?: string;
      name?: string;
      slug?: string;
      status?: string;
    }
  | null
  | undefined;

type StockProduct = Omit<Product, "category"> & {
  category: CategoryValue;
  variants?: ProductVariant[];
};

type ProductResponse = {
  success?: boolean;
  products?: StockProduct[];
  message?: string;
};

type ProductStockResponse = {
  success?: boolean;
  message?: string;
  product?: {
    _id: string;
    stock: number;
    lowStockThreshold: number;
  };
};

type VariantStockResponse = {
  success?: boolean;
  message?: string;
  variant?: {
    _id: string;
    stock: number;
    lowStockThreshold: number;
  };
};

type StockUpdateState = {
  saving: boolean;
  error: string;
  success: boolean;
};

type ProductDraft = {
  stock: number;
  lowStockThreshold: number;
};

type VariantDraft = {
  stock: number;
  lowStockThreshold: number;
};

type VariantDraftMap = Record<string, VariantDraft>;

type ProductDraftMap = Record<string, ProductDraft>;

type UpdateStateMap = Record<string, StockUpdateState>;

const DEFAULT_THRESHOLD = 5;

/* ============================================================
   HELPERS
============================================================ */

function safeNumber(
  value: unknown,
  fallback = 0
): number {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.max(0, Math.floor(numberValue));
}

function getCategoryName(
  category: CategoryValue
): string {
  if (!category) {
    return "Uncategorized";
  }

  if (typeof category === "string") {
    return category;
  }

  return (
    category.name ||
    category.slug ||
    "Uncategorized"
  );
}

function getCategorySearchValue(
  category: CategoryValue
): string {
  if (!category) {
    return "";
  }

  if (typeof category === "string") {
    return category.toLowerCase();
  }

  return [
    category.name,
    category.slug,
    category._id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getProductVariants(
  product: StockProduct
): ProductVariant[] {
  if (
    product.pricingType !== "variants" ||
    !Array.isArray(product.variants)
  ) {
    return [];
  }

  return product.variants;
}

function hasVariants(
  product: StockProduct
): boolean {
  return getProductVariants(product).length > 0;
}

function getProductStock(
  product: StockProduct
): number {
  const variants = getProductVariants(product);

  if (variants.length > 0) {
    return variants.reduce(
      (total, variant) =>
        total + safeNumber(variant.stock),
      0
    );
  }

  return safeNumber(product.stock);
}

function getProductThreshold(
  product: StockProduct
): number {
  const variants = getProductVariants(product);

  if (variants.length > 0) {
    const thresholds = variants.map((variant) =>
      safeNumber(
        variant.lowStockThreshold,
        DEFAULT_THRESHOLD
      )
    );

    return Math.max(
      DEFAULT_THRESHOLD,
      ...thresholds
    );
  }

  return safeNumber(
    product.lowStockThreshold,
    DEFAULT_THRESHOLD
  );
}

function getStockStatus(
  product: StockProduct
): "in-stock" | "low-stock" | "out-of-stock" {
  const stock = getProductStock(product);
  const threshold = getProductThreshold(product);

  if (stock <= 0) {
    return "out-of-stock";
  }

  if (stock <= threshold) {
    return "low-stock";
  }

  return "in-stock";
}

function getStockLabel(
  status: ReturnType<typeof getStockStatus>
): string {
  if (status === "out-of-stock") {
    return "Out of stock";
  }

  if (status === "low-stock") {
    return "Low stock";
  }

  return "In stock";
}

function getVariantLabel(
  variant: ProductVariant
): string {
  const selections = Object.entries(
    variant.selections || {}
  );

  if (selections.length === 0) {
    return variant.sku || "Default variant";
  }

  return selections
    .map(([key, value]) => {
      let displayValue = value;

      if (
        typeof value === "object" &&
        value !== null
      ) {
        const objectValue = value as {
          name?: string;
          value?: string;
          label?: string;
        };

        displayValue =
          objectValue.name ||
          objectValue.value ||
          objectValue.label ||
          JSON.stringify(value);
      }

      return `${key}: ${String(displayValue)}`;
    })
    .join(" • ");
}

function getVariantShortLabel(
  variant: ProductVariant
): string {
  const selections = Object.entries(
    variant.selections || {}
  );

  if (selections.length === 0) {
    return variant.sku || "Default";
  }

  return selections
    .map(([, value]) => {
      if (
        typeof value === "object" &&
        value !== null
      ) {
        const objectValue = value as {
          name?: string;
          value?: string;
          label?: string;
        };

        return (
          objectValue.name ||
          objectValue.value ||
          objectValue.label ||
          JSON.stringify(value)
        );
      }

      return String(value);
    })
    .join(" / ");
}

function getInitialProductDraft(
  product: StockProduct
): ProductDraft {
  return {
    stock: safeNumber(product.stock),
    lowStockThreshold: safeNumber(
      product.lowStockThreshold,
      DEFAULT_THRESHOLD
    ),
  };
}

function getInitialVariantDraft(
  variant: ProductVariant
): VariantDraft {
  return {
    stock: safeNumber(variant.stock),
    lowStockThreshold: safeNumber(
      variant.lowStockThreshold,
      DEFAULT_THRESHOLD
    ),
  };
}

function getDefaultUpdateState(): StockUpdateState {
  return {
    saving: false,
    error: "",
    success: false,
  };
}

/* ============================================================
   ICONS
============================================================ */

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "box"
    | "check"
    | "alert"
    | "x"
    | "search"
    | "refresh"
    | "chevron"
    | "minus"
    | "plus"
    | "layers"
    | "package";
  className?: string;
}) {
  const common = {
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "box") {
    return (
      <svg
        {...common}
        className={className}
      >
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z" />
        <path d="M12 11v10" />
      </svg>
    );
  }

  if (name === "package") {
    return (
      <svg
        {...common}
        className={className}
      >
        <path d="m16.5 9.4 4-2.2" />
        <path d="M3.5 7.2 12 12l8.5-4.8" />
        <path d="M12 12v9" />
        <path d="M20.5 7.2v9.6L12 21l-8.5-4.2V7.2L12 3l8.5 4.2Z" />
        <path d="M7.5 5.2 16 10" />
      </svg>
    );
  }

  if (name === "layers") {
    return (
      <svg
        {...common}
        className={className}
      >
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 16 9 5 9-5" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg
        {...common}
        className={className}
      >
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (name === "alert") {
    return (
      <svg
        {...common}
        className={className}
      >
        <path d="m10.3 4.2-7.5 13a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg
        {...common}
        className={className}
      >
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg
        {...common}
        className={className}
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );
  }

  if (name === "refresh") {
    return (
      <svg
        {...common}
        className={className}
      >
        <path d="M20 11a8 8 0 0 0-14.8-4L3 10" />
        <path d="M3 4v6h6" />
        <path d="M4 13a8 8 0 0 0 14.8 4L21 14" />
        <path d="M21 20v-6h-6" />
      </svg>
    );
  }

  if (name === "chevron") {
    return (
      <svg
        {...common}
        className={className}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    );
  }

  if (name === "minus") {
    return (
      <svg
        {...common}
        className={className}
      >
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg
        {...common}
        className={className}
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  return (
    <svg
      {...common}
      className={className}
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

/* ============================================================
   IMAGE
============================================================ */

function ProductImage({
  product,
}: {
  product: StockProduct;
}) {
  const image = product.images?.[0];

  if (!image) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-[#F7F7F5] text-[#94A3B8]">
        <Icon
          name="package"
          className="h-7 w-7"
        />
      </div>
    );
  }

  return (
    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F7F7F5]">
      <img
        src={image}
        alt={product.name}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status:
    | "in-stock"
    | "low-stock"
    | "out-of-stock";
}) {
  const styles = {
    "in-stock":
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    "low-stock":
      "border-amber-200 bg-amber-50 text-amber-700",
    "out-of-stock":
      "border-red-200 bg-red-50 text-red-700",
  };

  const dots = {
    "in-stock": "bg-emerald-500",
    "low-stock": "bg-amber-500",
    "out-of-stock": "bg-red-500",
  };

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${styles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dots[status]}`}
      />
      {getStockLabel(status)}
    </span>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
  description,
  icon,
  active,
  onClick,
}: {
  label: string;
  value: number;
  description: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition-all duration-200 sm:p-5 ${
        active
          ? "border-[#B9954F] ring-2 ring-[#B9954F]/15"
          : "border-[#E5E7EB] hover:-translate-y-0.5 hover:border-[#D5D9DF] hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#64748B]">
            {label}
          </p>

          <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#0A1B2E]">
            {value.toLocaleString("en-IN")}
          </p>

          <p className="mt-1 text-[11px] leading-5 text-[#64748B]">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
            active
              ? "bg-[#0A1B2E] text-[#B9954F]"
              : "bg-[#F7F7F5] text-[#0A1B2E] group-hover:bg-[#0A1B2E] group-hover:text-[#B9954F]"
          }`}
        >
          {icon}
        </div>
      </div>
    </button>
  );
}

/* ============================================================
   NUMBER CONTROL
============================================================ */

function NumberControl({
  value,
  onChange,
  label,
  compact = false,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  compact?: boolean;
}) {
  const updateValue = (nextValue: number) => {
    onChange(
      Number.isFinite(nextValue)
        ? Math.max(0, Math.floor(nextValue))
        : 0
    );
  };

  return (
    <div
      className={`flex items-center overflow-hidden rounded-xl border border-[#E5E7EB] bg-white ${
        compact ? "h-9" : "h-10"
      }`}
    >
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() =>
          updateValue(Math.max(0, value - 1))
        }
        className="flex h-full w-9 shrink-0 items-center justify-center text-[#64748B] transition hover:bg-[#F7F7F5] hover:text-[#0A1B2E]"
      >
        <Icon
          name="minus"
          className="h-4 w-4"
        />
      </button>

      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        onChange={(event) =>
          updateValue(
            Number(event.target.value)
          )
        }
        aria-label={label}
        className={`h-full min-w-0 border-x border-[#E5E7EB] bg-white text-center font-extrabold text-[#0A1B2E] outline-none focus:bg-[#FFFCF5] ${
          compact
            ? "w-14 text-xs"
            : "w-16 text-sm"
        }`}
      />

      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() =>
          updateValue(value + 1)
        }
        className="flex h-full w-9 shrink-0 items-center justify-center text-[#64748B] transition hover:bg-[#F7F7F5] hover:text-[#0A1B2E]"
      >
        <Icon
          name="plus"
          className="h-4 w-4"
        />
      </button>
    </div>
  );
}

/* ============================================================
   SAVE BUTTON
============================================================ */

function SaveButton({
  saving,
  success,
  onClick,
  label = "Save",
}: {
  saving: boolean;
  success: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="inline-flex h-10 min-w-[76px] items-center justify-center gap-2 rounded-xl bg-[#0A1B2E] px-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#142C46] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : success ? (
        <>
          <Icon
            name="check"
            className="h-4 w-4"
          />
          Saved
        </>
      ) : (
        label
      )}
    </button>
  );
}

/* ============================================================
   VARIANT ROW
============================================================ */

function VariantRow({
  variant,
  draft,
  updateState,
  onStockChange,
  onThresholdChange,
  onSave,
}: {
  variant: ProductVariant;
  draft: VariantDraft;
  updateState: StockUpdateState;
  onStockChange: (value: number) => void;
  onThresholdChange: (value: number) => void;
  onSave: () => void;
}) {
  const stock = safeNumber(draft.stock);
  const threshold = safeNumber(
    draft.lowStockThreshold,
    DEFAULT_THRESHOLD
  );

  const status =
    stock <= 0
      ? "out-of-stock"
      : stock <= threshold
        ? "low-stock"
        : "in-stock";

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3 sm:p-4">
      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F7F5] text-xs font-extrabold text-[#0A1B2E]">
            {getVariantShortLabel(variant)
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-extrabold text-[#0A1B2E]">
              {getVariantLabel(variant)}
            </p>

            {variant.sku && (
              <p className="mt-1 break-all text-[10px] font-medium text-[#94A3B8]">
                SKU: {variant.sku}
              </p>
            )}

            <div className="mt-2">
              <StatusBadge status={status} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
          <div>
            <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
              Available stock
            </p>

            <NumberControl
              value={stock}
              onChange={onStockChange}
              label={`Stock for ${getVariantLabel(
                variant
              )}`}
            />
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
              Alert when stock reaches
            </p>

            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={threshold}
              onChange={(event) =>
                onThresholdChange(
                  safeNumber(event.target.value)
                )
              }
              aria-label={`Low stock threshold for ${getVariantLabel(
                variant
              )}`}
              className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-extrabold text-[#0A1B2E] outline-none transition focus:border-[#B9954F] focus:ring-2 focus:ring-[#B9954F]/10 sm:w-24"
            />
          </div>

          <div className="flex justify-end sm:justify-start">
            <SaveButton
              saving={updateState.saving}
              success={updateState.success}
              onClick={onSave}
            />
          </div>
        </div>

        {updateState.error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            <Icon
              name="alert"
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>{updateState.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   VARIANT PANEL
============================================================ */

function VariantPanel({
  product,
  variantDrafts,
  updateStates,
  onVariantStockChange,
  onVariantThresholdChange,
  onVariantSave,
}: {
  product: StockProduct;
  variantDrafts: VariantDraftMap;
  updateStates: UpdateStateMap;
  onVariantStockChange: (
    variantId: string,
    value: number
  ) => void;
  onVariantThresholdChange: (
    variantId: string,
    value: number
  ) => void;
  onVariantSave: (
    variant: ProductVariant
  ) => void;
}) {
  const variants = getProductVariants(product);

  return (
    <div className="border-t border-[#E5E7EB] bg-[#FAFAF8]">
      <div className="flex flex-col gap-2 border-b border-[#E5E7EB] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-[#0A1B2E]">
              Variant inventory
            </p>

            <p className="mt-1 text-xs leading-5 text-[#64748B]">
              Update stock separately for each size,
              color or product option.
            </p>
          </div>

          <span className="rounded-full bg-[#B9954F]/10 px-3 py-1 text-[10px] font-extrabold text-[#96783F]">
            {variants.length} variants
          </span>
        </div>
      </div>

      <div className="space-y-3 p-3 sm:p-5">
        {variants.map((variant, index) => {
          const variantId = String(
            variant._id || `variant-${index}`
          );

          const draft =
            variantDrafts[variantId] ||
            getInitialVariantDraft(variant);

          const updateState =
            updateStates[variantId] ||
            getDefaultUpdateState();

          return (
            <VariantRow
              key={variantId}
              variant={variant}
              draft={draft}
              updateState={updateState}
              onStockChange={(value) =>
                onVariantStockChange(
                  variantId,
                  value
                )
              }
              onThresholdChange={(value) =>
                onVariantThresholdChange(
                  variantId,
                  value
                )
              }
              onSave={() =>
                onVariantSave(variant)
              }
            />
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   PRODUCT ROW
============================================================ */

function ProductRow({
  product,
  expanded,
  onToggle,
  draft,
  updateState,
  onStockChange,
  onThresholdChange,
  onSave,
  variantDrafts,
  updateStates,
  onVariantStockChange,
  onVariantThresholdChange,
  onVariantSave,
}: {
  product: StockProduct;
  expanded: boolean;
  onToggle: () => void;
  draft: ProductDraft;
  updateState: StockUpdateState;
  onStockChange: (value: number) => void;
  onThresholdChange: (value: number) => void;
  onSave: () => void;
  variantDrafts: VariantDraftMap;
  updateStates: UpdateStateMap;
  onVariantStockChange: (
    variantId: string,
    value: number
  ) => void;
  onVariantThresholdChange: (
    variantId: string,
    value: number
  ) => void;
  onVariantSave: (
    variant: ProductVariant
  ) => void;
}) {
  const productHasVariants = hasVariants(product);
  const status = getStockStatus(product);
  const totalStock = getProductStock(product);
  const threshold = getProductThreshold(product);
  const categoryName = getCategoryName(
    product.category
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <ProductImage product={product} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words text-sm font-extrabold text-[#0A1B2E] sm:text-[15px]">
                  {product.name}
                </h3>

                {product.featured && (
                  <span className="rounded-full bg-[#B9954F]/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#96783F]">
                    Featured
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#64748B]">
                <span>{categoryName}</span>
                <span className="text-[#CBD5E1]">
                  •
                </span>
                <span>
                  {productHasVariants
                    ? `${
                        product.variants?.length || 0
                      } variants`
                    : "Single product"}
                </span>
              </div>

              {product.slug && (
                <p className="mt-1 truncate text-[10px] text-[#94A3B8]">
                  /{product.slug}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 xl:w-[150px] xl:justify-start">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8] xl:hidden">
              Status
            </span>

            <StatusBadge status={status} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 xl:w-[220px] xl:justify-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8] xl:hidden">
                Total available
              </p>

              <p className="text-xl font-extrabold tracking-tight text-[#0A1B2E]">
                {totalStock.toLocaleString("en-IN")}
                <span className="ml-1 text-xs font-semibold text-[#94A3B8]">
                  units
                </span>
              </p>

              {productHasVariants && (
                <p className="mt-0.5 text-[10px] text-[#64748B]">
                  Combined variant stock
                </p>
              )}
            </div>

            {productHasVariants ? (
              <button
                type="button"
                onClick={onToggle}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F7F7F5] px-3 text-xs font-extrabold text-[#0A1B2E] transition hover:border-[#B9954F] hover:bg-[#B9954F]/5"
              >
                Manage
                <Icon
                  name="chevron"
                  className={`h-4 w-4 transition-transform ${
                    expanded
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>
            ) : (
              <NumberControl
                value={safeNumber(draft.stock)}
                onChange={onStockChange}
                label={`Stock for ${product.name}`}
              />
            )}
          </div>

          <div className="flex items-center justify-between gap-3 xl:w-[150px]">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
                Alert at
              </p>

              {productHasVariants ? (
                <p className="mt-1 text-sm font-extrabold text-[#0A1B2E]">
                  {threshold}
                </p>
              ) : (
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={safeNumber(
                    draft.lowStockThreshold,
                    DEFAULT_THRESHOLD
                  )}
                  onChange={(event) =>
                    onThresholdChange(
                      safeNumber(
                        event.target.value
                      )
                    )
                  }
                  aria-label={`Low stock threshold for ${product.name}`}
                  className="mt-1 h-9 w-20 rounded-lg border border-[#E5E7EB] bg-white px-2 text-center text-xs font-extrabold text-[#0A1B2E] outline-none transition focus:border-[#B9954F] focus:ring-2 focus:ring-[#B9954F]/10"
                />
              )}
            </div>

            {!productHasVariants && (
              <SaveButton
                saving={updateState.saving}
                success={updateState.success}
                onClick={onSave}
              />
            )}
          </div>
        </div>

        {updateState.error && !productHasVariants && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            <Icon
              name="alert"
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>{updateState.error}</span>
          </div>
        )}
      </div>

      {expanded && productHasVariants && (
        <VariantPanel
          product={product}
          variantDrafts={variantDrafts}
          updateStates={updateStates}
          onVariantStockChange={
            onVariantStockChange
          }
          onVariantThresholdChange={
            onVariantThresholdChange
          }
          onVariantSave={onVariantSave}
        />
      )}
    </article>
  );
}

/* ============================================================
   SKELETON
============================================================ */

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 rounded-2xl bg-[#E5E7EB]" />

        <div className="min-w-0 flex-1">
          <div className="h-4 w-40 max-w-full rounded bg-[#E5E7EB]" />
          <div className="mt-2 h-3 w-28 rounded bg-[#F1F5F9]" />
          <div className="mt-2 h-3 w-20 rounded bg-[#F1F5F9]" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function StockManagementPage() {
  const api = useApi();

  const [products, setProducts] =
    useState<StockProduct[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<StockFilter>("all");

  const [expandedProduct, setExpandedProduct] =
    useState<string | null>(null);

  const [productDrafts, setProductDrafts] =
    useState<ProductDraftMap>({});

  const [variantDrafts, setVariantDrafts] =
    useState<Record<string, VariantDraftMap>>(
      {}
    );

  const [updateStates, setUpdateStates] =
    useState<UpdateStateMap>({});

  /* ============================================================
     LOAD PRODUCTS
  ============================================================ */

  const loadProducts = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get<ProductResponse>(
            "/api/stock"
          );

        const nextProducts = Array.isArray(
          response?.products
        )
          ? response.products
          : [];

        setProducts(nextProducts);

        const nextProductDrafts: ProductDraftMap =
          {};

        const nextVariantDrafts: Record<
          string,
          VariantDraftMap
        > = {};

        nextProducts.forEach((product) => {
          if (hasVariants(product)) {
            const drafts: VariantDraftMap = {};

            getProductVariants(product).forEach(
              (variant, index) => {
                const variantId = String(
                  variant._id ||
                    `variant-${index}`
                );

                drafts[variantId] =
                  getInitialVariantDraft(
                    variant
                  );
              }
            );

            nextVariantDrafts[product._id] =
              drafts;
          } else {
            nextProductDrafts[product._id] =
              getInitialProductDraft(product);
          }
        });

        setProductDrafts(nextProductDrafts);
        setVariantDrafts(nextVariantDrafts);
      } catch (loadError) {
        console.error(
          "Failed to load inventory:",
          loadError
        );

        setError(
          "Unable to load inventory. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /* ============================================================
     STATS
  ============================================================ */

  const stats = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalUnits = 0;

    products.forEach((product) => {
      const status = getStockStatus(product);

      totalUnits += getProductStock(product);

      if (status === "in-stock") {
        inStock++;
      } else if (status === "low-stock") {
        lowStock++;
      } else {
        outOfStock++;
      }
    });

    return {
      totalProducts: products.length,
      inStock,
      lowStock,
      outOfStock,
      totalUnits,
    };
  }, [products]);

  /* ============================================================
     FILTER PRODUCTS
  ============================================================ */

  const filteredProducts = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name
          ?.toLowerCase()
          .includes(query) ||
        product.slug
          ?.toLowerCase()
          .includes(query) ||
        getCategorySearchValue(
          product.category
        ).includes(query) ||
        getProductVariants(product).some(
          (variant) =>
            variant.sku
              ?.toLowerCase()
              .includes(query) ||
            getVariantLabel(variant)
              .toLowerCase()
              .includes(query)
        );

      const matchesFilter =
        filter === "all" ||
        getStockStatus(product) === filter;

      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  /* ============================================================
     PRODUCT DRAFT ACTIONS
  ============================================================ */

  const updateProductDraft = (
    productId: string,
    changes: Partial<ProductDraft>
  ) => {
    setProductDrafts((previous) => ({
      ...previous,
      [productId]: {
        ...(previous[productId] || {
          stock: 0,
          lowStockThreshold: DEFAULT_THRESHOLD,
        }),
        ...changes,
      },
    }));
  };

  /* ============================================================
     VARIANT DRAFT ACTIONS
  ============================================================ */

  const updateVariantDraft = (
    productId: string,
    variantId: string,
    changes: Partial<VariantDraft>
  ) => {
    setVariantDrafts((previous) => ({
      ...previous,
      [productId]: {
        ...(previous[productId] || {}),
        [variantId]: {
          ...(previous[productId]?.[variantId] || {
            stock: 0,
            lowStockThreshold:
              DEFAULT_THRESHOLD,
          }),
          ...changes,
        },
      },
    }));
  };

  /* ============================================================
     UPDATE STATE
  ============================================================ */

  const setUpdateState = (
    key: string,
    changes: Partial<StockUpdateState>
  ) => {
    setUpdateStates((previous) => ({
      ...previous,
      [key]: {
        ...(previous[key] ||
          getDefaultUpdateState()),
        ...changes,
      },
    }));
  };

  const startSaving = (key: string) => {
    setUpdateState(key, {
      saving: true,
      error: "",
      success: false,
    });
  };

  /* ============================================================
     SAVE PRODUCT STOCK
  ============================================================ */

  const handleSaveProduct = async (
    product: StockProduct
  ) => {
    if (hasVariants(product)) {
      return;
    }

    const productId = product._id;

    const draft =
      productDrafts[productId] ||
      getInitialProductDraft(product);

    const stock = safeNumber(draft.stock);
    const lowStockThreshold = safeNumber(
      draft.lowStockThreshold,
      DEFAULT_THRESHOLD
    );

    startSaving(productId);

    try {
      const response =
        await api.put<ProductStockResponse>(
          `/api/stock/${productId}`,
          {
            stock,
            lowStockThreshold,
          }
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update product stock."
        );
      }

      setProducts((previous) =>
        previous.map((item) =>
          item._id === productId
            ? {
                ...item,
                stock,
                lowStockThreshold,
              }
            : item
        )
      );

      setUpdateState(productId, {
        saving: false,
        error: "",
        success: true,
      });

      window.setTimeout(() => {
        setUpdateState(productId, {
          success: false,
        });
      }, 1400);
    } catch (saveError) {
      console.error(
        "Failed to save product stock:",
        saveError
      );

      setUpdateState(productId, {
        saving: false,
        success: false,
        error:
          saveError instanceof Error
            ? saveError.message
            : "Failed to update product stock.",
      });
    }
  };

  /* ============================================================
     SAVE VARIANT STOCK
  ============================================================ */

  const handleSaveVariant = async (
    product: StockProduct,
    variant: ProductVariant
  ) => {
    if (!variant._id) {
      return;
    }

    const productId = product._id;
    const variantId = String(variant._id);

    const draft =
      variantDrafts[productId]?.[variantId] ||
      getInitialVariantDraft(variant);

    const stock = safeNumber(draft.stock);
    const lowStockThreshold = safeNumber(
      draft.lowStockThreshold,
      DEFAULT_THRESHOLD
    );

    /*
     * Separate state key for every variant.
     * This prevents saving one size from blocking
     * every other size.
     */
    const stateKey = `${productId}:${variantId}`;

    startSaving(stateKey);

    try {
      const response =
        await api.put<VariantStockResponse>(
          `/api/stock/${productId}/variant/${variantId}`,
          {
            stock,
            lowStockThreshold,
          }
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update variant stock."
        );
      }

      setProducts((previous) =>
        previous.map((item) => {
          if (item._id !== productId) {
            return item;
          }

          return {
            ...item,
            variants: item.variants?.map(
              (itemVariant) =>
                String(itemVariant._id) ===
                variantId
                  ? {
                      ...itemVariant,
                      stock,
                      lowStockThreshold,
                    }
                  : itemVariant
            ),
          };
        })
      );

      setUpdateState(stateKey, {
        saving: false,
        error: "",
        success: true,
      });

      window.setTimeout(() => {
        setUpdateState(stateKey, {
          success: false,
        });
      }, 1400);
    } catch (saveError) {
      console.error(
        "Failed to save variant stock:",
        saveError
      );

      setUpdateState(stateKey, {
        saving: false,
        success: false,
        error:
          saveError instanceof Error
            ? saveError.message
            : "Failed to update variant stock.",
      });
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#B9954F] sm:text-xs">
            Inventory Control
          </p>

          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0A1B2E] sm:text-3xl">
            Stock Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
            Manage product and variant stock
            quickly. Every size can have its own
            stock quantity.
          </p>
        </div>

        <button
          type="button"
          onClick={loadProducts}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-xs font-extrabold text-[#0A1B2E] shadow-sm transition hover:border-[#B9954F] hover:bg-[#FFFCF5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon
            name="refresh"
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Refresh inventory
        </button>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total products"
          value={stats.totalProducts}
          description={`${stats.totalUnits.toLocaleString(
            "en-IN"
          )} total units`}
          active={filter === "all"}
          onClick={() => setFilter("all")}
          icon={
            <Icon
              name="box"
              className="h-5 w-5"
            />
          }
        />

        <StatCard
          label="In stock"
          value={stats.inStock}
          description="Healthy inventory levels"
          active={filter === "in-stock"}
          onClick={() =>
            setFilter("in-stock")
          }
          icon={
            <Icon
              name="check"
              className="h-5 w-5"
            />
          }
        />

        <StatCard
          label="Low stock"
          value={stats.lowStock}
          description="Needs replenishment soon"
          active={filter === "low-stock"}
          onClick={() =>
            setFilter("low-stock")
          }
          icon={
            <Icon
              name="alert"
              className="h-5 w-5"
            />
          }
        />

        <StatCard
          label="Out of stock"
          value={stats.outOfStock}
          description="Currently unavailable"
          active={filter === "out-of-stock"}
          onClick={() =>
            setFilter("out-of-stock")
          }
          icon={
            <Icon
              name="x"
              className="h-5 w-5"
            />
          }
        />
      </section>

      {/* Inventory section */}
      <section className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        {/* Toolbar */}
        <div className="border-b border-[#E5E7EB] p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative min-w-0 flex-1 xl:max-w-lg">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search product, SKU, category or size..."
                className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAF8] pl-10 pr-10 text-sm font-medium text-[#0A1B2E] outline-none transition placeholder:text-[#94A3B8] focus:border-[#B9954F] focus:bg-white focus:ring-2 focus:ring-[#B9954F]/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#94A3B8] transition hover:bg-[#F7F7F5] hover:text-[#0A1B2E]"
                >
                  <Icon
                    name="x"
                    className="h-4 w-4"
                  />
                </button>
              )}
            </div>

            <div className="flex max-w-full overflow-x-auto rounded-xl border border-[#E5E7EB] bg-[#F7F7F5] p-1 [scrollbar-width:none]">
              {(
                [
                  ["all", "All"],
                  ["in-stock", "In stock"],
                  ["low-stock", "Low stock"],
                  ["out-of-stock", "Out of stock"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-extrabold transition ${
                    filter === value
                      ? "bg-white text-[#0A1B2E] shadow-sm"
                      : "text-[#64748B] hover:text-[#0A1B2E]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-[#64748B]">
              Showing{" "}
              <span className="font-extrabold text-[#0A1B2E]">
                {filteredProducts.length}
              </span>{" "}
              of{" "}
              <span className="font-extrabold text-[#0A1B2E]">
                {products.length}
              </span>{" "}
              products
            </p>

            {(search || filter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="text-[11px] font-extrabold text-[#B9954F] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Desktop column heading */}
        {!loading &&
          !error &&
          filteredProducts.length > 0 && (
            <div className="hidden border-b border-[#E5E7EB] bg-[#FAFAF8] px-5 py-3 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#94A3B8] xl:flex">
              <div className="flex-1">
                Product
              </div>

              <div className="w-[150px]">
                Status
              </div>

              <div className="w-[220px]">
                Available
              </div>

              <div className="w-[150px]">
                Alert at
              </div>
            </div>
          )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3 p-4 sm:p-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Icon
                name="alert"
                className="h-6 w-6"
              />
            </div>

            <h3 className="mt-4 text-sm font-extrabold text-[#0A1B2E]">
              Could not load inventory
            </h3>

            <p className="mt-2 max-w-sm text-xs leading-5 text-[#64748B]">
              {error}
            </p>

            <button
              type="button"
              onClick={loadProducts}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0A1B2E] px-4 text-xs font-extrabold text-white transition hover:bg-[#142C46]"
            >
              <Icon
                name="refresh"
                className="h-4 w-4"
              />
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F7F5] text-[#94A3B8]">
                <Icon
                  name="package"
                  className="h-7 w-7"
                />
              </div>

              <h3 className="mt-4 text-sm font-extrabold text-[#0A1B2E]">
                No products found
              </h3>

              <p className="mt-2 text-xs leading-5 text-[#64748B]">
                Try changing your search or
                inventory filter.
              </p>
            </div>
          )}

        {/* Products */}
        {!loading &&
          !error &&
          filteredProducts.length > 0 && (
            <div className="space-y-3 p-3 sm:p-5">
              {filteredProducts.map((product) => {
                const productId = product._id;

                return (
                  <ProductRow
                    key={productId}
                    product={product}
                    expanded={
                      expandedProduct === productId
                    }
                    onToggle={() =>
                      setExpandedProduct((current) =>
                        current === productId
                          ? null
                          : productId
                      )
                    }
                    draft={
                      productDrafts[productId] ||
                      getInitialProductDraft(product)
                    }
                    updateState={
                      updateStates[productId] ||
                      getDefaultUpdateState()
                    }
                    onStockChange={(value) =>
                      updateProductDraft(productId, {
                        stock: value,
                      })
                    }
                    onThresholdChange={(value) =>
                      updateProductDraft(productId, {
                        lowStockThreshold: value,
                      })
                    }
                    onSave={() =>
                      handleSaveProduct(product)
                    }
                    variantDrafts={
                      variantDrafts[productId] || {}
                    }
                    updateStates={updateStates}
                    onVariantStockChange={(
                      variantId,
                      value
                    ) =>
                      updateVariantDraft(
                        productId,
                        variantId,
                        {
                          stock: value,
                        }
                      )
                    }
                    onVariantThresholdChange={(
                      variantId,
                      value
                    ) =>
                      updateVariantDraft(
                        productId,
                        variantId,
                        {
                          lowStockThreshold: value,
                        }
                      )
                    }
                    onVariantSave={(variant) =>
                      handleSaveVariant(
                        product,
                        variant
                      )
                    }
                  />
                );
              })}
            </div>
          )}
      </section>
    </div>
  );
}