import mongoose from "mongoose";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

// ============================================================
// HELPER: GENERATE SLUG
// ============================================================

const generateSlug = (text) => {
    if (!text) return "";

    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
};

// ============================================================
// HELPER: UPLOAD BUFFER TO CLOUDINARY
// ============================================================

const uploadStream = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "new_print_products",
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result.secure_url);
            }
        );

        stream.end(buffer);
    });
};

// ============================================================
// HELPER: PARSE JSON FIELD
// ============================================================

const parseJsonField = (value, defaultValue) => {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }

    if (typeof value !== "string") {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

// ============================================================
// HELPER: PARSE BOOLEAN
// ============================================================

const parseBoolean = (value, defaultValue = false) => {
    if (value === undefined || value === null) {
        return defaultValue;
    }

    if (value === true || value === "true") {
        return true;
    }

    if (value === false || value === "false") {
        return false;
    }

    return defaultValue;
};

// ============================================================
// VALIDATE GENERAL OPTIONS
// ============================================================

const validateOptions = (options) => {
    if (!Array.isArray(options)) {
        return "Product options must be an array";
    }

    for (const option of options) {
        if (!option || !option.name?.trim()) {
            return "Option name cannot be empty";
        }

        if (
            !Array.isArray(option.values) ||
            option.values.length === 0
        ) {
            return `Option "${option.name}" must have at least one value`;
        }

        const values = option.values
            .map((value) => String(value).trim())
            .filter(Boolean);

        if (values.length === 0) {
            return `Option "${option.name}" must have at least one value`;
        }
    }

    return null;
};

// ============================================================
// VALIDATE ORDER SELECTIONS
// ============================================================

const validateOrderSelections = (selections) => {
    if (!Array.isArray(selections)) {
        return "Order selections must be an array";
    }

    const names = new Set();

    for (const selection of selections) {
        if (!selection || !selection.name?.trim()) {
            return "Order selection name cannot be empty";
        }

        const name = selection.name.trim();

        if (names.has(name.toLowerCase())) {
            return `Duplicate order selection "${name}"`;
        }

        names.add(name.toLowerCase());

        if (
            !Array.isArray(selection.values) ||
            selection.values.length === 0
        ) {
            return `Order selection "${name}" must have at least one value`;
        }

        const values = selection.values
            .map((value) => String(value).trim())
            .filter(Boolean);

        if (values.length === 0) {
            return `Order selection "${name}" must have at least one value`;
        }
    }

    return null;
};

// ============================================================
// VALIDATE VARIANTS
// ============================================================

const validateVariants = (
    variants,
    orderSelections
) => {
    if (!Array.isArray(variants)) {
        return "Variants must be an array";
    }

    if (variants.length === 0) {
        return "At least one price variant is required";
    }

    const selectionDefinitions = new Map();

    for (const selection of orderSelections) {
        selectionDefinitions.set(
            selection.name.trim(),
            new Set(
                selection.values.map((value) =>
                    String(value).trim()
                )
            )
        );
    }

    const combinationKeys = new Set();

    for (const variant of variants) {
        if (
            !variant ||
            !variant.selections ||
            typeof variant.selections !== "object"
        ) {
            return "Each variant must contain selections";
        }

        // ------------------------------------------------------
        // PRICE
        // ------------------------------------------------------

        const variantPrice = Number(variant.price);

        if (
            !Number.isFinite(variantPrice) ||
            variantPrice < 0
        ) {
            return "Every variant must have a valid non-negative price";
        }

        // ------------------------------------------------------
        // SELECTIONS
        // ------------------------------------------------------

        const selectionEntries =
            Object.entries(variant.selections);

        if (
            selectionEntries.length !==
            selectionDefinitions.size
        ) {
            return "Variant selections do not match the product order options";
        }

        for (const [name, value] of selectionEntries) {
            if (!selectionDefinitions.has(name)) {
                return `Unknown variant option "${name}"`;
            }

            const allowedValues =
                selectionDefinitions.get(name);

            if (!allowedValues.has(String(value).trim())) {
                return `Invalid value "${value}" for option "${name}"`;
            }
        }

        // ------------------------------------------------------
        // DUPLICATE COMBINATION
        // ------------------------------------------------------

        const combinationKey =
            selectionDefinitions.size > 0
                ? Array.from(selectionDefinitions.keys())
                      .sort()
                      .map(
                          (name) =>
                              `${name}=${String(
                                  variant.selections[name]
                              ).trim()}`
                      )
                      .join("|")
                : "";

        if (combinationKeys.has(combinationKey)) {
            return "Duplicate variant combination found";
        }

        combinationKeys.add(combinationKey);
    }

    return null;
};

// ============================================================
// GET PRODUCTS
// @route GET /api/products
// @access Public
// ============================================================

export const getProducts = async (req, res) => {
    try {
        const {
            status,
            featured,
            category,
            limit,
        } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (featured !== undefined) {
            filter.featured =
                featured === "true";
        }

        if (category) {
            filter.category = category;
        }

        let query = Product.find(filter)
            .populate(
                "category",
                "name slug status"
            )
            .sort({
                createdAt: -1,
            });

        if (limit) {
            const parsedLimit =
                Number.parseInt(limit, 10);

            if (
                Number.isInteger(parsedLimit) &&
                parsedLimit > 0
            ) {
                query = query.limit(
                    Math.min(parsedLimit, 20)
                );
            }
        }

        const products = await query;

        return res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        console.error(
            "GET PRODUCTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch products",
        });
    }
};

// ============================================================
// GET SINGLE PRODUCT
// @route GET /api/products/:id
// @access Public
// ============================================================

export const getProduct = async (req, res) => {
    try {
        const identifier = req.params.id;

        let product;

        if (
            mongoose.Types.ObjectId.isValid(
                identifier
            )
        ) {
            product =
                await Product.findById(
                    identifier
                ).populate(
                    "category",
                    "name slug status"
                );
        }

        if (!product) {
            product =
                await Product.findOne({
                    slug: identifier.toLowerCase(),
                }).populate(
                    "category",
                    "name slug status"
                );
        }

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        return res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        console.error(
            "GET PRODUCT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch product",
        });
    }
};

// ============================================================
// CREATE PRODUCT
// @route POST /api/products
// @access Admin
// ============================================================

export const createProduct = async (req, res) => {
    try {
        const {
            category,
            name,
            description = "",
            status = "active",
        } = req.body;

        let {
            slug,
            price,
            pricingType = "fixed",
            featured,
            options,
            orderSelections,
            variants,
        } = req.body;

        // ====================================================
        // REQUIRED
        // ====================================================

        if (!category) {
            return res.status(400).json({
                success: false,
                message:
                    "Product category is required",
            });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Product name is required",
            });
        }

        // ====================================================
        // PRICING TYPE
        // ====================================================

        if (
            pricingType !== "fixed" &&
            pricingType !== "variants"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Pricing type must be either "fixed" or "variants"',
            });
        }

        // ====================================================
        // SLUG
        // ====================================================

        slug = slug?.trim()
            ? generateSlug(slug)
            : generateSlug(name);

        if (!slug) {
            return res.status(400).json({
                success: false,
                message:
                    "Unable to generate product slug",
            });
        }

        const existingProduct =
            await Product.findOne({ slug });

        if (existingProduct) {
            return res.status(409).json({
                success: false,
                message:
                    "A product with this slug already exists",
            });
        }

        // ====================================================
        // PARSE OPTIONS
        // ====================================================

        const parsedOptions =
            parseJsonField(options, []);

        if (!Array.isArray(parsedOptions)) {
            return res.status(400).json({
                success: false,
                message:
                    "Product options must be an array",
            });
        }

        const optionsError =
            validateOptions(parsedOptions);

        if (optionsError) {
            return res.status(400).json({
                success: false,
                message: optionsError,
            });
        }

        // ====================================================
        // PARSE ORDER SELECTIONS
        // ====================================================

        const parsedOrderSelections =
            parseJsonField(
                orderSelections,
                []
            );

        if (
            !Array.isArray(
                parsedOrderSelections
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Order selections must be an array",
            });
        }

        const orderSelectionError =
            validateOrderSelections(
                parsedOrderSelections
            );

        if (orderSelectionError) {
            return res.status(400).json({
                success: false,
                message:
                    orderSelectionError,
            });
        }

        // ====================================================
        // PRICING
        // ====================================================

        let parsedPrice = null;
        let parsedVariants = [];

        if (pricingType === "fixed") {
            if (
                price === undefined ||
                price === ""
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Product price is required for fixed pricing",
                });
            }

            parsedPrice = Number(price);

            if (
                !Number.isFinite(parsedPrice) ||
                parsedPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Price must be a valid non-negative number",
                });
            }

            // Fixed products must not have variants.
            parsedVariants = [];
        }

        if (pricingType === "variants") {
            // Variant pricing does not use base price.
            parsedPrice = null;

            parsedVariants =
                parseJsonField(
                    variants,
                    []
                );

            if (
                !Array.isArray(
                    parsedVariants
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Variants must be an array",
                });
            }

            const variantError =
                validateVariants(
                    parsedVariants,
                    parsedOrderSelections
                );

            if (variantError) {
                return res.status(400).json({
                    success: false,
                    message: variantError,
                });
            }
        }

        // ====================================================
        // FEATURED
        // ====================================================

        const parsedFeatured =
            parseBoolean(
                featured,
                false
            );

        // ====================================================
        // IMAGES
        // ====================================================

        const imageUrls = [];

        if (req.files?.length) {
            if (req.files.length > 10) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Maximum 10 images allowed",
                });
            }

            for (const file of req.files) {
                if (!file.buffer) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid image upload",
                    });
                }

                const url =
                    await uploadStream(
                        file.buffer
                    );

                imageUrls.push(url);
            }
        }

        // ====================================================
        // CREATE
        // ====================================================

        const product =
            await Product.create({
                category,
                name: name.trim(),
                slug,
                description:
                    description?.trim() || "",

                pricingType,
                price: parsedPrice,

                images: imageUrls,

                options: parsedOptions,

                orderSelections:
                    parsedOrderSelections,

                variants:
                    parsedVariants,

                status,
                featured:
                    parsedFeatured,
            });

        // ====================================================
        // POPULATE
        // ====================================================

        const populatedProduct =
            await Product.findById(
                product._id
            ).populate(
                "category",
                "name slug status"
            );

        return res.status(201).json({
            success: true,
            product:
                populatedProduct,
        });
    } catch (error) {
        console.error(
            "CREATE PRODUCT ERROR:",
            error
        );

        if (
            error.name ===
            "ValidationError"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    Object.values(
                        error.errors
                    )
                        .map(
                            (err) =>
                                err.message
                        )
                        .join(", "),
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "A product with this slug already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to create product",
        });
    }
};

// ============================================================
// UPDATE PRODUCT
// @route PUT /api/products/:id
// @access Admin
// ============================================================

export const updateProduct = async (req, res) => {
    try {
        const product =
            await Product.findById(
                req.params.id
            );

        if (!product) {
            return res.status(404).json({
                success: false,
                message:
                    "Product not found",
            });
        }

        const {
            category,
            name,
            description,
            status,
        } = req.body;

        let {
            slug,
            price,
            pricingType,
            featured,
            options,
            orderSelections,
            variants,
            existingImages,
        } = req.body;

        // ====================================================
        // CATEGORY
        // ====================================================

        const finalCategory =
            category || product.category;

        // ====================================================
        // NAME
        // ====================================================

        const finalName =
            name?.trim() ||
            product.name;

        // ====================================================
        // SLUG
        // ====================================================

        let finalSlug =
            product.slug;

        if (slug !== undefined) {
            finalSlug =
                generateSlug(slug);
        } else if (
            name &&
            name.trim() !== product.name
        ) {
            finalSlug =
                generateSlug(name);
        }

        if (!finalSlug) {
            return res.status(400).json({
                success: false,
                message:
                    "Unable to generate product slug",
            });
        }

        const slugConflict =
            await Product.findOne({
                slug: finalSlug,
                _id: {
                    $ne:
                        req.params.id,
                },
            });

        if (slugConflict) {
            return res.status(409).json({
                success: false,
                message:
                    "Another product uses this slug",
            });
        }

        // ====================================================
        // PRICING TYPE
        // ====================================================

        const finalPricingType =
            pricingType ||
            product.pricingType ||
            "fixed";

        if (
            finalPricingType !== "fixed" &&
            finalPricingType !== "variants"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Pricing type must be either "fixed" or "variants"',
            });
        }

        // ====================================================
        // OPTIONS
        // ====================================================

        let parsedOptions =
            product.options || [];

        if (options !== undefined) {
            parsedOptions =
                parseJsonField(
                    options,
                    null
                );

            if (!Array.isArray(parsedOptions)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Product options must be an array",
                });
            }
        }

        const optionsError =
            validateOptions(
                parsedOptions
            );

        if (optionsError) {
            return res.status(400).json({
                success: false,
                message: optionsError,
            });
        }

        // ====================================================
        // ORDER SELECTIONS
        // ====================================================

        let parsedOrderSelections =
            product.orderSelections ||
            [];

        if (
            orderSelections !== undefined
        ) {
            parsedOrderSelections =
                parseJsonField(
                    orderSelections,
                    null
                );

            if (
                !Array.isArray(
                    parsedOrderSelections
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Order selections must be an array",
                });
            }
        }

        const orderSelectionError =
            validateOrderSelections(
                parsedOrderSelections
            );

        if (orderSelectionError) {
            return res.status(400).json({
                success: false,
                message:
                    orderSelectionError,
            });
        }

        // ====================================================
        // PRICING
        // ====================================================

        let finalPrice =
            product.price ?? null;

        let finalVariants =
            product.variants || [];

        if (
            finalPricingType === "fixed"
        ) {
            if (
                price !== undefined &&
                price !== ""
            ) {
                finalPrice =
                    Number(price);
            }

            if (
                finalPrice === null ||
                !Number.isFinite(
                    finalPrice
                ) ||
                finalPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Product price is required for fixed pricing",
                });
            }

            // Important:
            // Remove old variants when switching
            // back to fixed pricing.
            finalVariants = [];
        }

        if (
            finalPricingType ===
            "variants"
        ) {
            finalPrice = null;

            if (
                variants !== undefined
            ) {
                finalVariants =
                    parseJsonField(
                        variants,
                        null
                    );
            }

            if (
                !Array.isArray(
                    finalVariants
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Variants must be an array",
                });
            }

            const variantError =
                validateVariants(
                    finalVariants,
                    parsedOrderSelections
                );

            if (variantError) {
                return res.status(400).json({
                    success: false,
                    message: variantError,
                });
            }
        }

        // ====================================================
        // FEATURED
        // ====================================================

        let finalFeatured =
            product.featured;

        if (
            featured !== undefined
        ) {
            finalFeatured =
                parseBoolean(
                    featured,
                    product.featured
                );
        }

        // ====================================================
        // IMAGES
        // ====================================================

        let finalImages =
            product.images || [];

        if (
            existingImages !== undefined
        ) {
            const parsedExistingImages =
                parseJsonField(
                    existingImages,
                    null
                );

            if (
                Array.isArray(
                    parsedExistingImages
                )
            ) {
                finalImages =
                    parsedExistingImages;
            } else if (
                typeof existingImages ===
                "string"
            ) {
                finalImages =
                    [existingImages];
            }
        }

        // ====================================================
        // NEW IMAGES
        // ====================================================

        if (
            req.files &&
            req.files.length > 0
        ) {
            for (const file of req.files) {
                if (!file.buffer) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid image upload",
                    });
                }

                const url =
                    await uploadStream(
                        file.buffer
                    );

                finalImages.push(url);
            }
        }

        if (
            finalImages.length > 10
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Maximum 10 images allowed",
            });
        }

        // ====================================================
        // UPDATE
        // ====================================================

        const updatedProduct =
            await Product.findByIdAndUpdate(
                req.params.id,
                {
                    category:
                        finalCategory,

                    name:
                        finalName,

                    slug:
                        finalSlug,

                    description:
                        description !==
                        undefined
                            ? description.trim()
                            : product.description,

                    pricingType:
                        finalPricingType,

                    price:
                        finalPrice,

                    variants:
                        finalVariants,

                    status:
                        status ||
                        product.status,

                    featured:
                        finalFeatured,

                    options:
                        parsedOptions,

                    orderSelections:
                        parsedOrderSelections,

                    images:
                        finalImages,
                },
                {
                    new: true,
                    runValidators: true,
                }
            ).populate(
                "category",
                "name slug status"
            );

        return res.status(200).json({
            success: true,
            product:
                updatedProduct,
        });
    } catch (error) {
        console.error(
            "UPDATE PRODUCT ERROR:",
            error
        );

        if (
            error.name ===
            "CastError"
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Product not found",
            });
        }

        if (
            error.name ===
            "ValidationError"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    Object.values(
                        error.errors
                    )
                        .map(
                            (err) =>
                                err.message
                        )
                        .join(", "),
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Another product uses this slug",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to update product",
        });
    }
};

// ============================================================
// DELETE PRODUCT
// @route DELETE /api/products/:id
// @access Admin
// ============================================================

export const deleteProduct = async (
    req,
    res
) => {
    try {
        const product =
            await Product.findById(
                req.params.id
            );

        if (!product) {
            return res.status(404).json({
                success: false,
                message:
                    "Product not found",
            });
        }

        await product.deleteOne();

        return res.status(200).json({
            success: true,
            message:
                "Product deleted successfully",
        });
    } catch (error) {
        console.error(
            "DELETE PRODUCT ERROR:",
            error
        );

        if (
            error.name ===
            "CastError"
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Product not found",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to delete product",
        });
    }
};