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
export type ProductPricingType = "fixed" | "variants";

/**
 * One price + inventory combination for a product.
 */
export interface ProductVariant {
  _id?: string;

  selections: Record<string, string>;

  price: number;

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

  status?: "active" | "inactive";
}

export interface Product {
  _id: string;

  category: string;

  name: string;

  slug?: string;

  description?: string;

  /**
   * Used for fixed pricing.
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

  status: "active" | "inactive";

  featured: boolean;

  createdAt?: string;

  updatedAt?: string;
}

export interface Category {
  _id: string;

  name: string;

  status: "active" | "inactive";
}