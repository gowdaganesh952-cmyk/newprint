import mongoose from "mongoose";

// ============================================================
// GENERAL PRODUCT OPTION
// ============================================================

const productOptionSchema =
    new mongoose.Schema(
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

const productOrderSelectionSchema =
    new mongoose.Schema(
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
// ============================================================

const productVariantSchema =
    new mongoose.Schema(
        {
            selections: {
                type: Map,
                of: {
                    type: String,
                    trim: true,
                },
                required: true,
            },

            // --------------------------------------------------
            // ORIGINAL / MRP PRICE
            // --------------------------------------------------

            originalPrice: {
                type: Number,

                min: [
                    0,
                    "Original price cannot be negative",
                ],

                default: null,
            },

            // --------------------------------------------------
            // CURRENT SELLING PRICE
            // --------------------------------------------------

            price: {
                type: Number,

                required: true,

                min: [
                    0,
                    "Variant price cannot be negative",
                ],
            },

            // --------------------------------------------------
            // SKU
            // --------------------------------------------------

            sku: {
                type: String,

                trim: true,

                default: "",
            },

            // --------------------------------------------------
            // INVENTORY
            //
            // IMPORTANT:
            // Inventory is NOT managed by ProductForm.
            //
            // These fields remain in the database because
            // the separate inventory/order system uses them.
            // --------------------------------------------------

            stock: {
                type: Number,

                required: true,

                min: [
                    0,
                    "Variant stock cannot be negative",
                ],

                default: 0,

                validate: {
                    validator:
                        Number.isInteger,

                    message:
                        "Variant stock must be a whole number",
                },
            },

            lowStockThreshold: {
                type: Number,

                min: [
                    0,
                    "Low stock threshold cannot be negative",
                ],

                default: 5,

                validate: {
                    validator:
                        Number.isInteger,

                    message:
                        "Low stock threshold must be a whole number",
                },
            },

            // --------------------------------------------------
            // STATUS
            // --------------------------------------------------

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

const productSchema =
    new mongoose.Schema(
        {
            // --------------------------------------------------
            // CATEGORY
            // --------------------------------------------------

            category: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "Category",

                required: [
                    true,
                    "Product category is required",
                ],
            },

            // --------------------------------------------------
            // BASIC INFORMATION
            // --------------------------------------------------

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

            // ==================================================
            // INTERNAL SHIPPING WEIGHT
            // ==================================================

            weight: {
                type: Number,

                required: true,

                min: [
                    1,
                    "Product weight must be greater than 0 grams",
                ],

                validate: {
                    validator:
                        Number.isInteger,

                    message:
                        "Product weight must be a whole number of grams",
                },

                default: 100,
            },

            // --------------------------------------------------
            // ORIGINAL / MRP PRICE
            // --------------------------------------------------

            originalPrice: {
                type: Number,

                min: [
                    0,
                    "Original price cannot be negative",
                ],

                default: null,
            },

            // --------------------------------------------------
            // CURRENT SELLING PRICE
            // --------------------------------------------------

            price: {
                type: Number,

                min: [
                    0,
                    "Price cannot be negative",
                ],

                default: null,
            },

            // --------------------------------------------------
            // PRICING TYPE
            // --------------------------------------------------

            pricingType: {
                type: String,

                enum: [
                    "fixed",
                    "variants",
                ],

                default: "fixed",
            },

            // ==================================================
            // INVENTORY
            //
            // IMPORTANT:
            //
            // These fields are intentionally kept.
            //
            // ProductForm no longer manages them.
            //
            // They are used by the separate inventory/order
            // system and payment verification.
            // ==================================================

            stock: {
                type: Number,

                min: [
                    0,
                    "Product stock cannot be negative",
                ],

                default: 0,

                validate: {
                    validator:
                        Number.isInteger,

                    message:
                        "Product stock must be a whole number",
                },
            },

            lowStockThreshold: {
                type: Number,

                min: [
                    0,
                    "Low stock threshold cannot be negative",
                ],

                default: 5,

                validate: {
                    validator:
                        Number.isInteger,

                    message:
                        "Low stock threshold must be a whole number",
                },
            },

            // --------------------------------------------------
            // IMAGES
            // --------------------------------------------------

            images: {
                type: [String],

                validate: {
                    validator:
                        function (
                            value
                        ) {
                            return (
                                value.length <=
                                10
                            );
                        },

                    message:
                        "Exceeds the limit of 10 images",
                },

                default: [],
            },

            // --------------------------------------------------
            // GENERAL PRODUCT OPTIONS
            // --------------------------------------------------

            options: {
                type: [
                    productOptionSchema,
                ],

                default: [],
            },

            // --------------------------------------------------
            // CUSTOMER ORDER OPTIONS
            // --------------------------------------------------

            orderSelections: {
                type: [
                    productOrderSelectionSchema,
                ],

                default: [],
            },

            // --------------------------------------------------
            // PRICE + INVENTORY VARIANTS
            // --------------------------------------------------

            variants: {
                type: [
                    productVariantSchema,
                ],

                default: [],
            },

            // ==================================================
            // RELATED PRODUCTS
            //
            // Stores references to other Product documents.
            //
            // Example:
            //
            // relatedProducts: [
            //     productId1,
            //     productId2,
            // ]
            //
            // The same product cannot appear twice.
            // ==================================================

            relatedProducts: [
                {
                    type:
                        mongoose.Schema.Types.ObjectId,

                    ref: "Product",
                },
            ],

            // --------------------------------------------------
            // STATUS
            // --------------------------------------------------

            status: {
                type: String,

                enum: [
                    "active",
                    "inactive",
                ],

                default: "active",
            },

            // --------------------------------------------------
            // FEATURED
            // --------------------------------------------------

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
// RELATED PRODUCTS INDEX
//
// Helps queries involving related products.
//
// Not unique because multiple products can reference the
// same related product.
// ============================================================

productSchema.index({
    relatedProducts: 1,
});

// ============================================================
// EXPORT MODEL
// ============================================================

export default mongoose.model(
    "Product",
    productSchema
);