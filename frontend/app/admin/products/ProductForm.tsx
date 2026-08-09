// frontend/app/admin/products/ProductForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApi, ApiError } from "@/app/lib/api";
import { Category, ProductOption, Product } from "./types";

interface ImagePreview {
  file?: File; 
  previewUrl: string;
}

interface ProductFormProps {
  initialData?: Product; 
}

export default function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const api = useApi();
  const isEditing = !!initialData;

  // Category API States
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState(false);

  // Form States (Pre-filled if editing)
  const [categoryId, setCategoryId] = useState(
    typeof initialData?.category === 'object' 
      ? (initialData.category as any)._id // If populated
      : initialData?.category || ""
  );
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(isEditing);
  const [description, setDescription] = useState(initialData?.description || "");
  const [price, setPrice] = useState<string>(initialData?.price !== undefined ? String(initialData.price) : "");
  const [status, setStatus] = useState<"active" | "inactive">(initialData?.status || "active");
  const [featured, setFeatured] = useState(initialData?.featured || false);
  
  // Initialize existing images if editing
  const [images, setImages] = useState<ImagePreview[]>(
    initialData?.images?.map(url => ({ previewUrl: url })) || []
  );
  const [options, setOptions] = useState<ProductOption[]>(initialData?.options || []);
  const [newOptionValue, setNewOptionValue] = useState<{ [key: number]: string }>({});

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        setCategoryError(false);
        const data = await api.get<{ success: boolean; categories: Category[] }>("/api/categories");
        if (data.success) {
          setCategories(data.categories.filter((c) => c.status === "active"));
        }
      } catch (err) {
        setCategoryError(true);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isSlugManuallyEdited && name) {
      setSlug(name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
    }
  }, [name, isSlugManuallyEdited]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (images.length + selectedFiles.length > 10) return alert("Maximum 10 images allowed.");
      const newImages = selectedFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    if (images[index].file) URL.revokeObjectURL(images[index].previewUrl); 
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === images.length - 1) return;
    const newImages = [...images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setImages(newImages);
  };

  const addOption = () => setOptions([...options, { name: "", values: [] }]);
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
  const updateOptionName = (index: number, val: string) => {
    const newOpts = [...options];
    newOpts[index].name = val;
    setOptions(newOpts);
  };
  const addOptionValue = (index: number) => {
    const val = newOptionValue[index]?.trim();
    if (val && !options[index].values.includes(val)) {
      const newOpts = [...options];
      newOpts[index].values.push(val);
      setOptions(newOpts);
      setNewOptionValue({ ...newOptionValue, [index]: "" });
    }
  };
  const removeOptionValue = (optIndex: number, valIndex: number) => {
    const newOpts = [...options];
    newOpts[optIndex].values.splice(valIndex, 1);
    setOptions(newOpts);
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!categoryId) return setFormError("Please select a category.");
    if (!name.trim()) return setFormError("Product name is required.");
    if (price !== "" && parseFloat(price) < 0) return setFormError("Price cannot be negative.");
    for (const opt of options) {
      if (!opt.name.trim()) return setFormError("Option names cannot be empty.");
      if (opt.values.length === 0) return setFormError(`Please add at least one value for option: ${opt.name}`);
    }

const formData = new FormData();

formData.append("category", categoryId);
formData.append("name", name.trim());

if (slug.trim()) {
    formData.append("slug", slug.trim());
}

if (description.trim()) {
    formData.append("description", description.trim());
}

if (price !== "") {
    formData.append("price", price);
}

formData.append("status", status);
formData.append("featured", featured ? "true" : "false");
formData.append("options", JSON.stringify(options));

images.forEach((image) => {
    if (image.file) {
        formData.append("images", image.file);
    }
});
    try {
      setIsSubmitting(true);
      
      if (isEditing && initialData) {
        await api.put(`/api/products/${initialData._id}`, formData);
      } else {
        await api.post("/api/products", formData);
      }
      
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setFormError(err instanceof ApiError ? err.message : "Failed to submit product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingCategories) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#B9954F]" />
          <p className="mt-4 text-sm font-medium text-[#64748B]">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (categoryError) return (
    <div className="flex h-64 flex-col items-center justify-center rounded-[12px] border border-red-200 bg-red-50 p-8 text-center text-red-700">
      <p>Unable to load categories.</p>
    </div>
  );

  if (categories.length === 0) return (
    <div className="flex h-64 flex-col items-center justify-center rounded-[12px] border border-dashed border-[#E5E7EB] bg-white p-8 text-center">
      <h3 className="text-sm font-semibold text-[#0A1B2E]">No active categories available.</h3>
      <button onClick={() => router.push("/admin/categories")} className="mt-6 rounded-[9px] bg-[#0A1B2E] px-4 py-2 text-sm font-semibold text-white">Go to Categories</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {formError && (
        <div className="rounded-[9px] border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {formError}
        </div>
      )}

      {/* Category Section */}
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0A1B2E]">Product Category</h2>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-4 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm">
          <option value="" disabled>[ Select Category ]</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {/* Product Info Section */}
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0A1B2E]">Product Information</h2>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#0A1B2E]">Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0A1B2E]">Slug</label>
              <input type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setIsSlugManuallyEdited(true); }} className="mt-1 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0A1B2E]">Description</label>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0A1B2E]">Pricing</h2>
        <div className="relative mt-4 max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#64748B]">₹</span>
          <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-[9px] border border-[#E5E7EB] pl-8 pr-3 py-2 text-sm" />
        </div>
      </div>

      {/* Images Section */}
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0A1B2E]">Images</h2>
          <span className="text-xs font-medium text-[#64748B]">{images.length} / 10</span>
        </div>
        <label className="mt-4 inline-flex cursor-pointer rounded-[9px] border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#0A1B2E] hover:bg-[#F7F7F5]">
          Add Images
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={images.length >= 10} />
        </label>
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {images.map((img, index) => (
              <div key={index} className="group relative flex aspect-square overflow-hidden rounded-[9px] border border-[#E5E7EB] bg-gray-50">
                <img src={img.previewUrl} alt="preview" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex flex-col justify-between bg-black/40 p-2 opacity-0 hover:opacity-100">
                  <button type="button" onClick={() => removeImage(index)} className="self-end rounded-full bg-white p-1 text-red-600">✕</button>
                  <div className="flex justify-between">
                    <button type="button" onClick={() => moveImage(index, 'left')} className="rounded bg-white px-2 py-1 text-xs">←</button>
                    <button type="button" onClick={() => moveImage(index, 'right')} className="rounded bg-white px-2 py-1 text-xs">→</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Options Section */}
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="flex justify-between">
          <h2 className="text-lg font-bold text-[#0A1B2E]">Product Options</h2>
          <button type="button" onClick={addOption} className="rounded-[9px] border border-[#E5E7EB] bg-[#F7F7F5] px-3 py-1.5 text-sm font-semibold text-[#0A1B2E]">+ Add Option</button>
        </div>
        <div className="mt-4 space-y-4">
          {options.map((opt, optIndex) => (
            <div key={optIndex} className="relative rounded-[9px] border border-[#E5E7EB] bg-gray-50/50 p-4">
              <button type="button" onClick={() => removeOption(optIndex)} className="absolute right-3 top-3 text-[#64748B]">✕</button>
              <input type="text" value={opt.name} onChange={(e) => updateOptionName(optIndex, e.target.value)} placeholder="Option Name (e.g. Size)" className="mb-3 w-full max-w-xs rounded-[6px] border border-[#E5E7EB] px-2 py-1.5 text-sm" />
              <div className="flex flex-wrap gap-2">
                {opt.values.map((val, valIndex) => (
                  <span key={valIndex} className="inline-flex rounded-full bg-[#0A1B2E] px-2.5 py-1 text-xs text-white">
                    {val} <button type="button" onClick={() => removeOptionValue(optIndex, valIndex)} className="ml-1 text-[#B9954F]">✕</button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex max-w-xs gap-2">
                <input type="text" value={newOptionValue[optIndex] || ""} onChange={(e) => setNewOptionValue({ ...newOptionValue, [optIndex]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOptionValue(optIndex))} placeholder="Add value (Press Enter)" className="w-full rounded-[6px] border border-[#E5E7EB] px-2 py-1.5 text-sm" />
                <button type="button" onClick={() => addOptionValue(optIndex)} className="rounded-[6px] bg-[#E5E7EB] px-3 py-1.5 text-sm font-medium">Add</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visibility Section */}
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0A1B2E]">Visibility</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[#0A1B2E]">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")} className="mt-1 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm">
              <option value="active">Active (Visible)</option>
              <option value="inactive">Inactive (Hidden)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0A1B2E]">Featured</label>
            <label className="mt-2 flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-5 w-5 rounded border-[#E5E7EB] text-[#0A1B2E] focus:ring-[#B9954F]" />
              <span className="text-sm font-medium text-[#64748B]">Yes, feature this product</span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 border-t border-[#E5E7EB] pt-6">
        <button type="button" onClick={() => router.push("/admin/products")} disabled={isSubmitting} className="rounded-[9px] px-5 py-2.5 text-sm font-semibold text-[#64748B] hover:bg-gray-100">Cancel</button>
        <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="rounded-[9px] bg-[#0A1B2E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#142C46]">
          {isSubmitting ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
        </button>
      </div>
    </div>
  );
}