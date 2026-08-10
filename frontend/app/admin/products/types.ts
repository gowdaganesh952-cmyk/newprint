export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductOrderSelection {
  name: string;
  values: string[];
  required: boolean;
}

export interface Product {
  _id: string;
  category: string;
  name: string;
  slug?: string;
  description?: string;
  price?: number;
  images?: string[];

  options?: ProductOption[];

  orderSelections?: ProductOrderSelection[];

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