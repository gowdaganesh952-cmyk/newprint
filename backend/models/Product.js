import mongoose from "mongoose";

// ============================================================
// GENERAL PRODUCT OPTION
// ============================================================

const productOptionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        values: [
            {
                type: String,
                required: true,
                trim: true,
            },
        ],
    },
    {
        _id: false,
    }
);

// ============================================================
// CUSTOMER ORDER SELECTION
// ============================================================

const productOrderSelectionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        values: [
            {
                type: String,
                required: true,
                trim: true,
            },
        ],

        required: {
            type: Boolean,
            default: true,
        },
    },
    {
        _id: false,
    }
);

// ============================================================
// PRODUCT VARIANT
//
// Example:
//
// Size: M
// Color: Black
// Original Price: ₹1,999
// Selling Price: ₹486
// SKU: TS-BLK-M
// Stock: 20
// Low Stock: 5
// ============================================================

const productVariantSchema = new mongoose.Schema(
    {
        selections: {
            type: Map,
            of: {
                type: String,
                trim: true,
            },
            required: true,
        },

        // ------------------------------------------------------
        // ORIGINAL / MRP PRICE
        //
        // Example:
        // originalPrice = 1999
        // price         = 486
        //
        // Discount percentage will be calculated on frontend
        // and backend from these two values.
        // ------------------------------------------------------

        originalPrice: {
            type: Number,
            min: [
                0,
                "Original price cannot be negative",
            ],
            default: null,
        },

        // ------------------------------------------------------
        // CURRENT SELLING PRICE
        // ------------------------------------------------------

        price: {
            type: Number,
            required: true,
            min: [
                0,
                "Variant price cannot be negative",
            ],
        },

        // ------------------------------------------------------
        // SKU
        // ------------------------------------------------------

        sku: {
            type: String,
            trim: true,
            default: "",
        },

        // ------------------------------------------------------
        // CURRENT AVAILABLE STOCK
        // ------------------------------------------------------

        stock: {
            type: Number,
            required: true,
            min: [
                0,
                "Variant stock cannot be negative",
            ],
            default: 0,
            validate: {
                validator: Number.isInteger,
                message:
                    "Variant stock must be a whole number",
            },
        },

        // ------------------------------------------------------
        // LOW STOCK WARNING
        // ------------------------------------------------------

        lowStockThreshold: {
            type: Number,
            min: [
                0,
                "Low stock threshold cannot be negative",
            ],
            default: 5,
            validate: {
                validator: Number.isInteger,
                message:
                    "Low stock threshold must be a whole number",
            },
        },

        // ------------------------------------------------------
        // STATUS
        // ------------------------------------------------------

        status: {
            type: String,
            enum: [
                "active",
                "inactive",
            ],
            default: "active",
        },
    },
    {
        _id: true,
    }
);

// ============================================================
// PRODUCT
// ============================================================

const productSchema = new mongoose.Schema(
    {
        // ------------------------------------------------------
        // CATEGORY
        // ------------------------------------------------------

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: [
                true,
                "Product category is required",
            ],
        },

        // ------------------------------------------------------
        // BASIC INFORMATION
        // ------------------------------------------------------

        name: {
            type: String,
            required: [
                true,
                "Product name is required",
            ],
            trim: true,
        },

        slug: {
            type: String,
            required: [
                true,
                "Product slug is required",
            ],
            unique: true,
            lowercase: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        // ------------------------------------------------------
        // ORIGINAL / MRP PRICE
        //
        // Used for displaying discounts.
        //
        // Example:
        //
        // originalPrice: 1999
        // price: 486
        //
        // Website:
        //
        // ↓76%  ₹1,999  ₹486
        //
        // If originalPrice is null or equal to price,
        // no discount will be displayed.
        // ------------------------------------------------------

        originalPrice: {
            type: Number,
            min: [
                0,
                "Original price cannot be negative",
            ],
            default: null,
        },

        // ------------------------------------------------------
        // CURRENT SELLING PRICE
        //
        // Used for actual cart/order calculations.
        // ------------------------------------------------------

        price: {
            type: Number,
            min: [
                0,
                "Price cannot be negative",
            ],
            default: null,
        },

        // ------------------------------------------------------
        // PRICING TYPE
        // ------------------------------------------------------

        pricingType: {
            type: String,
            enum: [
                "fixed",
                "variants",
            ],
            default: "fixed",
        },

        // ------------------------------------------------------
        // FIXED PRODUCT STOCK
        //
        // Used only when pricingType = "fixed".
        // ------------------------------------------------------

        stock: {
            type: Number,
            min: [
                0,
                "Product stock cannot be negative",
            ],
            default: 0,
            validate: {
                validator: Number.isInteger,
                message:
                    "Product stock must be a whole number",
            },
        },

        // ------------------------------------------------------
        // FIXED PRODUCT LOW STOCK THRESHOLD
        // ------------------------------------------------------

        lowStockThreshold: {
            type: Number,
            min: [
                0,
                "Low stock threshold cannot be negative",
            ],
            default: 5,
            validate: {
                validator: Number.isInteger,
                message:
                    "Low stock threshold must be a whole number",
            },
        },

        // ------------------------------------------------------
        // IMAGES
        // ------------------------------------------------------

        images: {
            type: [String],

            validate: {
                validator: function (value) {
                    return value.length <= 10;
                },

                message:
                    "Exceeds the limit of 10 images",
            },

            default: [],
        },

        // ------------------------------------------------------
        // GENERAL PRODUCT OPTIONS
        // ------------------------------------------------------

        options: {
            type: [
                productOptionSchema,
            ],
            default: [],
        },

        // ------------------------------------------------------
        // CUSTOMER ORDER OPTIONS
        // ------------------------------------------------------

        orderSelections: {
            type: [
                productOrderSelectionSchema,
            ],
            default: [],
        },

        // ------------------------------------------------------
        // PRICE + STOCK VARIANTS
        // ------------------------------------------------------

        variants: {
            type: [
                productVariantSchema,
            ],
            default: [],
        },

        // ------------------------------------------------------
        // STATUS
        // ------------------------------------------------------

        status: {
            type: String,
            enum: [
                "active",
                "inactive",
            ],
            default: "active",
        },

        // ------------------------------------------------------
        // FEATURED
        // ------------------------------------------------------

        featured: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// ============================================================
// EXPORT MODEL
// ============================================================

export default mongoose.model(
    "Product",
    productSchema
);