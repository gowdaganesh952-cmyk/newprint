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
 *
 * fixed:
 * One price for the product.
 *
 * variants:
 * Price depends on the customer's selected options.
 */
export type ProductPricingType = "fixed" | "variants";

/**
 * One price combination for a product.
 *
 * Examples:
 *
 * { Capacity: "250ml" } -> ₹150
 *
 * { Capacity: "500ml" } -> ₹200
 *
 * OR
 *
 * { Size: "L" } -> ₹449
 *
 * OR multiple selections:
 *
 * { Size: "L", Printing: "Front + Back" } -> ₹499
 */
export interface ProductVariant {
  _id?: string;

  selections: Record<string, string>;

  price: number;

  sku?: string;

  status?: "active" | "inactive";
}

export interface Product {
  _id: string;

  category: string;

  name: string;

  slug?: string;

  description?: string;

  /**
   * Used when pricingType === "fixed".
   *
   * Example:
   * Sticker -> ₹50
   * Mug -> ₹199
   *
   * For variant pricing this can be undefined/null.
   */
  price?: number;

  /**
   * Determines whether this product has
   * one fixed price or selection-based prices.
   */
  pricingType?: ProductPricingType;

  images?: string[];

  /**
   * General product information.
   *
   * Example:
   * Material -> Cotton, Polyester
   */
  options?: ProductOption[];

  /**
   * Options selected by the customer while ordering.
   *
   * Example:
   * Size -> S, M, L, XL
   *
   * Capacity -> 250ml, 500ml
   */
  orderSelections?: ProductOrderSelection[];

  /**
   * Price combinations.
   *
   * Used only when pricingType === "variants".
   */
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