"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Category } from "./types";
import { useApi, ApiError } from "@/app/lib/api";

interface CategoryModalProps {
  onClose: () => void;
  onSuccess: () => void;
  category?: Category | null;
}

export default function CategoryModal({ onClose, onSuccess, category }: CategoryModalProps) {
  const api = useApi();
  const isEditing = !!category;

  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [description, setDescription] = useState(category?.description || "");
  const [priority, setPriority] = useState(category?.priority || 1); // Fixed default
  const [status, setStatus] = useState<"active" | "inactive">(category?.status || "active");
  const [image, setImage] = useState(category?.image || "");
  
  const [isManuallyEdited, setIsManuallyEdited] = useState(isEditing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug
  useEffect(() => {
    if (!isManuallyEdited && name) {
      setSlug(
        name.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "")
      );
    }
  }, [name, isManuallyEdited]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate priority per backend rules
      if (priority < 1) {
        throw new Error("Priority must be at least 1");
      }

      const payload = { name, slug, description, priority, status, image };

      if (isEditing) {
        await api.put(`/api/categories/${category._id}`, payload);
      } else {
        await api.post("/api/categories", payload);
      }

      onSuccess(); // Triggers reload & close in parent
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err.message || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#0A1B2E]/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg overflow-hidden rounded-[12px] bg-white shadow-xl"
      >
        <div className="border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0A1B2E]">{isEditing ? "Edit Category" : "Add Category"}</h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#0A1B2E]">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-[9px] bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#0A1B2E]">Category Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F]"
              placeholder="e.g., Clothing"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0A1B2E]">Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setIsManuallyEdited(true);
              }}
              className="mt-1 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F]"
              placeholder="clothing"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0A1B2E]">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0A1B2E]">Priority (≥ 1)</label>
              <input
                type="number"
                min="1"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
                className="mt-1 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0A1B2E]">Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                className="mt-1 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#0A1B2E]">Image URL</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="Temporary URL (Upload API coming soon)"
              className="mt-1 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F]"
            />
          </div>
        </div>

        <div className="border-t border-[#E5E7EB] bg-[#F7F7F5] px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-[9px] px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0A1B2E] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-[9px] bg-[#0A1B2E] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#142C46] disabled:opacity-50"
          >
            {loading ? "Saving..." : (isEditing ? "Update Category" : "Save Category")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}