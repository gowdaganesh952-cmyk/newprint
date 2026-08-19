export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductOrderSelection {
  name: string;
  values: string[];
  required: boolean;
}

/**
 * Defines how the product price works.
 */
export type ProductPricingType =
  | "fixed"
  | "variants";

/**
 * One price + inventory combination
 * for a product variant.
 */
export interface ProductVariant {
  _id?: string;

  selections: Record<
    string,
    string
  >;

  /**
   * Original / MRP price.
   */
  originalPrice?: number;

  /**
   * Current selling price.
   */
  price: number;

  /**
   * SKU.
   */
  sku?: string;

  /**
   * Currently available quantity.
   */
  stock: number;

  /**
   * Show low-stock warning when stock
   * reaches this number.
   */
  lowStockThreshold?: number;

  status?:
    | "active"
    | "inactive";
}

export interface Product {
  _id: string;

  category: string;

  name: string;

  slug?: string;

  description?: string;

  /**
   * Internal shipping weight in grams.
   *
   * Example:
   * 100  = 100 grams
   * 250  = 250 grams
   * 500  = 500 grams
   *
   * This value is used only for internal
   * shipping calculation.
   *
   * Do not display this value to customers.
   */
  weight?: number;

  /**
   * Original / MRP price.
   *
   * Used only for fixed-price products.
   */
  originalPrice?: number;

  /**
   * Current selling price.
   *
   * Used for fixed-price products.
   */
  price?: number;

  /**
   * Fixed or variant pricing.
   */
  pricingType?: ProductPricingType;

  /**
   * Stock for fixed-price products.
   */
  stock?: number;

  /**
   * Low-stock warning threshold
   * for fixed-price products.
   */
  lowStockThreshold?: number;

  images?: string[];

  options?: ProductOption[];

  orderSelections?: ProductOrderSelection[];

  variants?: ProductVariant[];

  status:
    | "active"
    | "inactive";

  featured: boolean;

  createdAt?: string;

  updatedAt?: string;
}

export interface Category {
  _id: string;

  name: string;

  status:
    | "active"
    | "inactive";
}
