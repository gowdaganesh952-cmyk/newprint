import mongoose from "mongoose";

import Product from "../models/Product.js";

/* ============================================================
   HELPERS
============================================================ */

function isValidWholeNumber(value) {
    return (
        Number.isInteger(value) &&
        value >= 0
    );
}

function normalizeStock(value) {
    const number =
        typeof value === "number"
            ? value
            : Number(value);

    if (
        !Number.isFinite(number) ||
        !Number.isInteger(number) ||
        number < 0
    ) {
        return null;
    }

    return number;
}

function normalizeThreshold(value) {
    const number =
        typeof value === "number"
            ? value
            : Number(value);

    if (
        !Number.isFinite(number) ||
        !Number.isInteger(number) ||
        number < 0
    ) {
        return null;
    }

    return number;
}

/* ============================================================
   GET INVENTORY
============================================================ */

/*
 * GET /api/stock
 *
 * Admin only.
 *
 * Returns only the fields required by the
 * Stock Management page.
 *
 * This keeps the response smaller and faster
 * than returning the entire product document.
 */

export const getInventory = async (
    req,
    res
) => {
    try {
        const products =
            await Product.find({})
                .select(
                    [
                        "_id",
                        "name",
                        "slug",
                        "category",
                        "images",
                        "pricingType",
                        "stock",
                        "lowStockThreshold",
                        "status",
                        "featured",
                        "variants",
                    ].join(" ")
                )
                .sort({
                    createdAt: -1,
                })
                .lean();

        return res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        console.error(
            "Get Inventory Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load inventory.",
        });
    }
};

/* ============================================================
   UPDATE FIXED PRODUCT STOCK
============================================================ */

/*
 * PUT /api/stock/:id
 *
 * Body:
 *
 * {
 *   stock: 20,
 *   lowStockThreshold: 5
 * }
 *
 * This endpoint changes ONLY inventory fields.
 *
 * Product name, price, images, category,
 * description, etc. cannot be modified here.
 */

export const updateProductStock =
    async (req, res) => {
        try {
            const productId =
                req.params.id;

            /* -----------------------------------------------
               ID
            ------------------------------------------------ */

            if (
                !mongoose.Types.ObjectId.isValid(
                    productId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid product ID.",
                });
            }

            /* -----------------------------------------------
               PRODUCT
            ------------------------------------------------ */

            const product =
                await Product.findById(
                    productId
                );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Product not found.",
                });
            }

            /* -----------------------------------------------
               VARIANT PRODUCT PROTECTION
            ------------------------------------------------ */

            if (
                product.pricingType ===
                "variants"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This product uses variants. Update variant stock instead.",
                });
            }

            /* -----------------------------------------------
               STOCK
            ------------------------------------------------ */

            const stock =
                normalizeStock(
                    req.body?.stock
                );

            if (
                stock === null
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Stock must be a non-negative whole number.",
                });
            }

            /* -----------------------------------------------
               LOW STOCK THRESHOLD
            ------------------------------------------------ */

            let lowStockThreshold =
                product.lowStockThreshold;

            if (
                req.body?.lowStockThreshold !==
                undefined
            ) {
                lowStockThreshold =
                    normalizeThreshold(
                        req.body
                            .lowStockThreshold
                    );

                if (
                    lowStockThreshold ===
                    null
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Low-stock threshold must be a non-negative whole number.",
                    });
                }
            }

            /* -----------------------------------------------
               UPDATE ONLY INVENTORY
            ------------------------------------------------ */

            product.stock =
                stock;

            product.lowStockThreshold =
                lowStockThreshold;

            await product.save();

            return res.status(200).json({
                success: true,
                message:
                    "Stock updated successfully.",
                product: {
                    _id:
                        product._id,
                    name:
                        product.name,
                    pricingType:
                        product.pricingType,
                    stock:
                        product.stock,
                    lowStockThreshold:
                        product.lowStockThreshold,
                },
            });
        } catch (error) {
            console.error(
                "Update Product Stock Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update product stock.",
            });
        }
    };

/* ============================================================
   UPDATE VARIANT STOCK
============================================================ */

/*
 * PUT /api/stock/:id/variant/:variantId
 *
 * Body:
 *
 * {
 *   stock: 20,
 *   lowStockThreshold: 5
 * }
 */

export const updateVariantStock =
    async (req, res) => {
        try {
            const {
                id: productId,
                variantId,
            } = req.params;

            /* -----------------------------------------------
               PRODUCT ID
            ------------------------------------------------ */

            if (
                !mongoose.Types.ObjectId.isValid(
                    productId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid product ID.",
                });
            }

            /* -----------------------------------------------
               VARIANT ID
            ------------------------------------------------ */

            if (
                !mongoose.Types.ObjectId.isValid(
                    variantId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid variant ID.",
                });
            }

            /* -----------------------------------------------
               STOCK
            ------------------------------------------------ */

            const stock =
                normalizeStock(
                    req.body?.stock
                );

            if (
                stock === null
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Stock must be a non-negative whole number.",
                });
            }

            /* -----------------------------------------------
               THRESHOLD
            ------------------------------------------------ */

            let lowStockThreshold;

            if (
                req.body?.lowStockThreshold !==
                undefined
            ) {
                lowStockThreshold =
                    normalizeThreshold(
                        req.body
                            .lowStockThreshold
                    );

                if (
                    lowStockThreshold ===
                    null
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Low-stock threshold must be a non-negative whole number.",
                    });
                }
            }

            /* -----------------------------------------------
               ATOMIC UPDATE
            ------------------------------------------------ */

            const update =
                {
                    $set: {
                        "variants.$.stock":
                            stock,
                    },
                };

            if (
                lowStockThreshold !==
                undefined
            ) {
                update.$set[
                    "variants.$.lowStockThreshold"
                ] =
                    lowStockThreshold;
            }

            const updatedProduct =
                await Product.findOneAndUpdate(
                    {
                        _id:
                            productId,

                        pricingType:
                            "variants",

                        variants: {
                            $elemMatch: {
                                _id:
                                    variantId,
                            },
                        },
                    },
                    update,
                    {
                        new: true,
                        runValidators:
                            true,
                    }
                ).select(
                    "_id name pricingType variants"
                );

            if (!updatedProduct) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Product or variant not found.",
                });
            }

            const updatedVariant =
                updatedProduct.variants.id(
                    variantId
                );

            if (!updatedVariant) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Variant not found after update.",
                });
            }

            return res.status(200).json({
                success: true,
                message:
                    "Variant stock updated successfully.",
                product: {
                    _id:
                        updatedProduct._id,
                    name:
                        updatedProduct.name,
                    pricingType:
                        updatedProduct.pricingType,
                },
                variant: {
                    _id:
                        updatedVariant._id,
                    stock:
                        updatedVariant.stock,
                    lowStockThreshold:
                        updatedVariant.lowStockThreshold,
                },
            });
        } catch (error) {
            console.error(
                "Update Variant Stock Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update variant stock.",
            });
        }
    };