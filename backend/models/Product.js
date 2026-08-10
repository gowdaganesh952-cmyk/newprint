import mongoose from "mongoose";

// ============================================================
// GENERAL PRODUCT OPTION
// Example:
// Material -> Cotton, Polyester
// Finish -> Matte, Glossy
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
//
// Example:
// Size -> S, M, L, XL
// Capacity -> 250ml, 500ml
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
// Only used when pricingType = "variants".
//
// Example:
//
// {
//     selections: {
//         Capacity: "250ml"
//     },
//     price: 150
// }
//
// {
//     selections: {
//         Capacity: "500ml"
//     },
//     price: 200
// }
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

        price: {
            type: Number,
            required: true,
            min: [0, "Variant price cannot be negative"],
        },

        sku: {
            type: String,
            trim: true,
            default: "",
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
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
            required: [true, "Product category is required"],
        },

        // ------------------------------------------------------
        // BASIC INFORMATION
        // ------------------------------------------------------

        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },

        slug: {
            type: String,
            required: [true, "Product slug is required"],
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
        // FIXED PRICE
        //
        // Used when pricingType = "fixed".
        //
        // Example:
        // Keychain -> ₹99
        // Mug -> ₹199
        // ------------------------------------------------------

        price: {
            type: Number,
            min: [0, "Price cannot be negative"],
            default: null,
        },

        // ------------------------------------------------------
        // PRICING TYPE
        //
        // fixed:
        // One price regardless of selection.
        //
        // variants:
        // Price depends on customer selection.
        // ------------------------------------------------------

        pricingType: {
            type: String,
            enum: ["fixed", "variants"],
            default: "fixed",
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
                message: "Exceeds the limit of 10 images",
            },
            default: [],
        },

        // ------------------------------------------------------
        // GENERAL PRODUCT OPTIONS
        // ------------------------------------------------------

        options: {
            type: [productOptionSchema],
            default: [],
        },

        // ------------------------------------------------------
        // CUSTOMER ORDER OPTIONS
        // ------------------------------------------------------

        orderSelections: {
            type: [productOrderSelectionSchema],
            default: [],
        },

        // ------------------------------------------------------
        // PRICE VARIANTS
        // ------------------------------------------------------

        variants: {
            type: [productVariantSchema],
            default: [],
        },

        // ------------------------------------------------------
        // STATUS
        // ------------------------------------------------------

        status: {
            type: String,
            enum: ["active", "inactive"],
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

export default mongoose.model("Product", productSchema);