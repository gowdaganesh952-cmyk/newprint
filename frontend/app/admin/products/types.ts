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
 * for a product.
 *
 * originalPrice = MRP / price before discount
 * price         = current selling price
 */
export interface ProductVariant {
  _id?: string;

  selections: Record<
    string,
    string
  >;

  /**
   * Original / MRP price.
   *
   * Example:
   * originalPrice: 1999
   * price: 486
   */
  originalPrice?: number;

  /**
   * Current selling price.
   */
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
   * Original / MRP price.
   *
   * Used only for fixed-price products.
   *
   * Example:
   * originalPrice: 1999
   * price: 486
   *
   * Website can display:
   * ↓76% ₹1,999 ₹486
   */
  originalPrice?: number;

  /**
   * Current selling price.
   *
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