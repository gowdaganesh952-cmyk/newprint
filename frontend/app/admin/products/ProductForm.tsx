"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApi, ApiError } from "@/app/lib/api";
import {
  Category,
  ProductOption,
  ProductOrderSelection,
  Product,
} from "./types";

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

  // =========================================================
  // CATEGORY
  // =========================================================

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState(false);

  // =========================================================
  // BASIC PRODUCT INFORMATION
  // =========================================================

  const [categoryId, setCategoryId] = useState(
    typeof initialData?.category === "object"
      ? (initialData.category as any)._id
      : initialData?.category || ""
  );

  const [name, setName] = useState(initialData?.name || "");

  const [slug, setSlug] = useState(initialData?.slug || "");

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] =
    useState(isEditing);

  const [description, setDescription] = useState(
    initialData?.description || ""
  );

  const [price, setPrice] = useState<string>(
    initialData?.price !== undefined
      ? String(initialData.price)
      : ""
  );

  const [status, setStatus] = useState<"active" | "inactive">(
    initialData?.status || "active"
  );

  const [featured, setFeatured] = useState(
    initialData?.featured || false
  );

  // =========================================================
  // IMAGES
  // =========================================================

  const [images, setImages] = useState<ImagePreview[]>(
    initialData?.images?.map((url) => ({
      previewUrl: url,
    })) || []
  );

  // =========================================================
  // PRODUCT OPTIONS
  // These are informational/product properties.
  // Example:
  // Material -> Cotton, Polyester
  // =========================================================

  const [options, setOptions] = useState<ProductOption[]>(
    initialData?.options || []
  );

  const [newOptionValue, setNewOptionValue] = useState<{
    [key: number]: string;
  }>({});

  // =========================================================
  // ORDER-TIME OPTIONS
  //
  // These are CUSTOMER selections before Add to Cart.
  //
  // Example:
  //
  // T-Shirt:
  // Size -> S, M, L, XL
  //
  // Mug:
  // Capacity -> 250 ML, 350 ML, 500 ML
  //
  // Keychain:
  // No order-time options
  // =========================================================

  const [orderSelections, setOrderSelections] =
    useState<ProductOrderSelection[]>(
      initialData?.orderSelections || []
    );

  const [newOrderSelectionValue, setNewOrderSelectionValue] =
    useState<{ [key: number]: string }>({});

  // =========================================================
  // FORM
  // =========================================================

  const [formError, setFormError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // =========================================================
  // LOAD CATEGORIES
  // =========================================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        setCategoryError(false);

        const data = await api.get<{
          success: boolean;
          categories: Category[];
        }>("/api/categories");

        if (data.success) {
          setCategories(
            data.categories.filter(
              (category) => category.status === "active"
            )
          );
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
        setCategoryError(true);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // =========================================================
  // AUTO SLUG
  // =========================================================

  useEffect(() => {
    if (!isSlugManuallyEdited && name) {
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      setSlug(generatedSlug);
    }
  }, [name, isSlugManuallyEdited]);

  // =========================================================
  // IMAGE FUNCTIONS
  // =========================================================

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);

    if (images.length + selectedFiles.length > 10) {
      alert("Maximum 10 images allowed.");
      return;
    }

    const newImages: ImagePreview[] = selectedFiles.map(
      (file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })
    );

    setImages((previous) => [
      ...previous,
      ...newImages,
    ]);
  };

  const removeImage = (index: number) => {
    if (images[index]?.file) {
      URL.revokeObjectURL(images[index].previewUrl);
    }

    setImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  const moveImage = (
    index: number,
    direction: "left" | "right"
  ) => {
    if (
      direction === "left" &&
      index === 0
    ) {
      return;
    }

    if (
      direction === "right" &&
      index === images.length - 1
    ) {
      return;
    }

    const updatedImages = [...images];

    const targetIndex =
      direction === "left"
        ? index - 1
        : index + 1;

    const temporary = updatedImages[index];

    updatedImages[index] =
      updatedImages[targetIndex];

    updatedImages[targetIndex] = temporary;

    setImages(updatedImages);
  };

  // =========================================================
  // PRODUCT OPTIONS
  // =========================================================

  const addOption = () => {
    setOptions((previous) => [
      ...previous,
      {
        name: "",
        values: [],
      },
    ]);
  };

  const removeOption = (index: number) => {
    setOptions((previous) =>
      previous.filter(
        (_, optionIndex) => optionIndex !== index
      )
    );

    setNewOptionValue((previous) => {
      const updated = { ...previous };
      delete updated[index];
      return updated;
    });
  };

  const updateOptionName = (
    index: number,
    value: string
  ) => {
    setOptions((previous) => {
      const updated = [...previous];

      updated[index] = {
        ...updated[index],
        name: value,
      };

      return updated;
    });
  };

  const addOptionValue = (index: number) => {
    const value =
      newOptionValue[index]?.trim();

    if (!value) return;

    if (options[index].values.includes(value)) {
      return;
    }

    setOptions((previous) => {
      const updated = [...previous];

      updated[index] = {
        ...updated[index],
        values: [
          ...updated[index].values,
          value,
        ],
      };

      return updated;
    });

    setNewOptionValue((previous) => ({
      ...previous,
      [index]: "",
    }));
  };

  const removeOptionValue = (
    optionIndex: number,
    valueIndex: number
  ) => {
    setOptions((previous) => {
      const updated = [...previous];

      updated[optionIndex] = {
        ...updated[optionIndex],
        values: updated[optionIndex].values.filter(
          (_, index) => index !== valueIndex
        ),
      };

      return updated;
    });
  };

  // =========================================================
  // ORDER-TIME OPTIONS
  // =========================================================

  const addOrderSelection = () => {
    setOrderSelections((previous) => [
      ...previous,
      {
        name: "",
        values: [],
        required: true,
      },
    ]);
  };

  const removeOrderSelection = (index: number) => {
    setOrderSelections((previous) =>
      previous.filter(
        (_, selectionIndex) =>
          selectionIndex !== index
      )
    );

    setNewOrderSelectionValue((previous) => {
      const updated = { ...previous };
      delete updated[index];
      return updated;
    });
  };

  const updateOrderSelectionName = (
    index: number,
    value: string
  ) => {
    setOrderSelections((previous) => {
      const updated = [...previous];

      updated[index] = {
        ...updated[index],
        name: value,
      };

      return updated;
    });
  };

  const updateOrderSelectionRequired = (
    index: number,
    value: boolean
  ) => {
    setOrderSelections((previous) => {
      const updated = [...previous];

      updated[index] = {
        ...updated[index],
        required: value,
      };

      return updated;
    });
  };

  const addOrderSelectionValue = (
    index: number
  ) => {
    const value =
      newOrderSelectionValue[index]?.trim();

    if (!value) return;

    if (
      orderSelections[index].values.includes(value)
    ) {
      return;
    }

    setOrderSelections((previous) => {
      const updated = [...previous];

      updated[index] = {
        ...updated[index],
        values: [
          ...updated[index].values,
          value,
        ],
      };

      return updated;
    });

    setNewOrderSelectionValue((previous) => ({
      ...previous,
      [index]: "",
    }));
  };

  const removeOrderSelectionValue = (
    selectionIndex: number,
    valueIndex: number
  ) => {
    setOrderSelections((previous) => {
      const updated = [...previous];

      updated[selectionIndex] = {
        ...updated[selectionIndex],
        values: updated[
          selectionIndex
        ].values.filter(
          (_, index) => index !== valueIndex
        ),
      };

      return updated;
    });
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async () => {
    setFormError(null);

    // Basic validation
    if (!categoryId) {
      setFormError("Please select a category.");
      return;
    }

    if (!name.trim()) {
      setFormError("Product name is required.");
      return;
    }

    if (
      price !== "" &&
      Number.isNaN(parseFloat(price))
    ) {
      setFormError("Please enter a valid price.");
      return;
    }

    if (
      price !== "" &&
      parseFloat(price) < 0
    ) {
      setFormError("Price cannot be negative.");
      return;
    }

    // =======================================================
    // VALIDATE PRODUCT OPTIONS
    // =======================================================

    for (const option of options) {
      if (!option.name.trim()) {
        setFormError(
          "Product option names cannot be empty."
        );
        return;
      }

      if (option.values.length === 0) {
        setFormError(
          `Please add at least one value for product option: ${option.name}`
        );
        return;
      }
    }

    // =======================================================
    // VALIDATE ORDER-TIME OPTIONS
    // =======================================================

    for (const selection of orderSelections) {
      if (!selection.name.trim()) {
        setFormError(
          "Order-time option names cannot be empty."
        );
        return;
      }

      if (selection.values.length === 0) {
        setFormError(
          `Please add at least one value for order-time option: ${selection.name}`
        );
        return;
      }
    }

    // =======================================================
    // FORM DATA
    // =======================================================

    const formData = new FormData();

    formData.append(
      "category",
      categoryId
    );

    formData.append(
      "name",
      name.trim()
    );

    if (slug.trim()) {
      formData.append(
        "slug",
        slug.trim()
      );
    }

    if (description.trim()) {
      formData.append(
        "description",
        description.trim()
      );
    }

    if (price !== "") {
      formData.append(
        "price",
        price
      );
    }

    formData.append(
      "status",
      status
    );

    formData.append(
      "featured",
      featured ? "true" : "false"
    );

    // Product information options
    formData.append(
      "options",
      JSON.stringify(options)
    );

    // Customer order-time options
    formData.append(
      "orderSelections",
      JSON.stringify(orderSelections)
    );

    // Images
    images.forEach((image) => {
      if (image.file) {
        formData.append(
          "images",
          image.file
        );
      }
    });

    // =======================================================
    // API
    // =======================================================

    try {
      setIsSubmitting(true);

      if (isEditing && initialData) {
        await api.put(
          `/api/products/${initialData._id}`,
          formData
        );
      } else {
        await api.post(
          "/api/products",
          formData
        );
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error: any) {
      console.error(
        "Product submit error:",
        error
      );

      setFormError(
        error instanceof ApiError
          ? error.message
          : "Failed to save product."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loadingCategories) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#B9954F]" />

          <p className="mt-4 text-sm font-medium text-[#64748B]">
            Loading categories...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // CATEGORY ERROR
  // =========================================================

  if (categoryError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-[12px] border border-red-200 bg-red-50 p-8 text-center text-red-700">
        <p>
          Unable to load categories.
        </p>
      </div>
    );
  }

  // =========================================================
  // NO CATEGORIES
  // =========================================================

  if (categories.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-[12px] border border-dashed border-[#E5E7EB] bg-white p-8 text-center">
        <h3 className="text-sm font-semibold text-[#0A1B2E]">
          No active categories available.
        </h3>

        <button
          type="button"
          onClick={() =>
            router.push("/admin/categories")
          }
          className="mt-6 rounded-[9px] bg-[#0A1B2E] px-4 py-2 text-sm font-semibold text-white"
        >
          Go to Categories
        </button>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">

      {/* =====================================================
          ERROR
      ====================================================== */}

      {formError && (
        <div className="rounded-[9px] border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {formError}
        </div>
      )}

      {/* =====================================================
          CATEGORY
      ====================================================== */}

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0A1B2E]">
          Product Category
        </h2>

        <select
          value={categoryId}
          onChange={(e) =>
            setCategoryId(e.target.value)
          }
          className="mt-4 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#B9954F]"
        >
          <option
            value=""
            disabled
          >
            [ Select Category ]
          </option>

          {categories.map((category) => (
            <option
              key={category._id}
              value={category._id}
            >
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* =====================================================
          PRODUCT INFORMATION
      ====================================================== */}

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0A1B2E]">
          Product Information
        </h2>

        <div className="mt-4 space-y-4">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="block text-sm font-medium text-[#0A1B2E]">
                Name *
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="mt-1 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#B9954F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A1B2E]">
                Slug
              </label>

              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugManuallyEdited(true);
                }}
                className="mt-1 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#B9954F]"
              />
            </div>

          </div>

          <div>
            <label className="block text-sm font-medium text-[#0A1B2E]">
              Description
            </label>

            <textarea
              rows={4}
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              className="mt-1 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#B9954F]"
            />
          </div>

        </div>
      </div>

      {/* =====================================================
          PRICING
      ====================================================== */}

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0A1B2E]">
          Pricing
        </h2>

        <div className="relative mt-4 max-w-xs">

          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#64748B]">
            ₹
          </span>

          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            className="w-full rounded-[9px] border border-[#E5E7EB] py-2 pl-8 pr-3 text-sm outline-none focus:border-[#B9954F]"
          />

        </div>
      </div>

      {/* =====================================================
          IMAGES
      ====================================================== */}

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <h2 className="text-lg font-bold text-[#0A1B2E]">
            Images
          </h2>

          <span className="text-xs font-medium text-[#64748B]">
            {images.length} / 10
          </span>

        </div>

        <label className="mt-4 inline-flex cursor-pointer rounded-[9px] border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#0A1B2E] hover:bg-[#F7F7F5]">

          Add Images

          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={images.length >= 10}
          />

        </label>

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

            {images.map((image, index) => (
              <div
                key={`${image.previewUrl}-${index}`}
                className="group relative flex aspect-square overflow-hidden rounded-[9px] border border-[#E5E7EB] bg-gray-50"
              >

                <img
                  src={image.previewUrl}
                  alt="Product preview"
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 flex flex-col justify-between bg-black/40 p-2 opacity-0 transition-opacity group-hover:opacity-100">

                  <button
                    type="button"
                    onClick={() =>
                      removeImage(index)
                    }
                    className="self-end rounded-full bg-white px-2 py-1 text-sm text-red-600"
                  >
                    ✕
                  </button>

                  <div className="flex justify-between">

                    <button
                      type="button"
                      onClick={() =>
                        moveImage(index, "left")
                      }
                      disabled={index === 0}
                      className="rounded bg-white px-2 py-1 text-xs disabled:opacity-40"
                    >
                      ←
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        moveImage(index, "right")
                      }
                      disabled={
                        index === images.length - 1
                      }
                      className="rounded bg-white px-2 py-1 text-xs disabled:opacity-40"
                    >
                      →
                    </button>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

      {/* =====================================================
          PRODUCT OPTIONS
      ====================================================== */}

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between gap-4">

          <div>
            <h2 className="text-lg font-bold text-[#0A1B2E]">
              Product Options
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              General product information such as material,
              finish, or style.
            </p>
          </div>

          <button
            type="button"
            onClick={addOption}
            className="shrink-0 rounded-[9px] border border-[#E5E7EB] bg-[#F7F7F5] px-3 py-1.5 text-sm font-semibold text-[#0A1B2E] hover:bg-[#EFEFEA]"
          >
            + Add Option
          </button>

        </div>

        <div className="mt-4 space-y-4">

          {options.map((option, optionIndex) => (

            <div
              key={optionIndex}
              className="relative rounded-[9px] border border-[#E5E7EB] bg-gray-50/50 p-4"
            >

              <button
                type="button"
                onClick={() =>
                  removeOption(optionIndex)
                }
                className="absolute right-3 top-3 text-sm text-red-600 hover:text-red-700"
              >
                Delete
              </button>

              <div className="max-w-sm">

                <label className="block text-sm font-medium text-[#0A1B2E]">
                  Option Name *
                </label>

                <input
                  type="text"
                  value={option.name}
                  onChange={(e) =>
                    updateOptionName(
                      optionIndex,
                      e.target.value
                    )
                  }
                  placeholder="Example: Material"
                  className="mt-2 w-full rounded-[7px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#B9954F]"
                />

              </div>

              <div className="mt-4">

                <label className="block text-sm font-medium text-[#0A1B2E]">
                  Values
                </label>

                {option.values.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">

                    {option.values.map(
                      (value, valueIndex) => (

                        <span
                          key={valueIndex}
                          className="inline-flex items-center rounded-full bg-[#0A1B2E] px-3 py-1 text-xs text-white"
                        >

                          {value}

                          <button
                            type="button"
                            onClick={() =>
                              removeOptionValue(
                                optionIndex,
                                valueIndex
                              )
                            }
                            className="ml-2 text-[#B9954F] hover:text-white"
                          >
                            ×
                          </button>

                        </span>

                      )
                    )}

                  </div>
                )}

                <div className="mt-3 flex max-w-md gap-2">

                  <input
                    type="text"
                    value={
                      newOptionValue[
                        optionIndex
                      ] || ""
                    }
                    onChange={(e) =>
                      setNewOptionValue({
                        ...newOptionValue,
                        [optionIndex]:
                          e.target.value,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOptionValue(
                          optionIndex
                        );
                      }
                    }}
                    placeholder="Add value"
                    className="w-full rounded-[7px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#B9954F]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      addOptionValue(
                        optionIndex
                      )
                    }
                    className="rounded-[7px] bg-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#0A1B2E]"
                  >
                    Add
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* =====================================================
          ORDER-TIME OPTIONS
      ====================================================== */}

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">

        <div className="flex items-start justify-between gap-4">

          <div>

            <h2 className="text-lg font-bold text-[#0A1B2E]">
              Order-Time Options
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-[#64748B]">
              Add options that customers must choose
              before adding this product to their cart.
              For example, T-shirts can have Size and
              mugs can have Capacity.
            </p>

          </div>

          <button
            type="button"
            onClick={addOrderSelection}
            className="shrink-0 rounded-[9px] border border-[#E5E7EB] bg-[#F7F7F5] px-3 py-1.5 text-sm font-semibold text-[#0A1B2E] hover:bg-[#EFEFEA]"
          >
            + Add Option
          </button>

        </div>

        {/* No options */}
        {orderSelections.length === 0 ? (

          <div className="mt-5 rounded-[9px] border border-dashed border-[#D8DCE2] bg-[#FAFAF9] p-6 text-center">

            <p className="text-sm font-medium text-[#64748B]">
              No order-time options added.
            </p>

            <p className="mt-1 text-xs text-[#94A3B8]">
              Customers can add this product directly
              to cart.
            </p>

          </div>

        ) : (

          <div className="mt-5 space-y-4">

            {orderSelections.map(
              (selection, selectionIndex) => (

                <div
                  key={selectionIndex}
                  className="relative rounded-[10px] border border-[#E5E7EB] bg-[#FAFAF9] p-5"
                >

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() =>
                      removeOrderSelection(
                        selectionIndex
                      )
                    }
                    className="absolute right-4 top-4 text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>

                  {/* Name */}
                  <div className="max-w-sm">

                    <label className="block text-sm font-semibold text-[#0A1B2E]">
                      Option Name *
                    </label>

                    <input
                      type="text"
                      value={selection.name}
                      onChange={(e) =>
                        updateOrderSelectionName(
                          selectionIndex,
                          e.target.value
                        )
                      }
                      placeholder="Example: Size"
                      className="mt-2 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#B9954F]"
                    />

                    <p className="mt-1 text-xs text-[#94A3B8]">
                      Examples: Size, Capacity, Color,
                      Material
                    </p>

                  </div>

                  {/* Required */}
                  <label className="mt-4 flex cursor-pointer items-center gap-2">

                    <input
                      type="checkbox"
                      checked={selection.required}
                      onChange={(e) =>
                        updateOrderSelectionRequired(
                          selectionIndex,
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-[#E5E7EB]"
                    />

                    <span className="text-sm font-medium text-[#475569]">
                      Customer must select an option
                    </span>

                  </label>

                  {/* Values */}
                  <div className="mt-5">

                    <label className="block text-sm font-semibold text-[#0A1B2E]">
                      Available Values *
                    </label>

                    {selection.values.length > 0 && (

                      <div className="mt-3 flex flex-wrap gap-2">

                        {selection.values.map(
                          (value, valueIndex) => (

                            <span
                              key={valueIndex}
                              className="inline-flex items-center gap-2 rounded-full bg-[#0A1B2E] px-3 py-1.5 text-xs font-medium text-white"
                            >

                              {value}

                              <button
                                type="button"
                                onClick={() =>
                                  removeOrderSelectionValue(
                                    selectionIndex,
                                    valueIndex
                                  )
                                }
                                className="text-[#B9954F] hover:text-white"
                              >
                                ×
                              </button>

                            </span>

                          )
                        )}

                      </div>

                    )}

                    <div className="mt-3 flex max-w-md gap-2">

                      <input
                        type="text"
                        value={
                          newOrderSelectionValue[
                            selectionIndex
                          ] || ""
                        }
                        onChange={(e) =>
                          setNewOrderSelectionValue({
                            ...newOrderSelectionValue,
                            [selectionIndex]:
                              e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();

                            addOrderSelectionValue(
                              selectionIndex
                            );
                          }
                        }}
                        placeholder="Enter value, e.g. M"
                        className="w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#B9954F]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          addOrderSelectionValue(
                            selectionIndex
                          )
                        }
                        className="rounded-[8px] bg-[#0A1B2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#142C46]"
                      >
                        Add
                      </button>

                    </div>

                    {selection.values.length === 0 && (
                      <p className="mt-2 text-xs text-red-500">
                        Add at least one value.
                      </p>
                    )}

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* =====================================================
          VISIBILITY
      ====================================================== */}

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">

        <h2 className="text-lg font-bold text-[#0A1B2E]">
          Visibility
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">

          <div>

            <label className="block text-sm font-medium text-[#0A1B2E]">
              Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as
                    | "active"
                    | "inactive"
                )
              }
              className="mt-1 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#B9954F]"
            >

              <option value="active">
                Active (Visible)
              </option>

              <option value="inactive">
                Inactive (Hidden)
              </option>

            </select>

          </div>

          <div>

            <label className="block text-sm font-medium text-[#0A1B2E]">
              Featured
            </label>

            <label className="mt-2 flex cursor-pointer items-center gap-3">

              <input
                type="checkbox"
                checked={featured}
                onChange={(e) =>
                  setFeatured(
                    e.target.checked
                  )
                }
                className="h-5 w-5 rounded border-[#E5E7EB]"
              />

              <span className="text-sm font-medium text-[#64748B]">
                Yes, feature this product
              </span>

            </label>

          </div>

        </div>

      </div>

      {/* =====================================================
          ACTIONS
      ====================================================== */}

      <div className="flex items-center justify-end gap-4 border-t border-[#E5E7EB] pt-6">

        <button
          type="button"
          onClick={() =>
            router.push("/admin/products")
          }
          disabled={isSubmitting}
          className="rounded-[9px] px-5 py-2.5 text-sm font-semibold text-[#64748B] hover:bg-gray-100"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-[9px] bg-[#0A1B2E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#142C46] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Saving..."
            : isEditing
            ? "Update Product"
            : "Create Product"}
        </button>

      </div>

    </div>
  );
}