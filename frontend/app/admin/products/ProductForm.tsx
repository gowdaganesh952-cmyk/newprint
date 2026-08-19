"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi, ApiError } from "@/app/lib/api";

import {
  Category,
  Product,
  ProductOption,
  ProductOrderSelection,
  ProductPricingType,
  ProductVariant,
} from "./types";

interface ImagePreview {
  file?: File;
  previewUrl: string;
}

interface ProductFormProps {
  initialData?: Product;
}

// ============================================================
// HELPER
// Generate every possible combination of order selections.
// ============================================================

function generateVariantCombinations(
  selections: ProductOrderSelection[]
): Record<string, string>[] {
  const validSelections = selections.filter(
    (selection) =>
      selection.name.trim() &&
      selection.values.length > 0
  );

  if (validSelections.length === 0) {
    return [];
  }

  let combinations: Record<string, string>[] = [{}];

  for (const selection of validSelections) {
    const next: Record<string, string>[] = [];

    for (const combination of combinations) {
      for (const value of selection.values) {
        next.push({
          ...combination,
          [selection.name.trim()]: value,
        });
      }
    }

    combinations = next;
  }

  return combinations;
}

// ============================================================
// COMPARE SELECTIONS
// ============================================================

function selectionsMatch(
  first: Record<string, string>,
  second: Record<string, string>
) {
  const firstKeys = Object.keys(first);
  const secondKeys = Object.keys(second);

  if (firstKeys.length !== secondKeys.length) {
    return false;
  }

  return firstKeys.every(
    (key) => first[key] === second[key]
  );
}

// ============================================================
// FORMAT COMBINATION
// ============================================================

function formatCombination(
  selections: Record<string, string>
) {
  return Object.entries(selections)
    .map(([name, value]) => `${name}: ${value}`)
    .join(" • ");
}

// ============================================================
// CALCULATE DISCOUNT PERCENTAGE
// ============================================================

function calculateDiscountPercentage(
  originalPrice: number,
  sellingPrice: number
): number {
  if (
    !Number.isFinite(originalPrice) ||
    !Number.isFinite(sellingPrice) ||
    originalPrice <= 0 ||
    sellingPrice < 0 ||
    originalPrice <= sellingPrice
  ) {
    return 0;
  }

  return Math.round(
    ((originalPrice - sellingPrice) /
      originalPrice) *
      100
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function ProductForm({
  initialData,
}: ProductFormProps) {
  const router = useRouter();
  const api = useApi();

  const isEditing = !!initialData;

  // ==========================================================
  // CATEGORY
  // ==========================================================

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] =
    useState(true);
  const [categoryError, setCategoryError] = useState(false);

  // ==========================================================
  // BASIC INFORMATION
  // ==========================================================

  const [categoryId, setCategoryId] = useState(
    typeof initialData?.category === "object"
      ? (initialData.category as any)._id
      : initialData?.category || ""
  );

  const [name, setName] = useState(
    initialData?.name || ""
  );

  const [slug, setSlug] = useState(
    initialData?.slug || ""
  );

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] =
    useState(isEditing);

  const [description, setDescription] = useState(
    initialData?.description || ""
  );

  // ==========================================================
  // INTERNAL SHIPPING WEIGHT
  //
  // Stored in grams.
  // Used only for shipping calculation.
  // Never displayed to customers.
  // ==========================================================

  const [weight, setWeight] = useState<string>(
    initialData?.weight !== undefined &&
      initialData?.weight !== null
      ? String(initialData.weight)
      : ""
  );

  // ==========================================================
  // PRICING
  // ==========================================================

  const [pricingType, setPricingType] =
    useState<ProductPricingType>(
      initialData?.pricingType || "fixed"
    );

  const [originalPrice, setOriginalPrice] =
    useState<string>(
      initialData?.originalPrice !== undefined &&
        initialData?.originalPrice !== null
        ? String(initialData.originalPrice)
        : initialData?.price !== undefined &&
          initialData?.price !== null
        ? String(initialData.price)
        : ""
    );

  const [price, setPrice] = useState<string>(
    initialData?.price !== undefined &&
      initialData?.price !== null
      ? String(initialData.price)
      : ""
  );

  // ==========================================================
  // FIXED PRODUCT INVENTORY
  // ==========================================================

  const [stock, setStock] = useState<string>(
    initialData?.stock !== undefined &&
      initialData?.stock !== null
      ? String(initialData.stock)
      : "0"
  );

  const [lowStockThreshold, setLowStockThreshold] =
    useState<string>(
      initialData?.lowStockThreshold !== undefined &&
        initialData?.lowStockThreshold !== null
        ? String(initialData.lowStockThreshold)
        : "5"
    );

  // ==========================================================
  // VARIANTS
  // ==========================================================

  const [variants, setVariants] = useState<
    ProductVariant[]
  >(
    initialData?.variants?.map((variant) => {
      const sellingPrice =
        Number.isFinite(variant.price)
          ? variant.price
          : 0;

      return {
        ...variant,
        selections: { ...variant.selections },

        originalPrice:
          Number.isFinite(variant.originalPrice)
            ? variant.originalPrice
            : sellingPrice,

        price: sellingPrice,

        sku: variant.sku || "",

        stock:
          Number.isFinite(variant.stock)
            ? variant.stock
            : 0,

        lowStockThreshold:
          Number.isFinite(
            variant.lowStockThreshold
          )
            ? variant.lowStockThreshold
            : 5,

        status:
          variant.status || "active",
      };
    }) || []
  );

  // ==========================================================
  // STATUS
  // ==========================================================

  const [status, setStatus] = useState<
    "active" | "inactive"
  >(initialData?.status || "active");

  const [featured, setFeatured] = useState(
    initialData?.featured || false
  );

  // ==========================================================
  // IMAGES
  // ==========================================================

  const [images, setImages] = useState<ImagePreview[]>(
    initialData?.images?.map((url) => ({
      previewUrl: url,
    })) || []
  );

  // ==========================================================
  // PRODUCT OPTIONS
  // ==========================================================

  const [options, setOptions] = useState<ProductOption[]>(
    initialData?.options || []
  );

  const [newOptionValue, setNewOptionValue] =
    useState<Record<number, string>>({});

  // ==========================================================
  // CUSTOMER ORDER OPTIONS
  // ==========================================================

  const [orderSelections, setOrderSelections] =
    useState<ProductOrderSelection[]>(
      initialData?.orderSelections || []
    );

  const [newOrderSelectionValue, setNewOrderSelectionValue] =
    useState<Record<number, string>>({});

  // ==========================================================
  // FORM
  // ==========================================================

  const [formError, setFormError] = useState<string | null>(
    null
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================================
  // LOAD CATEGORIES
  // ==========================================================

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
        console.error(
          "Failed to load categories:",
          error
        );

        setCategoryError(true);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [api]);

  // ==========================================================
  // AUTO SLUG
  // ==========================================================

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

  // ==========================================================
  // IMAGE FUNCTIONS
  // ==========================================================

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);

    if (images.length + selectedFiles.length > 10) {
      alert("Maximum 10 images allowed.");
      return;
    }

    const newImages: ImagePreview[] =
      selectedFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));

    setImages((previous) => [
      ...previous,
      ...newImages,
    ]);

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    if (images[index]?.file) {
      URL.revokeObjectURL(images[index].previewUrl);
    }

    setImages((previous) =>
      previous.filter(
        (_, imageIndex) => imageIndex !== index
      )
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

    [
      updatedImages[index],
      updatedImages[targetIndex],
    ] = [
      updatedImages[targetIndex],
      updatedImages[index],
    ];

    setImages(updatedImages);
  };

  // ==========================================================
  // PRODUCT OPTIONS
  // ==========================================================

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
        (_, optionIndex) =>
          optionIndex !== index
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

    if (
      options[index].values.some(
        (existing) =>
          existing.toLowerCase() ===
          value.toLowerCase()
      )
    ) {
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
        values: updated[
          optionIndex
        ].values.filter(
          (_, index) => index !== valueIndex
        ),
      };

      return updated;
    });
  };

  // ==========================================================
  // ORDER SELECTIONS
  // ==========================================================

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
      orderSelections[index].values.some(
        (existing) =>
          existing.toLowerCase() ===
          value.toLowerCase()
      )
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

  // ==========================================================
  // GENERATED VARIANTS
  // ==========================================================

  const generatedCombinations = useMemo(() => {
    if (pricingType !== "variants") {
      return [];
    }

    return generateVariantCombinations(
      orderSelections
    );
  }, [orderSelections, pricingType]);

  // ==========================================================
  // GENERATE / UPDATE VARIANTS
  //
  // IMPORTANT:
  // Existing price, SKU, stock and threshold are preserved.
  // New combinations receive default stock = 0.
  // ==========================================================

  useEffect(() => {
    if (pricingType !== "variants") {
      return;
    }

    setVariants((previous) => {
      return generatedCombinations.map(
        (combination) => {
          const existing = previous.find(
            (variant) =>
              selectionsMatch(
                variant.selections,
                combination
              )
          );

          return {
            _id: existing?._id,
            selections: combination,

            originalPrice:
              existing?.originalPrice ??
              existing?.price ??
              0,

            price:
              existing?.price ?? 0,

            sku:
              existing?.sku || "",

            stock:
              existing?.stock ?? 0,

            lowStockThreshold:
              existing?.lowStockThreshold ?? 5,

            status:
              existing?.status || "active",
          };
        }
      );
    });
  }, [generatedCombinations, pricingType]);

  // ==========================================================
  // UPDATE VARIANT ORIGINAL / MRP PRICE
  // ==========================================================

  const updateVariantOriginalPrice = (
    index: number,
    value: string
  ) => {
    const numericValue =
      value === ""
        ? 0
        : Number(value);

    setVariants((previous) => {
      const updated = [...previous];

      updated[index] = {
        ...updated[index],
        originalPrice:
          Number.isFinite(numericValue) &&
          numericValue >= 0
            ? numericValue
            : 0,
      };

      return updated;
    });
  };

  // ==========================================================
  // UPDATE VARIANT PRICE
  // ==========================================================

  const updateVariantPrice = (
    index: number,
    value: string
  ) => {
    const numericValue =
      value === ""
        ? 0
        : Number(value);

    setVariants((previous) => {
      const updated = [...previous];

      updated[index] = {
        ...updated[index],
        price:
          Number.isFinite(numericValue) &&
          numericValue >= 0
            ? numericValue
            : 0,
      };

      return updated;
    });
  };

  // ==========================================================
  // UPDATE VARIANT SKU
  // ==========================================================

  const updateVariantSku = (
    index: number,
    value: string
  ) => {
    setVariants((previous) => {
      const updated = [...previous];

      updated[index] = {
        ...updated[index],
        sku: value,
      };

      return updated;
    });
  };

  // ==========================================================
  // UPDATE VARIANT STOCK
  // ==========================================================

  const updateVariantStock = (
    index: number,
    value: string
  ) => {
    const numericValue =
      value === ""
        ? 0
        : Number(value);

    if (
      !Number.isFinite(numericValue) ||
      numericValue < 0
    ) {
      return;
    }

    setVariants((previous) => {
      const updated = [...previous];

      updated[index] = {
        ...updated[index],
        stock: Math.floor(numericValue),
      };

      return updated;
    });
  };

  // ==========================================================
  // UPDATE VARIANT LOW STOCK THRESHOLD
  // ==========================================================

  const updateVariantLowStockThreshold = (
    index: number,
    value: string
  ) => {
    const numericValue =
      value === ""
        ? 0
        : Number(value);

    if (
      !Number.isFinite(numericValue) ||
      numericValue < 0
    ) {
      return;
    }

    setVariants((previous) => {
      const updated = [...previous];

      updated[index] = {
        ...updated[index],
        lowStockThreshold: Math.floor(
          numericValue
        ),
      };

      return updated;
    });
  };

  // ==========================================================
  // RESET PRICING
  // ==========================================================

  const changePricingType = (
    value: ProductPricingType
  ) => {
    setPricingType(value);

    if (value === "fixed") {
      setVariants([]);
    }
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = () => {
    if (!categoryId) {
      return "Please select a category.";
    }

    if (!name.trim()) {
      return "Product name is required.";
    }

    // ========================================================
    // SHIPPING WEIGHT
    // ========================================================

    if (
      weight === "" ||
      !/^\d+$/.test(weight) ||
      Number(weight) <= 0
    ) {
      return "Please enter a valid product weight in grams.";
    }

    // ========================================================
    // FIXED PRICING VALUES
    // ========================================================

    if (pricingType === "fixed") {
      if (originalPrice === "") {
        return "Please enter an original price.";
      }

      if (
        Number.isNaN(Number(originalPrice)) ||
        Number(originalPrice) < 0
      ) {
        return "Original price cannot be negative.";
      }

      if (price === "") {
        return "Please enter a selling price.";
      }

      if (
        Number.isNaN(Number(price)) ||
        Number(price) < 0
      ) {
        return "Selling price cannot be negative.";
      }

      if (
        Number(originalPrice) <
        Number(price)
      ) {
        return "Original price cannot be less than selling price.";
      }
    }

    // ========================================================
    // FIXED PRODUCT INVENTORY
    // ========================================================

    if (
      pricingType === "fixed" &&
      (
        stock === "" ||
        Number.isNaN(Number(stock)) ||
        Number(stock) < 0
      )
    ) {
      return "Please enter a valid stock quantity.";
    }

    if (
      pricingType === "fixed" &&
      (
        lowStockThreshold === "" ||
        Number.isNaN(
          Number(lowStockThreshold)
        ) ||
        Number(lowStockThreshold) < 0
      )
    ) {
      return "Please enter a valid low-stock threshold.";
    }

    // ========================================================
    // PRODUCT OPTIONS
    // ========================================================

    for (const option of options) {
      if (!option.name.trim()) {
        return "Product option names cannot be empty.";
      }

      if (option.values.length === 0) {
        return `Please add at least one value for product option: ${option.name}`;
      }
    }

    // ========================================================
    // ORDER SELECTIONS
    // ========================================================

    for (const selection of orderSelections) {
      if (!selection.name.trim()) {
        return "Order-time option names cannot be empty.";
      }

      if (selection.values.length === 0) {
        return `Please add at least one value for order-time option: ${selection.name}`;
      }
    }

    // ========================================================
    // VARIANT PRICING
    // ========================================================

    if (pricingType === "variants") {
      if (orderSelections.length === 0) {
        return "Add at least one order-time option before using variant pricing.";
      }

      if (generatedCombinations.length === 0) {
        return "Add values to your order-time options before setting variant prices.";
      }

      if (
        variants.length !==
        generatedCombinations.length
      ) {
        return "Please wait for the variants to generate.";
      }

      for (const variant of variants) {
        const combination =
          formatCombination(
            variant.selections
          );

        if (
          !Number.isFinite(
            variant.originalPrice
          ) ||
          (variant.originalPrice ?? 0) < 0
        ) {
          return `Enter a valid original price for ${combination}.`;
        }

        if (
          !Number.isFinite(
            variant.price
          ) ||
          variant.price < 0
        ) {
          return `Enter a valid selling price for ${combination}.`;
        }

        if (
          (variant.originalPrice ?? 0) <
          variant.price
        ) {
          return `Original price cannot be less than selling price for ${combination}.`;
        }

        if (
          !Number.isFinite(
            variant.stock
          ) ||
          variant.stock < 0
        ) {
          return `Enter a valid stock quantity for ${combination}.`;
        }

        if (
          !Number.isFinite(
            variant.lowStockThreshold
          ) ||
          (variant.lowStockThreshold ?? 0) < 0
        ) {
          return `Enter a valid low-stock threshold for ${combination}.`;
        }
      }
    }

    return null;
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async () => {
    setFormError(null);

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

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

    // ========================================================
    // INTERNAL SHIPPING WEIGHT
    // ========================================================

    formData.append(
      "weight",
      String(
        Math.floor(
          Number(weight)
        )
      )
    );

    // ========================================================
    // PRICING
    // ========================================================

    formData.append(
      "pricingType",
      pricingType
    );

    if (pricingType === "fixed") {
      formData.append(
        "originalPrice",
        originalPrice
      );

      formData.append(
        "price",
        price
      );

      formData.append(
        "stock",
        String(
          Math.floor(
            Number(stock)
          )
        )
      );

      formData.append(
        "lowStockThreshold",
        String(
          Math.floor(
            Number(lowStockThreshold)
          )
        )
      );

      formData.append(
        "variants",
        JSON.stringify([])
      );
    }

    if (pricingType === "variants") {
      formData.append(
        "originalPrice",
        ""
      );

      formData.append(
        "price",
        ""
      );

      formData.append(
        "variants",
        JSON.stringify(
          variants.map(
            (variant) => ({
              ...variant,

              originalPrice:
                Number(
                  variant.originalPrice ?? 0
                ),

              price:
                Number(
                  variant.price ?? 0
                ),

              stock:
                Math.floor(
                  Number(
                    variant.stock
                  ) || 0
                ),

              lowStockThreshold:
                Math.floor(
                  Number(
                    variant.lowStockThreshold
                  ) || 0
                ),
            })
          )
        )
      );

      // Variant products don't use
      // product-level stock.
      formData.append(
        "stock",
        "0"
      );

      formData.append(
        "lowStockThreshold",
        "0"
      );
    }
    // ========================================================
    // OTHER DATA
    // ========================================================

    formData.append(
      "status",
      status
    );

    formData.append(
      "featured",
      featured ? "true" : "false"
    );

    formData.append(
      "options",
      JSON.stringify(options)
    );

    formData.append(
      "orderSelections",
      JSON.stringify(orderSelections)
    );

    // ========================================================
    // IMAGES
    // ========================================================

    images.forEach((image) => {
      if (image.file) {
        formData.append(
          "images",
          image.file
        );
      }
    });

    // ========================================================
    // API
    // ========================================================

    try {
      setIsSubmitting(true);

      if (
        isEditing &&
        initialData
      ) {
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

  // ==========================================================
  // LOADING
  // ==========================================================

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

  // ==========================================================
  // CATEGORY ERROR
  // ==========================================================

  if (categoryError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-[12px] border border-red-200 bg-red-50 p-8 text-center text-red-700">
        <p>
          Unable to load categories.
        </p>
      </div>
    );
  }

  // ==========================================================
  // NO CATEGORIES
  // ==========================================================

  if (categories.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-[12px] border border-dashed border-[#E5E7EB] bg-white p-8 text-center">
        <h3 className="text-sm font-semibold text-[#0A1B2E]">
          No active categories available.
        </h3>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/categories"
            )
          }
          className="mt-6 rounded-[9px] bg-[#0A1B2E] px-4 py-2 text-sm font-semibold text-white"
        >
          Go to Categories
        </button>
      </div>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">

      {/* ======================================================
          ERROR
      ======================================================= */}

      {formError && (
        <div className="rounded-[9px] border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {formError}
        </div>
      )}

      {/* ======================================================
          CATEGORY
      ======================================================= */}

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

          {categories.map(
            (category) => (
              <option
                key={category._id}
                value={category._id}
              >
                {category.name}
              </option>
            )
          )}
        </select>

      </div>

      {/* ======================================================
          BASIC INFORMATION
      ======================================================= */}

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
                placeholder="Example: Custom Printed T-Shirt"
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
                placeholder="custom-printed-t-shirt"
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
                setDescription(
                  e.target.value
                )
              }
              placeholder="Describe the product..."
              className="mt-1 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#B9954F]"
            />

          </div>

          {/* ==================================================
              INTERNAL SHIPPING WEIGHT
          =================================================== */}

          <div>

            <label className="block text-sm font-medium text-[#0A1B2E]">
              Product Weight *
            </label>

            <div className="mt-2 flex w-full overflow-hidden rounded-[9px] border border-[#E5E7EB] bg-white focus-within:border-[#B9954F]">

              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={weight}
                onChange={(e) => {
                  const value = e.target.value;

                  if (
                    value === "" ||
                    /^\d+$/.test(value)
                  ) {
                    setWeight(value);
                  }
                }}
                placeholder="Example: 250"
                className="
                  min-w-0
                  flex-1
                  bg-transparent
                  px-3
                  py-2.5
                  text-sm
                  font-semibold
                  text-[#0A1B2E]
                  outline-none
                  placeholder:text-[#94A3B8]
                "
              />

              <span
                className="
                  flex
                  shrink-0
                  items-center
                  border-l
                  border-[#E5E7EB]
                  bg-[#F7F7F5]
                  px-3
                  text-xs
                  font-semibold
                  text-[#64748B]
                  sm:px-4
                  sm:text-sm
                "
              >
                grams
              </span>

            </div>

            <p className="mt-2 text-xs leading-5 text-[#94A3B8]">
              Used internally to calculate shipping charges.
              Customers will not see the product weight.
            </p>

          </div>

        </div>

      </div>

      {/* ======================================================
          PRICING
      ======================================================= */}

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">

        <div>

          <h2 className="text-lg font-bold text-[#0A1B2E]">
            Pricing
          </h2>

          <p className="mt-1 text-sm text-[#64748B]">
            Choose whether this product has one price
            or different prices based on customer
            selections.
          </p>

        </div>

        {/* PRICING TYPE */}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

          {/* FIXED */}

          <button
            type="button"
            onClick={() =>
              changePricingType("fixed")
            }
            className={`rounded-[10px] border p-4 text-left transition ${
              pricingType === "fixed"
                ? "border-[#B9954F] bg-[#B9954F]/5 ring-1 ring-[#B9954F]"
                : "border-[#E5E7EB] bg-white hover:border-[#CBD5E1]"
            }`}
          >

            <div className="flex items-start gap-3">

              <div
                className={`mt-0.5 h-4 w-4 rounded-full border-2 ${
                  pricingType === "fixed"
                    ? "border-[#B9954F] bg-[#B9954F]"
                    : "border-[#CBD5E1]"
                }`}
              />

              <div>

                <p className="text-sm font-bold text-[#0A1B2E]">
                  Single Price
                </p>

                <p className="mt-1 text-xs leading-5 text-[#64748B]">
                  One price for the entire product.
                  Options can still exist.
                </p>

              </div>

            </div>

          </button>

          {/* VARIANTS */}

          <button
            type="button"
            onClick={() =>
              changePricingType(
                "variants"
              )
            }
            className={`rounded-[10px] border p-4 text-left transition ${
              pricingType === "variants"
                ? "border-[#B9954F] bg-[#B9954F]/5 ring-1 ring-[#B9954F]"
                : "border-[#E5E7EB] bg-white hover:border-[#CBD5E1]"
            }`}
          >

            <div className="flex items-start gap-3">

              <div
                className={`mt-0.5 h-4 w-4 rounded-full border-2 ${
                  pricingType === "variants"
                    ? "border-[#B9954F] bg-[#B9954F]"
                    : "border-[#CBD5E1]"
                }`}
              />

              <div>

                <p className="text-sm font-bold text-[#0A1B2E]">
                  Price varies by options
                </p>

                <p className="mt-1 text-xs leading-5 text-[#64748B]">
                  Different selections can have
                  different prices.
                </p>

              </div>

            </div>

          </button>

        </div>

        {/* ====================================================
            FIXED PRICE
        ===================================================== */}

        {pricingType === "fixed" && (
          <div className="mt-5">

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* ORIGINAL PRICE */}

              <div>
                <label className="block text-sm font-semibold text-[#0A1B2E]">
                  Original Price / MRP *
                </label>

                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#64748B]">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={originalPrice}
                    onChange={(e) =>
                      setOriginalPrice(
                        e.target.value
                      )
                    }
                    placeholder="1999"
                    className="w-full rounded-[9px] border border-[#E5E7EB] py-2.5 pl-8 pr-3 text-sm outline-none focus:border-[#B9954F]"
                  />
                </div>

                <p className="mt-1.5 text-xs text-[#94A3B8]">
                  Price before discount.
                </p>
              </div>

              {/* SELLING PRICE */}

              <div>
                <label className="block text-sm font-semibold text-[#0A1B2E]">
                  Selling Price *
                </label>

                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#64748B]">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) =>
                      setPrice(
                        e.target.value
                      )
                    }
                    placeholder="486"
                    className="w-full rounded-[9px] border border-[#E5E7EB] py-2.5 pl-8 pr-3 text-sm outline-none focus:border-[#B9954F]"
                  />
                </div>

                <p className="mt-1.5 text-xs text-[#94A3B8]">
                  Actual price charged to the customer.
                </p>
              </div>

            </div>

            {/* DISCOUNT PREVIEW */}

            {Number(originalPrice) > Number(price) &&
              Number(price) >= 0 &&
              originalPrice !== "" &&
              price !== "" && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[10px] border border-[#E5E7EB] bg-[#FAFAF8] p-4">

                  <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-extrabold text-green-700">
                    {calculateDiscountPercentage(
                      Number(originalPrice),
                      Number(price)
                    )}% OFF
                  </span>

                  <span className="text-sm text-[#94A3B8] line-through">
                    ₹{Number(
                      originalPrice
                    ).toLocaleString("en-IN")}
                  </span>

                  <span className="text-lg font-extrabold text-[#0A1B2E]">
                    ₹{Number(
                      price
                    ).toLocaleString("en-IN")}
                  </span>

                </div>
              )}

            {orderSelections.length > 0 && (
              <p className="mt-3 text-xs leading-5 text-[#64748B]">
                All customer selections will use
                this same price.
              </p>
            )}

          </div>
        )}

        {/* ====================================================
            VARIANT PRICING
        ===================================================== */}

        {pricingType === "variants" && (
          <div className="mt-5">

            {orderSelections.length === 0 ? (

              <div className="rounded-[10px] border border-dashed border-[#D8DCE2] bg-[#FAFAF9] p-6 text-center">

                <p className="text-sm font-semibold text-[#0A1B2E]">
                  Add customer options first
                </p>

                <p className="mt-1 text-xs leading-5 text-[#64748B]">
                  Add options such as Size,
                  Capacity, Color, or Material
                  in the Order-Time Options
                  section below.
                </p>

              </div>

            ) : generatedCombinations.length === 0 ? (

              <div className="rounded-[10px] border border-amber-200 bg-amber-50 p-5">

                <p className="text-sm font-semibold text-amber-800">
                  Add values to your
                  order-time options.
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  Variant prices and inventory
                  will automatically appear
                  once the options have values.
                </p>

              </div>

            ) : (

              <div>

                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <h3 className="text-sm font-bold text-[#0A1B2E]">
                      Variant Pricing & Inventory
                    </h3>

                    <p className="mt-1 text-xs text-[#64748B]">
                      Set price, SKU, stock and
                      low-stock alert for every
                      customer selection.
                    </p>

                  </div>

                  <span className="w-fit rounded-full bg-[#F7F7F5] px-3 py-1 text-xs font-semibold text-[#64748B]">
                    {variants.length}{" "}
                    {variants.length === 1
                      ? "combination"
                      : "combinations"}
                  </span>

                </div>

                <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB]">

                  {/* DESKTOP HEADER */}

                  <div className="hidden grid-cols-[1fr_120px_120px_120px_100px] gap-3 bg-[#F7F7F5] px-4 py-3 lg:grid">

                    <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#64748B]">
                      Selection
                    </div>

                    <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#64748B]">
                      Original
                    </div>

                    <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#64748B]">
                      Selling
                    </div>

                    <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#64748B]">
                      SKU
                    </div>

                    <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#64748B]">
                      Stock
                    </div>

                  </div>

                  <div className="divide-y divide-[#E5E7EB]">

                    {variants.map(
                      (variant, index) => (

                        <div
                          key={`${formatCombination(
                            variant.selections
                          )}-${index}`}
                          className="grid grid-cols-1 gap-4 px-4 py-5 lg:grid-cols-[1fr_120px_120px_120px_100px] lg:items-start lg:gap-3"
                        >

                          {/* SELECTION */}

                          <div>

                            <p className="text-sm font-semibold text-[#0A1B2E]">
                              {formatCombination(
                                variant.selections
                              )}
                            </p>

                            <div className="mt-2 flex items-center gap-2">

                              <span
                                className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                                  variant.stock === 0
                                    ? "bg-red-100 text-red-700"
                                    : variant.stock <=
                                      (variant.lowStockThreshold ??
                                        5)
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {variant.stock === 0
                                  ? "Out of Stock"
                                  : variant.stock <=
                                    (variant.lowStockThreshold ??
                                      5)
                                  ? "Low Stock"
                                  : "In Stock"}
                              </span>

                              <span className="text-[11px] text-[#94A3B8]">
                                {variant.stock} available
                              </span>

                            </div>

                          </div>

                          {/* ORIGINAL PRICE */}

                          <div>

                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                              Original
                            </label>

                            <div className="relative">

                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#64748B]">
                                ₹
                              </span>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  variant.originalPrice === 0
                                    ? ""
                                    : variant.originalPrice ?? ""
                                }
                                onChange={(e) =>
                                  updateVariantOriginalPrice(
                                    index,
                                    e.target.value
                                  )
                                }
                                placeholder="1999"
                                className="w-full rounded-[8px] border border-[#E5E7EB] py-2 pl-8 pr-3 text-sm font-semibold outline-none focus:border-[#B9954F]"
                              />

                            </div>

                            {calculateDiscountPercentage(
                              Number(
                                variant.originalPrice ?? 0
                              ),
                              Number(
                                variant.price ?? 0
                              )
                            ) > 0 && (
                              <span className="mt-1.5 inline-flex rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-extrabold text-green-700">
                                {calculateDiscountPercentage(
                                  Number(
                                    variant.originalPrice ?? 0
                                  ),
                                  Number(
                                    variant.price ?? 0
                                  )
                                )}% OFF
                              </span>
                            )}

                          </div>

                          {/* SELLING PRICE */}

                          <div>

                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                              Selling
                            </label>

                            <div className="relative">

                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#64748B]">
                                ₹
                              </span>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  variant.price === 0
                                    ? ""
                                    : variant.price
                                }
                                onChange={(e) =>
                                  updateVariantPrice(
                                    index,
                                    e.target.value
                                  )
                                }
                                placeholder="486"
                                className="w-full rounded-[8px] border border-[#E5E7EB] py-2 pl-8 pr-3 text-sm font-semibold outline-none focus:border-[#B9954F]"
                              />

                            </div>

                          </div>

                          {/* SKU */}

                          <div>

                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                              SKU
                            </label>

                            <input
                              type="text"
                              value={
                                variant.sku || ""
                              }
                              onChange={(e) =>
                                updateVariantSku(
                                  index,
                                  e.target.value
                                )
                              }
                              placeholder="TS-BLK-M"
                              className="w-full rounded-[8px] border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#B9954F]"
                            />

                          </div>

                          {/* STOCK */}

                          <div>

                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                              Stock
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={
                                variant.stock
                              }
                              onChange={(e) =>
                                updateVariantStock(
                                  index,
                                  e.target.value
                                )
                              }
                              className="w-full rounded-[8px] border border-[#E5E7EB] px-3 py-2 text-sm font-semibold outline-none focus:border-[#B9954F]"
                            />

                            <label className="mb-1 mt-3 block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                              Low Stock At
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={
                                variant.lowStockThreshold ??
                                5
                              }
                              onChange={(e) =>
                                updateVariantLowStockThreshold(
                                  index,
                                  e.target.value
                                )
                              }
                              className="w-full rounded-[8px] border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#B9954F]"
                            />

                          </div>

                        </div>

                      )
                    )}

                  </div>

                </div>

              </div>

            )}

          </div>
        )}

      </div>

      {/* ======================================================
          FIXED PRODUCT INVENTORY
      ======================================================= */}

      {pricingType === "fixed" && (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">

          <div>

            <h2 className="text-lg font-bold text-[#0A1B2E]">
              Inventory
            </h2>

            <p className="mt-1 text-sm leading-5 text-[#64748B]">
              Set the available quantity for this
              product. Later, use the Inventory page
              to add or remove stock without changing
              the original product information.
            </p>

          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">

            {/* STOCK */}

            <div>

              <label className="block text-sm font-semibold text-[#0A1B2E]">
                Initial Stock *
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => {
                  const value =
                    e.target.value;

                  if (
                    value === "" ||
                    (/^\d+$/.test(value) &&
                      Number(value) >= 0)
                  ) {
                    setStock(value);
                  }
                }}
                placeholder="20"
                className="mt-2 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#B9954F]"
              />

              <p className="mt-2 text-xs text-[#94A3B8]">
                Example: 20 units available.
              </p>

            </div>

            {/* LOW STOCK */}

            <div>

              <label className="block text-sm font-semibold text-[#0A1B2E]">
                Low Stock Alert
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={lowStockThreshold}
                onChange={(e) => {
                  const value =
                    e.target.value;

                  if (
                    value === "" ||
                    (/^\d+$/.test(value) &&
                      Number(value) >= 0)
                  ) {
                    setLowStockThreshold(
                      value
                    );
                  }
                }}
                placeholder="5"
                className="mt-2 w-full rounded-[9px] border border-[#E5E7EB] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#B9954F]"
              />

              <p className="mt-2 text-xs text-[#94A3B8]">
                Show a low-stock warning when
                stock reaches this number.
              </p>

            </div>

          </div>

          {/* STOCK PREVIEW */}

          <div className="mt-5 rounded-[10px] border border-[#E5E7EB] bg-[#FAFAF9] p-4">

            <div className="flex items-center justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Current Availability
                </p>

                <p className="mt-1 text-2xl font-bold text-[#0A1B2E]">
                  {stock || 0}
                </p>

              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  Number(stock || 0) === 0
                    ? "bg-red-100 text-red-700"
                    : Number(stock || 0) <=
                      Number(
                        lowStockThreshold || 0
                      )
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {Number(stock || 0) === 0
                  ? "Out of Stock"
                  : Number(stock || 0) <=
                    Number(
                      lowStockThreshold || 0
                    )
                  ? "Low Stock"
                  : "In Stock"}
              </span>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          IMAGES
      ======================================================= */}

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
            disabled={
              images.length >= 10
            }
          />

        </label>

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

            {images.map(
              (image, index) => (
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
                        removeImage(
                          index
                        )
                      }
                      className="self-end rounded-full bg-white px-2 py-1 text-sm text-red-600"
                    >
                      ✕
                    </button>

                    <div className="flex justify-between">

                      <button
                        type="button"
                        onClick={() =>
                          moveImage(
                            index,
                            "left"
                          )
                        }
                        disabled={
                          index === 0
                        }
                        className="rounded bg-white px-2 py-1 text-xs disabled:opacity-40"
                      >
                        ←
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          moveImage(
                            index,
                            "right"
                          )
                        }
                        disabled={
                          index ===
                          images.length - 1
                        }
                        className="rounded bg-white px-2 py-1 text-xs disabled:opacity-40"
                      >
                        →
                      </button>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

      {/* ======================================================
          PRODUCT OPTIONS
      ======================================================= */}

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between gap-4">

          <div>

            <h2 className="text-lg font-bold text-[#0A1B2E]">
              Product Options
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              General product information such as
              material, finish, or style.
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

          {options.map(
            (option, optionIndex) => (
              <div
                key={optionIndex}
                className="relative rounded-[9px] border border-[#E5E7EB] bg-gray-50/50 p-4"
              >

                <button
                  type="button"
                  onClick={() =>
                    removeOption(
                      optionIndex
                    )
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
                        (
                          value,
                          valueIndex
                        ) => (
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
                        if (
                          e.key ===
                          "Enter"
                        ) {
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
            )
          )}

        </div>

      </div>

      {/* ======================================================
          ORDER-TIME OPTIONS
      ======================================================= */}

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">

        <div className="flex items-start justify-between gap-4">

          <div>

            <h2 className="text-lg font-bold text-[#0A1B2E]">
              Order-Time Options
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-[#64748B]">
              Options customers choose before adding
              the product to their cart.
            </p>

          </div>

          <button
            type="button"
            onClick={
              addOrderSelection
            }
            className="shrink-0 rounded-[9px] border border-[#E5E7EB] bg-[#F7F7F5] px-3 py-1.5 text-sm font-semibold text-[#0A1B2E] hover:bg-[#EFEFEA]"
          >
            + Add Option
          </button>

        </div>

        {orderSelections.length === 0 ? (

          <div className="mt-5 rounded-[9px] border border-dashed border-[#D8DCE2] bg-[#FAFAF9] p-6 text-center">

            <p className="text-sm font-medium text-[#64748B]">
              No order-time options added.
            </p>

            <p className="mt-1 text-xs text-[#94A3B8]">
              Customers can add this product
              directly to cart.
            </p>

          </div>

        ) : (

          <div className="mt-5 space-y-4">

            {orderSelections.map(
              (
                selection,
                selectionIndex
              ) => (

                <div
                  key={selectionIndex}
                  className="relative rounded-[10px] border border-[#E5E7EB] bg-[#FAFAF9] p-5"
                >

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

                  <div className="max-w-sm">

                    <label className="block text-sm font-semibold text-[#0A1B2E]">
                      Option Name *
                    </label>

                    <input
                      type="text"
                      value={
                        selection.name
                      }
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
                      Examples: Size,
                      Capacity, Color,
                      Material
                    </p>

                  </div>

                  <label className="mt-4 flex cursor-pointer items-center gap-2">

                    <input
                      type="checkbox"
                      checked={
                        selection.required
                      }
                      onChange={(e) =>
                        updateOrderSelectionRequired(
                          selectionIndex,
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-[#E5E7EB]"
                    />

                    <span className="text-sm font-medium text-[#475569]">
                      Customer must select
                      an option
                    </span>

                  </label>

                  <div className="mt-5">

                    <label className="block text-sm font-semibold text-[#0A1B2E]">
                      Available Values *
                    </label>

                    {selection.values.length >
                      0 && (

                      <div className="mt-3 flex flex-wrap gap-2">

                        {selection.values.map(
                          (
                            value,
                            valueIndex
                          ) => (

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
                          setNewOrderSelectionValue(
                            {
                              ...newOrderSelectionValue,
                              [selectionIndex]:
                                e.target.value,
                            }
                          )
                        }
                        onKeyDown={(e) => {
                          if (
                            e.key ===
                            "Enter"
                          ) {
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

                    {selection.values.length ===
                      0 && (
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

      {/* ======================================================
          VISIBILITY
      ======================================================= */}

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

      {/* ======================================================
          ACTIONS
      ======================================================= */}

      <div className="flex items-center justify-end gap-4 border-t border-[#E5E7EB] pt-6">

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/products"
            )
          }
          disabled={isSubmitting}
          className="rounded-[9px] px-5 py-2.5 text-sm font-semibold text-[#64748B] hover:bg-gray-100"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={
            handleSubmit
          }
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