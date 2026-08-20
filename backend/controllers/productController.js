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
        const stream =
            cloudinary.uploader.upload_stream(
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
// CLOUDINARY PUBLIC ID
// ============================================================

const getCloudinaryPublicId = (url) => {
    if (
        typeof url !== "string" ||
        !url.includes("res.cloudinary.com")
    ) {
        return null;
    }

    try {
        const parsedUrl = new URL(url);

        const pathname =
            parsedUrl.pathname;

        const uploadMarker =
            "/image/upload/";

        const markerIndex =
            pathname.indexOf(
                uploadMarker
            );

        if (markerIndex === -1) {
            return null;
        }

        let publicPath =
            pathname.slice(
                markerIndex +
                    uploadMarker.length
            );

        const segments =
            publicPath.split("/");

        // Remove Cloudinary version.
        const versionIndex =
            segments.findIndex(
                (segment) =>
                    /^v\d+$/.test(
                        segment
                    )
            );

        if (versionIndex !== -1) {
            publicPath =
                segments
                    .slice(
                        versionIndex + 1
                    )
                    .join("/");
        }

        // Remove extension.
        publicPath =
            publicPath.replace(
                /\.[^/.]+$/,
                ""
            );

        return decodeURIComponent(
            publicPath
        );
    } catch {
        return null;
    }
};


// ============================================================
// DELETE CLOUDINARY IMAGE
// ============================================================

const deleteCloudinaryImage = async (
    url
) => {
    const publicId =
        getCloudinaryPublicId(
            url
        );

    if (!publicId) {
        return;
    }

    try {
        await cloudinary.uploader.destroy(
            publicId,
            {
                resource_type:
                    "image",

                invalidate:
                    true,
            }
        );
    } catch (error) {
        // Cloudinary cleanup should never
        // make the product update fail.
        console.error(
            "CLOUDINARY IMAGE DELETE WARNING:",
            error
        );
    }
};
// ============================================================
// HELPER: PARSE JSON FIELD
// ============================================================

const parseJsonField = (
    value,
    defaultValue
) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
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

const parseBoolean = (
    value,
    defaultValue = false
) => {
    if (
        value === undefined ||
        value === null
    ) {
        return defaultValue;
    }

    if (
        value === true ||
        value === "true"
    ) {
        return true;
    }

    if (
        value === false ||
        value === "false"
    ) {
        return false;
    }

    return defaultValue;
};

// ============================================================
// HELPER: PARSE STOCK
//
// Stock must always be a whole number >= 0.
// ============================================================

const parseStock = (
    value,
    fieldName = "Stock"
) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return {
            error: `${fieldName} is required`,
        };
    }

    const number = Number(value);

    if (
        !Number.isFinite(number) ||
        number < 0 ||
        !Number.isInteger(number)
    ) {
        return {
            error: `${fieldName} must be a whole number greater than or equal to 0`,
        };
    }

    return {
        value: number,
    };
};

// ============================================================
// HELPER: PARSE LOW STOCK THRESHOLD
// ============================================================

const parseLowStockThreshold = (
    value,
    defaultValue = 5,
    fieldName = "Low stock threshold"
) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return {
            value: defaultValue,
        };
    }

    const number = Number(value);

    if (
        !Number.isFinite(number) ||
        number < 0 ||
        !Number.isInteger(number)
    ) {
        return {
            error: `${fieldName} must be a whole number greater than or equal to 0`,
        };
    }

    return {
        value: number,
    };
};

// ============================================================
// VALIDATE GENERAL OPTIONS
// ============================================================

const validateOptions = (
    options
) => {
    if (!Array.isArray(options)) {
        return "Product options must be an array";
    }

    const names = new Set();

    for (const option of options) {
        if (
            !option ||
            !option.name?.trim()
        ) {
            return "Option name cannot be empty";
        }

        const name =
            option.name.trim();

        if (
            names.has(
                name.toLowerCase()
            )
        ) {
            return `Duplicate product option "${name}"`;
        }

        names.add(
            name.toLowerCase()
        );

        if (
            !Array.isArray(
                option.values
            ) ||
            option.values.length === 0
        ) {
            return `Option "${name}" must have at least one value`;
        }

        const values =
            option.values
                .map((value) =>
                    String(value).trim()
                )
                .filter(Boolean);

        if (
            values.length === 0
        ) {
            return `Option "${name}" must have at least one value`;
        }
    }

    return null;
};

// ============================================================
// VALIDATE ORDER SELECTIONS
// ============================================================

const validateOrderSelections = (
    selections
) => {
    if (!Array.isArray(selections)) {
        return "Order selections must be an array";
    }

    const names = new Set();

    for (const selection of selections) {
        if (
            !selection ||
            !selection.name?.trim()
        ) {
            return "Order selection name cannot be empty";
        }

        const name =
            selection.name.trim();

        if (
            names.has(
                name.toLowerCase()
            )
        ) {
            return `Duplicate order selection "${name}"`;
        }

        names.add(
            name.toLowerCase()
        );

        if (
            !Array.isArray(
                selection.values
            ) ||
            selection.values.length === 0
        ) {
            return `Order selection "${name}" must have at least one value`;
        }

        const values =
            selection.values
                .map((value) =>
                    String(value).trim()
                )
                .filter(Boolean);

        if (
            values.length === 0
        ) {
            return `Order selection "${name}" must have at least one value`;
        }
    }

    return null;
};

// ============================================================
// VALIDATE VARIANTS
// ============================================================

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

    const selectionDefinitions =
        new Map();

    for (
        const selection of orderSelections
    ) {
        selectionDefinitions.set(
            selection.name.trim(),
            new Set(
                selection.values.map(
                    (value) =>
                        String(value).trim()
                )
            )
        );
    }

    const combinationKeys =
        new Set();

    const skuSet =
        new Set();

    for (
        const variant of variants
    ) {
        if (
            !variant ||
            !variant.selections ||
            typeof variant.selections !==
                "object"
        ) {
            return "Each variant must contain selections";
        }

        // ------------------------------------------------------
        // SELLING PRICE
        // ------------------------------------------------------

        const variantPrice =
            Number(
                variant.price
            );

        if (
            !Number.isFinite(
                variantPrice
            ) ||
            variantPrice < 0
        ) {
            return "Every variant must have a valid non-negative selling price";
        }

        // ------------------------------------------------------
        // ORIGINAL / MRP PRICE
        //
        // If not provided, use selling price.
        //
        // This keeps older variants working.
        // ------------------------------------------------------

        const variantOriginalPrice =
            variant.originalPrice ===
                undefined ||
            variant.originalPrice ===
                null ||
            variant.originalPrice ===
                ""
                ? variantPrice
                : Number(
                      variant.originalPrice
                  );

        if (
            !Number.isFinite(
                variantOriginalPrice
            ) ||
            variantOriginalPrice < 0
        ) {
            return "Every variant must have a valid non-negative original price";
        }

        // ------------------------------------------------------
        // ORIGINAL PRICE CANNOT BE LESS THAN
        // SELLING PRICE
        // ------------------------------------------------------

        if (
            variantOriginalPrice <
            variantPrice
        ) {
            return "Variant original price cannot be less than selling price";
        }

        // ------------------------------------------------------
        // STOCK
        // ------------------------------------------------------

        const variantStock =
            Number(
                variant.stock
            );

        if (
            !Number.isFinite(
                variantStock
            ) ||
            variantStock < 0 ||
            !Number.isInteger(
                variantStock
            )
        ) {
            return "Every variant must have a valid whole-number stock quantity";
        }

        // ------------------------------------------------------
        // LOW STOCK THRESHOLD
        // ------------------------------------------------------

        const threshold =
            variant.lowStockThreshold ===
                undefined ||
            variant.lowStockThreshold ===
                null ||
            variant.lowStockThreshold ===
                ""
                ? 5
                : Number(
                      variant.lowStockThreshold
                  );

        if (
            !Number.isFinite(
                threshold
            ) ||
            threshold < 0 ||
            !Number.isInteger(
                threshold
            )
        ) {
            return "Every variant must have a valid whole-number low-stock threshold";
        }

        // ------------------------------------------------------
        // SKU
        // ------------------------------------------------------

        const sku =
            typeof variant.sku ===
            "string"
                ? variant.sku.trim()
                : "";

        if (sku) {
            const normalizedSku =
                sku.toLowerCase();

            if (
                skuSet.has(
                    normalizedSku
                )
            ) {
                return `Duplicate variant SKU "${sku}"`;
            }

            skuSet.add(
                normalizedSku
            );
        }

        // ------------------------------------------------------
        // SELECTIONS
        // ------------------------------------------------------

        const selectionEntries =
            Object.entries(
                variant.selections
            );

        if (
            selectionEntries.length !==
            selectionDefinitions.size
        ) {
            return "Variant selections do not match the product order options";
        }

        for (
            const [
                name,
                value,
            ] of selectionEntries
        ) {
            if (
                !selectionDefinitions.has(
                    name
                )
            ) {
                return `Unknown variant option "${name}"`;
            }

            const allowedValues =
                selectionDefinitions.get(
                    name
                );

            if (
                !allowedValues.has(
                    String(value).trim()
                )
            ) {
                return `Invalid value "${value}" for option "${name}"`;
            }
        }

        // ------------------------------------------------------
        // DUPLICATE COMBINATION
        // ------------------------------------------------------

        const combinationKey =
            selectionDefinitions.size >
            0
                ? Array.from(
                      selectionDefinitions.keys()
                  )
                      .sort()
                      .map(
                          (name) =>
                              `${name}=${String(
                                  variant
                                      .selections[
                                      name
                                  ]
                              ).trim()}`
                      )
                      .join("|")
                : "";

        if (
            combinationKeys.has(
                combinationKey
            )
        ) {
            return "Duplicate variant combination found";
        }

        combinationKeys.add(
            combinationKey
        );
    }

    return null;
};

// ============================================================
// GET PRODUCTS
// @route GET /api/products
// @access Public
// ============================================================

export const getProducts = async (
    req,
    res
) => {
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

        if (
            featured !==
            undefined
        ) {
            filter.featured =
                featured === "true";
        }

        if (category) {
            filter.category =
                category;
        }

        let query =
            Product.find(filter)
                .populate(
                    "category",
                    "name slug status"
                )
                .sort({
                    createdAt: -1,
                });

        if (limit) {
            const parsedLimit =
                Number.parseInt(
                    limit,
                    10
                );

            if (
                Number.isInteger(
                    parsedLimit
                ) &&
                parsedLimit > 0
            ) {
                query =
                    query.limit(
                        Math.min(
                            parsedLimit,
                            20
                        )
                    );
            }
        }

        const products =
            await query;

        return res
            .status(200)
            .json({
                success: true,
                products,
            });
    } catch (error) {
        console.error(
            "GET PRODUCTS ERROR:",
            error
        );

        return res
            .status(500)
            .json({
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

export const getProduct = async (
    req,
    res
) => {
    try {
        const identifier =
            req.params.id;

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
                    slug:
                        identifier.toLowerCase(),
                }).populate(
                    "category",
                    "name slug status"
                );
        }

        if (!product) {
            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "Product not found",
                });
        }

        return res
            .status(200)
            .json({
                success: true,
                product,
            });
    } catch (error) {
        console.error(
            "GET PRODUCT ERROR:",
            error
        );

        return res
            .status(500)
            .json({
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

// ============================================================
// CREATE PRODUCT
// @route POST /api/products
// @access Admin
// ============================================================

export const createProduct = async (
    req,
    res
) => {
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
    originalPrice,
    pricingType = "fixed",
    featured,
    options,
    orderSelections,
    variants,
    stock,
    lowStockThreshold,
    weight,
} = req.body;

        // ====================================================
        // REQUIRED
        // ====================================================

        if (!category) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Product category is required",
                });
        }

        if (
            !name ||
            !name.trim()
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Product name is required",
                });
        }

        // ====================================================
        // PRICING TYPE
        // ====================================================

        if (
            pricingType !==
                "fixed" &&
            pricingType !==
                "variants"
        ) {
            return res
                .status(400)
                .json({
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
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Unable to generate product slug",
                });
        }

        const existingProduct =
            await Product.findOne({
                slug,
            });

        if (existingProduct) {
            return res
                .status(409)
                .json({
                    success: false,
                    message:
                        "A product with this slug already exists",
                });
        }

        // ====================================================
        // PARSE OPTIONS
        // ====================================================

        const parsedOptions =
            parseJsonField(
                options,
                []
            );

        if (
            !Array.isArray(
                parsedOptions
            )
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Product options must be an array",
                });
        }

        const optionsError =
            validateOptions(
                parsedOptions
            );

        if (optionsError) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        optionsError,
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
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Order selections must be an array",
                });
        }

        const orderSelectionError =
            validateOrderSelections(
                parsedOrderSelections
            );

        if (
            orderSelectionError
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        orderSelectionError,
                });
        }

        // ====================================================
        // PRICING + INVENTORY
        // ====================================================

        let parsedPrice = null;

        let parsedOriginalPrice =
            null;

        let parsedStock = 0;

        let parsedLowStockThreshold = 5;

        let parsedVariants = [];
        // ====================================================
// SHIPPING WEIGHT
//
// Stored internally in grams.
// Customers never see this value.
// ====================================================

const parsedWeight =
    Number(weight);

if (
    !Number.isFinite(parsedWeight) ||
    parsedWeight <= 0 ||
    !Number.isInteger(parsedWeight)
) {
    return res
        .status(400)
        .json({
            success: false,
            message:
                "Product weight must be a whole number greater than 0 grams",
        });
}

        // ====================================================
        // FIXED PRICING
        // ====================================================

        if (
            pricingType ===
            "fixed"
        ) {
            // ------------------------------------------------
            // SELLING PRICE
            // ------------------------------------------------

            if (
                price ===
                    undefined ||
                price === ""
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Product price is required for fixed pricing",
                    });
            }

            parsedPrice =
                Number(price);

            if (
                !Number.isFinite(
                    parsedPrice
                ) ||
                parsedPrice < 0
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Price must be a valid non-negative number",
                    });
            }

            // ------------------------------------------------
            // ORIGINAL / MRP PRICE
            //
            // If originalPrice is not supplied,
            // use selling price.
            //
            // This keeps old products working.
            // ------------------------------------------------

            if (
                originalPrice ===
                    undefined ||
                originalPrice === ""
            ) {
                parsedOriginalPrice =
                    parsedPrice;
            } else {
                parsedOriginalPrice =
                    Number(
                        originalPrice
                    );

                if (
                    !Number.isFinite(
                        parsedOriginalPrice
                    ) ||
                    parsedOriginalPrice < 0
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "Original price must be a valid non-negative number",
                        });
                }
            }

            // ------------------------------------------------
            // ORIGINAL PRICE MUST NOT BE LESS THAN
            // SELLING PRICE
            // ------------------------------------------------

            if (
                parsedOriginalPrice <
                parsedPrice
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Original price cannot be less than selling price",
                    });
            }

            // ------------------------------------------------
            // STOCK
            // ------------------------------------------------

            const stockResult =
                parseStock(
                    stock,
                    "Product stock"
                );

            if (
                stockResult.error
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            stockResult.error,
                    });
            }

            parsedStock =
                stockResult.value;

            // ------------------------------------------------
            // LOW STOCK THRESHOLD
            // ------------------------------------------------

            const thresholdResult =
                parseLowStockThreshold(
                    lowStockThreshold,
                    5,
                    "Low stock threshold"
                );

            if (
                thresholdResult.error
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            thresholdResult.error,
                    });
            }

            parsedLowStockThreshold =
                thresholdResult.value;

            // Fixed products cannot have variants.
            parsedVariants = [];
        }

        // ====================================================
        // VARIANT PRICING
        // ====================================================

        if (
            pricingType ===
            "variants"
        ) {
            parsedPrice = null;

            parsedOriginalPrice =
                null;

            // Product-level stock is not used.
            parsedStock = 0;

            parsedLowStockThreshold = 0;

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
                return res
                    .status(400)
                    .json({
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
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            variantError,
                    });
            }

            // ------------------------------------------------
            // NORMALIZE VARIANTS
            // ------------------------------------------------

            parsedVariants =
                parsedVariants.map(
                    (variant) => {
                        const sellingPrice =
                            Number(
                                variant.price
                            );

                        let variantOriginalPrice;

                        if (
                            variant.originalPrice ===
                                undefined ||
                            variant.originalPrice ===
                                null ||
                            variant.originalPrice ===
                                ""
                        ) {
                            variantOriginalPrice =
                                sellingPrice;
                        } else {
                            variantOriginalPrice =
                                Number(
                                    variant.originalPrice
                                );
                        }

                        return {
                            ...variant,

                            originalPrice:
                                variantOriginalPrice,

                            price:
                                sellingPrice,

                            sku:
                                typeof variant.sku ===
                                "string"
                                    ? variant.sku.trim()
                                    : "",

                            stock:
                                Number(
                                    variant.stock
                                ),

                            lowStockThreshold:
                                variant.lowStockThreshold ===
                                    undefined ||
                                variant.lowStockThreshold ===
                                    null ||
                                variant.lowStockThreshold ===
                                    ""
                                    ? 5
                                    : Number(
                                          variant.lowStockThreshold
                                      ),
                        };
                    }
                );

            // ------------------------------------------------
            // VALIDATE VARIANT ORIGINAL PRICES
            // ------------------------------------------------

            for (
                const variant of parsedVariants
            ) {
                if (
                    !Number.isFinite(
                        variant.originalPrice
                    ) ||
                    variant.originalPrice < 0
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "Every variant must have a valid original price",
                        });
                }

                if (
                    variant.originalPrice <
                    variant.price
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "Variant original price cannot be less than selling price",
                        });
                }
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

        if (
            req.files?.length
        ) {
            if (
                req.files.length >
                10
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Maximum 10 images allowed",
                    });
            }

            for (
                const file of req.files
            ) {
                if (!file.buffer) {
                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "Invalid image upload",
                        });
                }

                const url =
                    await uploadStream(
                        file.buffer
                    );

                imageUrls.push(
                    url
                );
            }
        }

        // ====================================================
        // CREATE
        // ====================================================

        const product =
            await Product.create({
                category,

                name:
                    name.trim(),

                slug,

               description:
    description?.trim() ||
    "",

// ------------------------------------------------
// INTERNAL SHIPPING WEIGHT
// ------------------------------------------------

weight:
    parsedWeight,

pricingType,

                // ------------------------------------------------
                // FIXED PRODUCT PRICING
                // ------------------------------------------------

                originalPrice:
                    parsedOriginalPrice,

                price:
                    parsedPrice,

                // ------------------------------------------------
                // FIXED PRODUCT INVENTORY
                // ------------------------------------------------

                stock:
                    parsedStock,

                lowStockThreshold:
                    parsedLowStockThreshold,

                // ------------------------------------------------
                // IMAGES
                // ------------------------------------------------

                images:
                    imageUrls,

                // ------------------------------------------------
                // OPTIONS
                // ------------------------------------------------

                options:
                    parsedOptions,

                orderSelections:
                    parsedOrderSelections,

                // ------------------------------------------------
                // VARIANTS
                // ------------------------------------------------

                variants:
                    parsedVariants,

                // ------------------------------------------------
                // STATUS
                // ------------------------------------------------

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

        return res
            .status(201)
            .json({
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
            return res
                .status(400)
                .json({
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

        if (
            error.code ===
            11000
        ) {
            return res
                .status(409)
                .json({
                    success: false,
                    message:
                        "A product with this slug already exists",
                });
        }

        return res
            .status(500)
            .json({
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

// ============================================================
// UPDATE PRODUCT
// @route PUT /api/products/:id
// @access Admin
// ============================================================

// ============================================================
// UPDATE PRODUCT
// @route PUT /api/products/:id
// @access Admin
// ============================================================

export const updateProduct = async (
    req,
    res
) => {
    try {
        // ====================================================
        // FIND PRODUCT
        // ====================================================

        const product =
            await Product.findById(
                req.params.id
            );

        if (!product) {
            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "Product not found",
                });
        }

        // ====================================================
        // BODY
        // ====================================================

        const {
            category,
            name,
            description,
            status,
        } = req.body;

        let {
            slug,
            price,
            originalPrice,
            pricingType,
            featured,
            options,
            orderSelections,
            variants,

            // Old frontend compatibility
            existingImages,

            // NEW FRONTEND IMAGE ORDER
            imageOrder,

            stock,
            lowStockThreshold,
            weight,
        } = req.body;

        // ====================================================
        // CATEGORY
        // ====================================================

        const finalCategory =
            category ||
            product.category;

        // ====================================================
        // NAME
        // ====================================================

        const finalName =
            name !== undefined
                ? name.trim()
                : product.name;

        if (!finalName) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Product name is required",
                });
        }

        // ====================================================
        // SLUG
        // ====================================================

        let finalSlug =
            product.slug;

        if (
            slug !== undefined
        ) {
            finalSlug =
                generateSlug(
                    slug
                );
        } else if (
            name !== undefined &&
            name.trim() !==
                product.name
        ) {
            finalSlug =
                generateSlug(
                    name
                );
        }

        if (!finalSlug) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Unable to generate product slug",
                });
        }

        // ====================================================
        // SLUG DUPLICATE CHECK
        // ====================================================

        const slugConflict =
            await Product.findOne({
                slug: finalSlug,

                _id: {
                    $ne:
                        req.params.id,
                },
            });

        if (slugConflict) {
            return res
                .status(409)
                .json({
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
            finalPricingType !==
                "fixed" &&
            finalPricingType !==
                "variants"
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        'Pricing type must be either "fixed" or "variants"',
                });
        }

        // ====================================================
        // SHIPPING WEIGHT
        // ====================================================

        let finalWeight =
            product.weight ??
            100;

        if (
            weight !== undefined &&
            weight !== ""
        ) {
            finalWeight =
                Number(weight);

            if (
                !Number.isFinite(
                    finalWeight
                ) ||
                finalWeight <= 0 ||
                !Number.isInteger(
                    finalWeight
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Product weight must be a whole number greater than 0 grams",
                    });
            }
        }

        // ====================================================
        // DESCRIPTION
        // ====================================================

        const finalDescription =
            description !==
            undefined
                ? String(
                      description
                  ).trim()
                : product.description ||
                  "";

        // ====================================================
        // OPTIONS
        // ====================================================

        let parsedOptions =
            product.options ||
            [];

        if (
            options !==
            undefined
        ) {
            parsedOptions =
                parseJsonField(
                    options,
                    null
                );

            if (
                !Array.isArray(
                    parsedOptions
                )
            ) {
                return res
                    .status(400)
                    .json({
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
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        optionsError,
                });
        }

        // ====================================================
        // ORDER SELECTIONS
        // ====================================================

        let parsedOrderSelections =
            product.orderSelections ||
            [];

        if (
            orderSelections !==
            undefined
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
                return res
                    .status(400)
                    .json({
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

        if (
            orderSelectionError
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        orderSelectionError,
                });
        }

        // ====================================================
        // DEFAULT PRICING VALUES
        // ====================================================

        let finalPrice =
            product.price ??
            null;

        let finalOriginalPrice =
            product.originalPrice ??
            null;

        let finalStock =
            product.stock ??
            0;

        let finalLowStockThreshold =
            product.lowStockThreshold ??
            5;

        let finalVariants =
            Array.isArray(
                product.variants
            )
                ? product.variants
                : [];

        // ====================================================
        // FIXED PRICING
        // ====================================================

        if (
            finalPricingType ===
            "fixed"
        ) {
            // ------------------------------------------------
            // PRICE
            // ------------------------------------------------

            if (
                price !==
                    undefined &&
                price !== ""
            ) {
                finalPrice =
                    Number(price);
            }

            if (
                finalPrice ===
                    null ||
                !Number.isFinite(
                    finalPrice
                ) ||
                finalPrice < 0
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Product price is required for fixed pricing",
                    });
            }

            // ------------------------------------------------
            // ORIGINAL PRICE
            // ------------------------------------------------

            if (
                originalPrice !==
                    undefined &&
                originalPrice !== ""
            ) {
                finalOriginalPrice =
                    Number(
                        originalPrice
                    );
            }

            if (
                finalOriginalPrice ===
                    null ||
                finalOriginalPrice ===
                    undefined
            ) {
                finalOriginalPrice =
                    finalPrice;
            }

            if (
                !Number.isFinite(
                    finalOriginalPrice
                ) ||
                finalOriginalPrice < 0
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Original price must be a valid non-negative number",
                    });
            }

            if (
                finalOriginalPrice <
                finalPrice
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Original price cannot be less than selling price",
                    });
            }

            // ------------------------------------------------
            // STOCK
            // ------------------------------------------------

            if (
                stock !==
                undefined
            ) {
                const stockResult =
                    parseStock(
                        stock,
                        "Product stock"
                    );

                if (
                    stockResult.error
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                stockResult.error,
                        });
                }

                finalStock =
                    stockResult.value;
            }

            // ------------------------------------------------
            // LOW STOCK THRESHOLD
            // ------------------------------------------------

            if (
                lowStockThreshold !==
                undefined
            ) {
                const thresholdResult =
                    parseLowStockThreshold(
                        lowStockThreshold,
                        5,
                        "Low stock threshold"
                    );

                if (
                    thresholdResult.error
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                thresholdResult.error,
                        });
                }

                finalLowStockThreshold =
                    thresholdResult.value;
            }

            // Fixed products have no variants.
            finalVariants = [];
        }

        // ====================================================
        // VARIANT PRICING
        // ====================================================

        if (
            finalPricingType ===
            "variants"
        ) {
            finalPrice = null;

            finalOriginalPrice =
                null;

            finalStock = 0;

            finalLowStockThreshold =
                0;

            if (
                variants !==
                undefined
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
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Variants must be an array",
                    });
            }

            // ------------------------------------------------
            // VALIDATE VARIANTS
            // ------------------------------------------------

            const variantError =
                validateVariants(
                    finalVariants,
                    parsedOrderSelections
                );

            if (variantError) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            variantError,
                    });
            }

            // ------------------------------------------------
            // NORMALIZE VARIANTS
            // ------------------------------------------------

            finalVariants =
                finalVariants.map(
                    (variant) => {
                        const sellingPrice =
                            Number(
                                variant.price
                            );

                        const variantOriginalPrice =
                            variant.originalPrice ===
                                undefined ||
                            variant.originalPrice ===
                                null ||
                            variant.originalPrice ===
                                ""
                                ? sellingPrice
                                : Number(
                                      variant.originalPrice
                                  );

                        return {
                            ...variant,

                            originalPrice:
                                variantOriginalPrice,

                            price:
                                sellingPrice,

                            sku:
                                typeof variant.sku ===
                                "string"
                                    ? variant.sku.trim()
                                    : "",

                            stock:
                                Number(
                                    variant.stock
                                ),

                            lowStockThreshold:
                                variant.lowStockThreshold ===
                                    undefined ||
                                variant.lowStockThreshold ===
                                    null ||
                                variant.lowStockThreshold ===
                                    ""
                                    ? 5
                                    : Number(
                                          variant.lowStockThreshold
                                      ),
                        };
                    }
                );

            // ------------------------------------------------
            // VALIDATE NORMALIZED VARIANTS
            // ------------------------------------------------

            for (
                const variant of
                    finalVariants
            ) {
                if (
                    !Number.isFinite(
                        variant.originalPrice
                    ) ||
                    variant.originalPrice <
                        0
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "Every variant must have a valid original price",
                        });
                }

                if (
                    variant.originalPrice <
                    variant.price
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "Variant original price cannot be less than selling price",
                        });
                }
            }
        }

        // ====================================================
        // FEATURED
        // ====================================================

        let finalFeatured =
            Boolean(
                product.featured
            );

        if (
            featured !==
            undefined
        ) {
            finalFeatured =
                parseBoolean(
                    featured,
                    finalFeatured
                );
        }

        // ====================================================
        // STATUS
        // ====================================================

        const finalStatus =
            status !== undefined
                ? status
                : product.status;

        if (
            finalStatus !==
                "active" &&
            finalStatus !==
                "inactive"
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        'Status must be either "active" or "inactive"',
                });
        }

        // ====================================================
        // IMAGES
        //
        // imageOrder comes from the updated ProductForm.
        //
        // Example:
        //
        // [
        //   "old-image-2.jpg",
        //   "__NEW_IMAGE_0__",
        //   "old-image-1.jpg"
        // ]
        // ====================================================

        const originalImages =
            Array.isArray(
                product.images
            )
                ? [
                      ...product.images,
                  ]
                : [];

        let parsedImageOrder =
            null;

        // ----------------------------------------------------
        // NEW FRONTEND
        // ----------------------------------------------------

        if (
            imageOrder !==
            undefined
        ) {
            parsedImageOrder =
                parseJsonField(
                    imageOrder,
                    null
                );

            if (
                !Array.isArray(
                    parsedImageOrder
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Image order must be an array",
                    });
            }
        }

        // ----------------------------------------------------
        // OLD FRONTEND COMPATIBILITY
        // ----------------------------------------------------

        else if (
            existingImages !==
            undefined
        ) {
            parsedImageOrder =
                parseJsonField(
                    existingImages,
                    null
                );

            if (
                !Array.isArray(
                    parsedImageOrder
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Existing images must be an array",
                    });
            }
        }

        // ====================================================
        // UPLOAD NEW IMAGES
        // ====================================================

        const uploadedImageUrls =
            [];

        if (
            req.files &&
            req.files.length >
                0
        ) {
            if (
                req.files.length >
                10
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Maximum 10 new images allowed",
                    });
            }

            for (
                const file of
                    req.files
            ) {
                if (
                    !file.buffer
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "Invalid image upload",
                        });
                }

                const url =
                    await uploadStream(
                        file.buffer
                    );

                uploadedImageUrls.push(
                    url
                );
            }
        }

        // ====================================================
        // BUILD FINAL IMAGE ORDER
        // ====================================================

        let finalImages = [];

        if (
            parsedImageOrder !==
            null
        ) {
            const originalImageSet =
                new Set(
                    originalImages
                );

            const usedNewIndexes =
                new Set();

            for (
                const entry of
                    parsedImageOrder
            ) {
                if (
                    typeof entry !==
                    "string"
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "Invalid image order entry",
                        });
                }

                // ------------------------------------------------
                // NEW IMAGE
                // ------------------------------------------------

                if (
                    entry.startsWith(
                        "__NEW_IMAGE_"
                    ) &&
                    entry.endsWith(
                        "__"
                    )
                ) {
                    const match =
                        entry.match(
                            /^__NEW_IMAGE_(\d+)__$/
                        );

                    if (!match) {
                        return res
                            .status(400)
                            .json({
                                success: false,
                                message:
                                    "Invalid new image placeholder",
                            });
                    }

                    const newIndex =
                        Number(
                            match[1]
                        );

                    if (
                        !Number.isInteger(
                            newIndex
                        ) ||
                        newIndex < 0 ||
                        newIndex >=
                            uploadedImageUrls.length
                    ) {
                        return res
                            .status(400)
                            .json({
                                success: false,
                                message:
                                    "Image upload/order mismatch",
                            });
                    }

                    if (
                        usedNewIndexes.has(
                            newIndex
                        )
                    ) {
                        return res
                            .status(400)
                            .json({
                                success: false,
                                message:
                                    "Duplicate new image in image order",
                            });
                    }

                    usedNewIndexes.add(
                        newIndex
                    );

                    finalImages.push(
                        uploadedImageUrls[
                            newIndex
                        ]
                    );

                    continue;
                }

                // ------------------------------------------------
                // EXISTING IMAGE
                // ------------------------------------------------

                if (
                    !originalImageSet.has(
                        entry
                    )
                ) {
                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "Invalid existing product image",
                        });
                }

                finalImages.push(
                    entry
                );
            }

            // ------------------------------------------------
            // EVERY NEW UPLOAD MUST BE USED
            // ------------------------------------------------

            if (
                usedNewIndexes.size !==
                uploadedImageUrls.length
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Every uploaded image must be included in the image order",
                    });
            }
        } else {
            // ------------------------------------------------
            // NO IMAGE ORDER SENT
            //
            // Preserve old images and append new ones.
            // ------------------------------------------------

            finalImages = [
                ...originalImages,
                ...uploadedImageUrls,
            ];
        }

        // ====================================================
        // REMOVE DUPLICATES
        // ====================================================

        finalImages =
            Array.from(
                new Set(
                    finalImages
                )
            );

        // ====================================================
        // MAX 10
        // ====================================================

        if (
            finalImages.length >
            10
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Maximum 10 images allowed",
                });
        }

        // ====================================================
        // FIND REMOVED IMAGES
        // ====================================================

        const finalImageSet =
            new Set(
                finalImages
            );

        const removedImages =
            originalImages.filter(
                (url) =>
                    !finalImageSet.has(
                        url
                    )
            );

        // ====================================================
        // DELETE REMOVED CLOUDINARY IMAGES
        // ====================================================

        await Promise.all(
            removedImages.map(
                (url) =>
                    deleteCloudinaryImage(
                        url
                    )
            )
        );

        // ====================================================
        // UPDATE PRODUCT
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
                        finalDescription,

                    weight:
                        finalWeight,

                    pricingType:
                        finalPricingType,

                    originalPrice:
                        finalOriginalPrice,

                    price:
                        finalPrice,

                    stock:
                        finalStock,

                    lowStockThreshold:
                        finalLowStockThreshold,

                    variants:
                        finalVariants,

                    options:
                        parsedOptions,

                    orderSelections:
                        parsedOrderSelections,

                    images:
                        finalImages,

                    status:
                        finalStatus,

                    featured:
                        finalFeatured,
                },
                {
                    new: true,

                    runValidators:
                        true,
                }
            ).populate(
                "category",
                "name slug status"
            );

        // ====================================================
        // RESPONSE
        // ====================================================

        return res
            .status(200)
            .json({
                success: true,

                message:
                    "Product updated successfully",

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
            "ValidationError"
        ) {
            return res
                .status(400)
                .json({
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

        if (
            error.code ===
            11000
        ) {
            return res
                .status(409)
                .json({
                    success: false,
                    message:
                        "A product with this slug already exists",
                });
        }

        return res
            .status(500)
            .json({
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
            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "Product not found",
                });
        }

        // ====================================================
        // DELETE PRODUCT IMAGES FROM CLOUDINARY
        // ====================================================

        const productImages =
            Array.isArray(
                product.images
            )
                ? product.images
                : [];

        await Promise.all(
            productImages.map(
                (url) =>
                    deleteCloudinaryImage(
                        url
                    )
            )
        );

        // ====================================================
        // DELETE PRODUCT
        // ====================================================

        await product.deleteOne();

        return res
            .status(200)
            .json({
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
            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "Product not found",
                });
        }

        return res
            .status(500)
            .json({
                success: false,
                message:
                    error.message ||
                    "Failed to delete product",
            });
    }
};