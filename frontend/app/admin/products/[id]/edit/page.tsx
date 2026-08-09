"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductForm from "@/app/admin/products/ProductForm";
import { Product } from "@/app/admin/products/types";
import { useApi } from "@/app/lib/api";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get<{
          success: boolean;
          product: Product;
        }>(`/api/products/${params.id}`);

        if (res.success && res.product) {
          setProduct(res.product);
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Failed to load product:", err);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1B2E] sm:text-3xl">
            Edit Product
          </h1>
          <p className="mt-2 text-sm text-[#64748B]">
            Update the details for this item.
          </p>
        </div>

        <div className="flex h-64 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#B9954F]" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1B2E] sm:text-3xl">
            Edit Product
          </h1>
        </div>

        <div className="flex flex-col items-center justify-center rounded-[12px] border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-700">
            {error || "Product not found"}
          </p>

          <button
            onClick={() => router.push("/admin/products")}
            className="mt-4 rounded-[9px] bg-[#0A1B2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#142C46]"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A1B2E] sm:text-3xl">
          Edit Product
        </h1>

        <p className="mt-2 text-sm text-[#64748B]">
          Update details for {product.name}.
        </p>
      </div>

      <ProductForm initialData={product} />
    </div>
  );
}