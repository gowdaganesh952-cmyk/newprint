// frontend/app/admin/products/types.ts
export interface ProductOption {
  name: string;
  values: string[];
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
  status: "active" | "inactive";
  featured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Temporary Category type to match the backend
export interface Category {
  _id: string;
  name: string;
  status: "active" | "inactive";
}