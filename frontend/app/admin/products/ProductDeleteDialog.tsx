"use client";

import { Product } from "./types";

interface ProductDeleteDialogProps {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ProductDeleteDialog({ 
  product, 
  onConfirm, 
  onCancel, 
  loading 
}: ProductDeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-[#0A1B2E]/60 backdrop-blur-sm" 
        onClick={!loading ? onCancel : undefined} 
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-[12px] bg-white p-6 shadow-xl text-center">
        <h3 className="text-lg font-bold text-[#0A1B2E]">Delete Product</h3>
        <p className="mt-2 text-sm text-[#64748B]">
          Are you sure you want to delete &quot;<strong>{product.name}</strong>&quot;? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-[9px] border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#0A1B2E] hover:bg-[#F7F7F5] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-[9px] bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}