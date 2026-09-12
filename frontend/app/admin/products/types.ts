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
 *
 * Inventory is managed separately from
 * the Product Form.
 */
export interface ProductVariant {
  _id?: string;

  selections: Record<string, string>;

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
   * Current available quantity.
   *
   * Inventory is managed separately.
   */
  stock: number;

  /**
   * Low-stock threshold.
   *
   * Inventory is managed separately.
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
   * Used only for internal shipping calculation.
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
   * Inventory is managed separately.
   *
   * Kept in the type because the API/product
   * object may still contain inventory data.
   */
  stock?: number;

  /**
   * Inventory is managed separately.
   */
  lowStockThreshold?: number;

  images?: string[];

  options?: ProductOption[];

  orderSelections?: ProductOrderSelection[];

  variants?: ProductVariant[];

  /**
   * Products manually selected as related products.
   *
   * Stored as product IDs.
   *
   * The API may return these either as IDs or
   * populated Product objects, so the frontend
   * handles both forms.
   */
  relatedProducts?: (
    | string
    | Product
  )[];

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