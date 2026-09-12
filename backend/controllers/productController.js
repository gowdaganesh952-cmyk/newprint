import mongoose from "mongoose";

import Product from "../models/Product.js";

import cloudinary from "../config/cloudinary.js";

// ============================================================
// CONSTANTS
// ============================================================

const MAX_RELATED_PRODUCTS = 20;

// ============================================================
// HELPER: GENERATE SLUG
// ============================================================

const generateSlug = (
    text
) => {
    if (!text) {
        return "";
    }

    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(
            /\s+/g,
            "-"
        )
        .replace(
            /[^\w\-]+/g,
            ""
        )
        .replace(
            /\-\-+/g,
            "-"
        )
        .replace(
            /^-+/,
            ""
        )
        .replace(
            /-+$/,
            ""
        );
};

// ============================================================
// HELPER: UPLOAD BUFFER TO CLOUDINARY
// ============================================================

const uploadStream = (
    buffer
) => {
    return new Promise(
        (
            resolve,
            reject
        ) => {
            const stream =
                cloudinary.uploader.upload_stream(
                    {
                        folder:
                            "new_print_products",
                    },

                    (
                        error,
                        result
                    ) => {
                        if (error) {
                            return reject(
                                error
                            );
                        }

                        resolve(
                            result.secure_url
                        );
                    }
                );

            stream.end(
                buffer
            );
        }
    );
};

// ============================================================
// HELPER: GET CLOUDINARY PUBLIC ID
// ============================================================

const getCloudinaryPublicId = (
    url
) => {
    if (
        typeof url !==
            "string" ||
        !url.includes(
            "res.cloudinary.com"
        )
    ) {
        return null;
    }

    try {
        const pathname =
            new URL(
                url
            ).pathname;

        const uploadMarker =
            "/image/upload/";

        const markerIndex =
            pathname.indexOf(
                uploadMarker
            );

        if (
            markerIndex ===
            -1
        ) {
            return null;
        }

        let publicPath =
            pathname.slice(
                markerIndex +
                    uploadMarker.length
            );

        const segments =
            publicPath.split(
                "/"
            );

        const versionIndex =
            segments.findIndex(
                (
                    segment
                ) =>
                    /^v\d+$/.test(
                        segment
                    )
            );

        if (
            versionIndex !==
            -1
        ) {
            publicPath =
                segments
                    .slice(
                        versionIndex +
                            1
                    )
                    .join(
                        "/"
                    );
        }

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
// HELPER: DELETE CLOUDINARY IMAGE
// ============================================================

const deleteCloudinaryImage =
    async (
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
        } catch (
            error
        ) {
            console.error(
                "CLOUDINARY DELETE WARNING:",
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
        value ===
            undefined ||
        value === null ||
        value === ""
    ) {
        return defaultValue;
    }

    if (
        typeof value !==
        "string"
    ) {
        return value;
    }

    try {
        return JSON.parse(
            value
        );
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
        value ===
            undefined ||
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
// HELPER: PARSE WEIGHT
// ============================================================

const parseWeight = (
    value,
    defaultValue = 100
) => {
    if (
        value ===
            undefined ||
        value === null ||
        value === ""
    ) {
        return {
            value:
                defaultValue,
        };
    }

    const number =
        Number(
            value
        );

    if (
        !Number.isFinite(
            number
        ) ||
        number <= 0 ||
        !Number.isInteger(
            number
        )
    ) {
        return {
            error:
                "Product weight must be a whole number greater than 0 grams",
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
    if (
        !Array.isArray(
            options
        )
    ) {
        return "Product options must be an array";
    }

    const names =
        new Set();

    for (
        const option of options
    ) {
        if (
            !option ||
            typeof option !==
                "object"
        ) {
            return "Every product option must be an object";
        }

        const name =
            typeof option.name ===
            "string"
                ? option.name.trim()
                : "";

        if (!name) {
            return "Every product option must have a name";
        }

        const normalizedName =
            name.toLowerCase();

        if (
            names.has(
                normalizedName
            )
        ) {
            return `Duplicate product option "${name}"`;
        }

        names.add(
            normalizedName
        );

        if (
            !Array.isArray(
                option.values
            ) ||
            option.values.length ===
                0
        ) {
            return `Product option "${name}" must have at least one value`;
        }

        const values =
            new Set();

        for (
            const rawValue of
                option.values
        ) {
            const value =
                String(
                    rawValue ??
                        ""
                ).trim();

            if (!value) {
                return `Product option "${name}" contains an empty value`;
            }

            const normalizedValue =
                value.toLowerCase();

            if (
                values.has(
                    normalizedValue
                )
            ) {
                return `Duplicate value "${value}" in product option "${name}"`;
            }

            values.add(
                normalizedValue
            );
        }
    }

    return null;
};

// ============================================================
// VALIDATE ORDER SELECTIONS
// ============================================================

const validateOrderSelections =
    (
        selections
    ) => {
        if (
            !Array.isArray(
                selections
            )
        ) {
            return "Order-time selections must be an array";
        }

        const names =
            new Set();

        for (
            const selection of
                selections
        ) {
            if (
                !selection ||
                typeof selection !==
                    "object"
            ) {
                return "Every order-time selection must be an object";
            }

            const name =
                typeof selection.name ===
                "string"
                    ? selection.name.trim()
                    : "";

            if (!name) {
                return "Every order-time selection must have a name";
            }

            const normalizedName =
                name.toLowerCase();

            if (
                names.has(
                    normalizedName
                )
            ) {
                return `Duplicate order-time option "${name}"`;
            }

            names.add(
                normalizedName
            );

            if (
                !Array.isArray(
                    selection.values
                ) ||
                selection.values.length ===
                    0
            ) {
                return `Order-time option "${name}" must have at least one value`;
            }

            const values =
                new Set();

            for (
                const rawValue of
                    selection.values
            ) {
                const value =
                    String(
                        rawValue ??
                            ""
                    ).trim();

                if (!value) {
                    return `Order-time option "${name}" contains an empty value`;
                }

                const normalizedValue =
                    value.toLowerCase();

                if (
                    values.has(
                        normalizedValue
                    )
                ) {
                    return `Duplicate value "${value}" in order-time option "${name}"`;
                }

                values.add(
                    normalizedValue
                );
            }
        }

        return null;
    };

// ============================================================
// BUILD ORDER SELECTION DEFINITIONS
// ============================================================

const buildSelectionDefinitions =
    (
        orderSelections
    ) => {
        const definitions =
            new Map();

        for (
            const selection of
                orderSelections
        ) {
            definitions.set(
                selection.name.trim(),
                new Set(
                    selection.values.map(
                        (
                            value
                        ) =>
                            String(
                                value
                            ).trim()
                    )
                )
            );
        }

        return definitions;
    };

// ============================================================
// VALIDATE VARIANTS
// ============================================================

const validateVariants = (
    variants,
    orderSelections
) => {
    if (
        !Array.isArray(
            variants
        )
    ) {
        return "Variants must be an array";
    }

    const selectionDefinitions =
        buildSelectionDefinitions(
            orderSelections
        );

    const combinationKeys =
        new Set();

    const skuSet =
        new Set();

    for (
        const variant of
            variants
    ) {
        if (
            !variant ||
            typeof variant !==
                "object"
        ) {
            return "Every variant must be an object";
        }

        // ------------------------------------------------------
        // SELECTIONS
        // ------------------------------------------------------

        if (
            !variant.selections ||
            typeof variant.selections !==
                "object" ||
            Array.isArray(
                variant.selections
            )
        ) {
            return "Every variant must have valid selections";
        }

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

            const cleanValue =
                String(
                    value ??
                        ""
                ).trim();

            if (
                !cleanValue
            ) {
                return `Variant option "${name}" cannot be empty`;
            }

            const allowedValues =
                selectionDefinitions.get(
                    name
                );

            if (
                !allowedValues.has(
                    cleanValue
                )
            ) {
                return `Invalid value "${value}" for option "${name}"`;
            }
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
        // ORIGINAL PRICE
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

        if (
            variantOriginalPrice <
            variantPrice
        ) {
            return "Variant original price cannot be less than selling price";
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
        // DUPLICATE COMBINATION
        // ------------------------------------------------------

        const combinationKey =
            Array.from(
                selectionDefinitions.keys()
            )
                .sort()
                .map(
                    (
                        name
                    ) =>
                        `${name}=${String(
                            variant
                                .selections[
                                name
                            ]
                        ).trim()}`
                )
                .join(
                    "|"
                );

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
// NORMALIZE VARIANT
//
// IMPORTANT:
// Existing stock values are preserved.
// New variants get stock 0.
//
// Product Form cannot modify inventory.
// ============================================================

const normalizeVariants =
    (
        variants,
        existingVariants = []
    ) => {
        return variants.map(
            (
                variant
            ) => {
                const existing =
                    existingVariants.find(
                        (
                            oldVariant
                        ) => {
                            const oldSelections =
                                oldVariant.selections
                                    instanceof
                                    Map
                                    ? Object.fromEntries(
                                          oldVariant.selections.entries()
                                      )
                                    : oldVariant.selections ||
                                      {};

                            const newSelections =
                                variant.selections ||
                                {};

                            const oldKeys =
                                Object.keys(
                                    oldSelections
                                );

                            const newKeys =
                                Object.keys(
                                    newSelections
                                );

                            if (
                                oldKeys.length !==
                                newKeys.length
                            ) {
                                return false;
                            }

                            return oldKeys.every(
                                (
                                    key
                                ) =>
                                    String(
                                        oldSelections[
                                            key
                                        ]
                                    ) ===
                                    String(
                                        newSelections[
                                            key
                                        ]
                                    )
                            );
                        }
                    );

                const sellingPrice =
                    Number(
                        variant.price
                    );

                const originalPrice =
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
                    ...(existing?._id
                        ? {
                              _id:
                                  existing._id,
                          }
                        : {}),

                    selections:
                        variant.selections,

                    originalPrice,

                    price:
                        sellingPrice,

                    sku:
                        typeof variant.sku ===
                        "string"
                            ? variant.sku.trim()
                            : "",

                    // ------------------------------------------
                    // INVENTORY PRESERVATION
                    // ------------------------------------------

                    stock:
                        Number.isInteger(
                            existing?.stock
                        )
                            ? existing.stock
                            : 0,

                    lowStockThreshold:
                        Number.isInteger(
                            existing?.lowStockThreshold
                        )
                            ? existing.lowStockThreshold
                            : 5,

                    status:
                        existing?.status ||
                        variant.status ||
                        "active",
                };
            }
        );
    };

// ============================================================
// VALIDATE / NORMALIZE RELATED PRODUCTS
// ============================================================

const validateRelatedProducts =
    async (
        relatedProducts,
        currentProductId = null
    ) => {
        if (
            relatedProducts ===
                undefined ||
            relatedProducts ===
                null ||
            relatedProducts ===
                ""
        ) {
            return {
                value: [],
            };
        }

        if (
            !Array.isArray(
                relatedProducts
            )
        ) {
            return {
                error:
                    "Related products must be an array",
            };
        }

        if (
            relatedProducts.length >
            MAX_RELATED_PRODUCTS
        ) {
            return {
                error:
                    `A maximum of ${MAX_RELATED_PRODUCTS} related products is allowed`,
            };
        }

        const uniqueIds =
            [];

        const seen =
            new Set();

        for (
            const rawId of
                relatedProducts
        ) {
            const id =
                String(
                    rawId ??
                        ""
                ).trim();

            if (
                !mongoose.Types.ObjectId.isValid(
                    id
                )
            ) {
                return {
                    error:
                        `Invalid related product ID "${id}"`,
                };
            }

            if (
                currentProductId &&
                id ===
                    String(
                        currentProductId
                    )
            ) {
                return {
                    error:
                        "A product cannot be related to itself",
                };
            }

            if (
                seen.has(
                    id
                )
            ) {
                continue;
            }

            seen.add(
                id
            );

            uniqueIds.push(
                id
            );
        }

        if (
            uniqueIds.length ===
            0
        ) {
            return {
                value: [],
            };
        }

        const existingProducts =
            await Product.find(
                {
                    _id: {
                        $in:
                            uniqueIds,
                    },
                }
            ).select(
                "_id"
            );

        const existingIds =
            new Set(
                existingProducts.map(
                    (
                        product
                    ) =>
                        product._id.toString()
                )
            );

        const missingIds =
            uniqueIds.filter(
                (
                    id
                ) =>
                    !existingIds.has(
                        id
                    )
            );

        if (
            missingIds.length >
            0
        ) {
            return {
                error:
                    "One or more selected related products no longer exist",
            };
        }

        return {
            value:
                uniqueIds.map(
                    (
                        id
                    ) =>
                        new mongoose.Types.ObjectId(
                            id
                        )
                ),
        };
    };

// ============================================================
// HELPER: PARSE IMAGE ORDER
// ============================================================

const parseImageOrder =
    (
        value
    ) => {
        if (
            value ===
                undefined ||
            value === null ||
            value === ""
        ) {
            return null;
        }

        const parsed =
            parseJsonField(
                value,
                null
            );

        if (
            !Array.isArray(
                parsed
            )
        ) {
            return null;
        }

        return parsed;
    };

// ============================================================
// GET PRODUCTS
// @route GET /api/products
// @access Public
// ============================================================

export const getProducts =
    async (
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

            const filter =
                {};

            if (status) {
                filter.status =
                    status;
            }

            if (
                featured !==
                undefined
            ) {
                filter.featured =
                    featured ===
                    "true";
            }

            if (category) {
                filter.category =
                    category;
            }

            let query =
                Product.find(
                    filter
                )
                    .populate(
                        "category",
                        "name slug status"
                    )
                    .populate(
                        "relatedProducts",
                        "name slug images price originalPrice pricingType status featured"
                    )
                    .sort({
                        createdAt:
                            -1,
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
                    parsedLimit >
                        0
                ) {
                    query =
                        query.limit(
                            Math.min(
                                parsedLimit,
                                100
                            )
                        );
                }
            }

            const products =
                await query;

            return res
                .status(
                    200
                )
                .json({
                    success:
                        true,

                    products,
                });
        } catch (
            error
        ) {
            console.error(
                "GET PRODUCTS ERROR:",
                error
            );

            return res
                .status(
                    500
                )
                .json({
                    success:
                        false,

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

export const getProduct =
    async (
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
                    )
                        .populate(
                            "category",
                            "name slug status"
                        )
                        .populate(
                            "relatedProducts",
                            "name slug images price originalPrice pricingType status featured"
                        );
            }

            if (
                !product
            ) {
                product =
                    await Product.findOne(
                        {
                            slug:
                                identifier.toLowerCase(),
                        }
                    )
                        .populate(
                            "category",
                            "name slug status"
                        )
                        .populate(
                            "relatedProducts",
                            "name slug images price originalPrice pricingType status featured"
                        );
            }

            if (
                !product
            ) {
                return res
                    .status(
                        404
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Product not found",
                    });
            }

            return res
                .status(
                    200
                )
                .json({
                    success:
                        true,

                    product,
                });
        } catch (
            error
        ) {
            console.error(
                "GET PRODUCT ERROR:",
                error
            );

            return res
                .status(
                    500
                )
                .json({
                    success:
                        false,

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

export const createProduct =
    async (
        req,
        res
    ) => {
        try {
            const {
                category,
                name,
                description =
                    "",
                status =
                    "active",
            } = req.body;

            let {
                slug,
                price,
                originalPrice,
                pricingType =
                    "fixed",
                featured,
                options,
                orderSelections,
                variants,
                relatedProducts,
                weight,
            } = req.body;

            // ==================================================
            // REQUIRED
            // ==================================================

            if (
                !category
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Product category is required",
                    });
            }

            if (
                !mongoose.Types.ObjectId.isValid(
                    category
                )
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Invalid product category",
                    });
            }

            if (
                !name ||
                !name.trim()
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Product name is required",
                    });
            }

            // ==================================================
            // PRICING TYPE
            // ==================================================

            if (
                pricingType !==
                    "fixed" &&
                pricingType !==
                    "variants"
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            'Pricing type must be either "fixed" or "variants"',
                    });
            }

            // ==================================================
            // SLUG
            // ==================================================

            slug =
                slug?.trim()
                    ? generateSlug(
                          slug
                      )
                    : generateSlug(
                          name
                      );

            if (
                !slug
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Unable to generate product slug",
                    });
            }

            const existingProduct =
                await Product.findOne(
                    {
                        slug,
                    }
                );

            if (
                existingProduct
            ) {
                return res
                    .status(
                        409
                    )
                    .json({
                        success:
                            false,

                        message:
                            "A product with this slug already exists",
                    });
            }

            // ==================================================
            // WEIGHT
            // ==================================================

            const weightResult =
                parseWeight(
                    weight
                );

            if (
                weightResult.error
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            weightResult.error,
                    });
            }

            const parsedWeight =
                weightResult.value;

            // ==================================================
            // OPTIONS
            // ==================================================

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
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Product options must be an array",
                    });
            }

            const optionsError =
                validateOptions(
                    parsedOptions
                );

            if (
                optionsError
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            optionsError,
                    });
            }

            // ==================================================
            // ORDER SELECTIONS
            // ==================================================

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
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Order-time selections must be an array",
                    });
            }

            const orderSelectionsError =
                validateOrderSelections(
                    parsedOrderSelections
                );

            if (
                orderSelectionsError
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            orderSelectionsError,
                    });
            }

            // ==================================================
            // PRICING VALUES
            // ==================================================

            let parsedPrice =
                null;

            let parsedOriginalPrice =
                null;

            if (
                pricingType ===
                "fixed"
            ) {
                parsedPrice =
                    Number(
                        price
                    );

                parsedOriginalPrice =
                    Number(
                        originalPrice
                    );

                if (
                    !Number.isFinite(
                        parsedPrice
                    ) ||
                    parsedPrice <
                        0
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                "Selling price must be a valid non-negative number",
                        });
                }

                if (
                    !Number.isFinite(
                        parsedOriginalPrice
                    ) ||
                    parsedOriginalPrice <
                        0
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                "Original price must be a valid non-negative number",
                        });
                }

                if (
                    parsedOriginalPrice <
                    parsedPrice
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                "Original price cannot be less than selling price",
                        });
                }
            }

            // ==================================================
            // VARIANTS
            // ==================================================

            let parsedVariants =
                [];

            if (
                pricingType ===
                "variants"
            ) {
                parsedVariants =
                    parseJsonField(
                        variants,
                        null
                    );

                if (
                    !Array.isArray(
                        parsedVariants
                    )
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                "Variants must be an array",
                        });
                }

                if (
                    parsedVariants.length ===
                    0
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                "At least one variant is required for variant pricing",
                        });
                }

                const variantError =
                    validateVariants(
                        parsedVariants,
                        parsedOrderSelections
                    );

                if (
                    variantError
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                variantError,
                        });
                }

                parsedVariants =
                    normalizeVariants(
                        parsedVariants,
                        []
                    );

                parsedPrice =
                    null;

                parsedOriginalPrice =
                    null;
            }

            // ==================================================
            // RELATED PRODUCTS
            // ==================================================

            const parsedRelatedProducts =
                parseJsonField(
                    relatedProducts,
                    []
                );

            const relatedProductsResult =
                await validateRelatedProducts(
                    parsedRelatedProducts
                );

            if (
                relatedProductsResult.error
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            relatedProductsResult.error,
                    });
            }

            // ==================================================
            // FEATURED
            // ==================================================

            const parsedFeatured =
                parseBoolean(
                    featured,
                    false
                );

            // ==================================================
            // IMAGES
            // ==================================================

            const imageUrls =
                [];

            if (
                req.files?.length
            ) {
                if (
                    req.files.length >
                    10
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                "Maximum 10 images allowed",
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
                            .status(
                                400
                            )
                            .json({
                                success:
                                    false,

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

            // ==================================================
            // CREATE
            //
            // IMPORTANT:
            //
            // No stock / lowStockThreshold is accepted from
            // the Product Form.
            //
            // New products receive inventory defaults from
            // the Product model.
            // ==================================================

            const product =
                await Product.create(
                    {
                        category,

                        name:
                            name.trim(),

                        slug,

                        description:
                            description?.trim() ||
                            "",

                        weight:
                            parsedWeight,

                        pricingType,

                        originalPrice:
                            parsedOriginalPrice,

                        price:
                            parsedPrice,

                        // Inventory defaults are intentionally
                        // handled by the model / inventory system.
                        //
                        // We do NOT read stock from req.body.

                        images:
                            imageUrls,

                        options:
                            parsedOptions,

                        orderSelections:
                            parsedOrderSelections,

                        variants:
                            parsedVariants,

                        relatedProducts:
                            relatedProductsResult.value,

                        status,

                        featured:
                            parsedFeatured,
                    }
                );

            // ==================================================
            // POPULATE
            // ==================================================

            const populatedProduct =
                await Product.findById(
                    product._id
                )
                    .populate(
                        "category",
                        "name slug status"
                    )
                    .populate(
                        "relatedProducts",
                        "name slug images price originalPrice pricingType status featured"
                    );

            return res
                .status(
                    201
                )
                .json({
                    success:
                        true,

                    product:
                        populatedProduct,
                });
        } catch (
            error
        ) {
            console.error(
                "CREATE PRODUCT ERROR:",
                error
            );

            if (
                error.name ===
                "ValidationError"
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            Object.values(
                                error.errors
                            )
                                .map(
                                    (
                                        err
                                    ) =>
                                        err.message
                                )
                                .join(
                                    ", "
                                ),
                    });
            }

            if (
                error.code ===
                11000
            ) {
                return res
                    .status(
                        409
                    )
                    .json({
                        success:
                            false,

                        message:
                            "A product with this slug already exists",
                    });
            }

            return res
                .status(
                    500
                )
                .json({
                    success:
                        false,

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

export const updateProduct =
    async (
        req,
        res
    ) => {
        try {
            const product =
                await Product.findById(
                    req.params.id
                );

            if (
                !product
            ) {
                return res
                    .status(
                        404
                    )
                    .json({
                        success:
                            false,

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
                originalPrice,
                pricingType,
                featured,
                options,
                orderSelections,
                variants,
                existingImages,
                imageOrder,
                relatedProducts,
                weight,
            } = req.body;

            // ==================================================
            // CATEGORY
            // ==================================================

            const finalCategory =
                category ||
                product.category;

            if (
                !mongoose.Types.ObjectId.isValid(
                    finalCategory
                )
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Invalid product category",
                    });
            }

            // ==================================================
            // NAME
            // ==================================================

            const finalName =
                name?.trim() ||
                product.name;

            // ==================================================
            // SLUG
            // ==================================================

            let finalSlug =
                product.slug;

            if (
                slug !==
                undefined
            ) {
                finalSlug =
                    generateSlug(
                        slug
                    );
            } else if (
                name &&
                name.trim() !==
                    product.name
            ) {
                finalSlug =
                    generateSlug(
                        name
                    );
            }

            if (
                !finalSlug
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Unable to generate product slug",
                    });
            }

            const slugConflict =
                await Product.findOne(
                    {
                        slug:
                            finalSlug,

                        _id: {
                            $ne:
                                req.params.id,
                        },
                    }
                );

            if (
                slugConflict
            ) {
                return res
                    .status(
                        409
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Another product uses this slug",
                    });
            }

            // ==================================================
            // PRICING TYPE
            // ==================================================

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
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            'Pricing type must be either "fixed" or "variants"',
                    });
            }

            // ==================================================
            // WEIGHT
            // ==================================================

            const weightResult =
                weight ===
                    undefined
                    ? {
                          value:
                              product.weight ||
                              100,
                      }
                    : parseWeight(
                          weight
                      );

            if (
                weightResult.error
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            weightResult.error,
                    });
            }

            const finalWeight =
                weightResult.value;

            // ==================================================
            // OPTIONS
            // ==================================================

            let finalOptions =
                product.options ||
                [];

            if (
                options !==
                undefined
            ) {
                const parsedOptions =
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
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                "Product options must be an array",
                        });
                }

                const optionsError =
                    validateOptions(
                        parsedOptions
                    );

                if (
                    optionsError
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                optionsError,
                        });
                }

                finalOptions =
                    parsedOptions;
            }

            // ==================================================
            // ORDER SELECTIONS
            // ==================================================

            let finalOrderSelections =
                product.orderSelections ||
                [];

            if (
                orderSelections !==
                undefined
            ) {
                const parsedOrderSelections =
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
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                "Order-time selections must be an array",
                        });
                }

                const orderSelectionsError =
                    validateOrderSelections(
                        parsedOrderSelections
                    );

                if (
                    orderSelectionsError
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                orderSelectionsError,
                        });
                }

                finalOrderSelections =
                    parsedOrderSelections;
            }

            // ==================================================
            // PRICING
            // ==================================================

            let finalPrice =
                product.price;

            let finalOriginalPrice =
                product.originalPrice;

            let finalVariants =
                product.variants ||
                [];

            // ==================================================
            // FIXED PRICING
            // ==================================================

            if (
                finalPricingType ===
                "fixed"
            ) {
                if (
                    price !==
                    undefined
                ) {
                    const parsedPrice =
                        Number(
                            price
                        );

                    if (
                        !Number.isFinite(
                            parsedPrice
                        ) ||
                        parsedPrice <
                            0
                    ) {
                        return res
                            .status(
                                400
                            )
                            .json({
                                success:
                                    false,

                                message:
                                    "Selling price must be a valid non-negative number",
                            });
                    }

                    finalPrice =
                        parsedPrice;
                }

                if (
                    originalPrice !==
                    undefined
                ) {
                    const parsedOriginalPrice =
                        Number(
                            originalPrice
                        );

                    if (
                        !Number.isFinite(
                            parsedOriginalPrice
                        ) ||
                        parsedOriginalPrice <
                            0
                    ) {
                        return res
                            .status(
                                400
                            )
                            .json({
                                success:
                                    false,

                                message:
                                    "Original price must be a valid non-negative number",
                            });
                    }

                    finalOriginalPrice =
                        parsedOriginalPrice;
                }

                if (
                    finalPrice ===
                        null ||
                    finalPrice ===
                        undefined
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                "Selling price is required for fixed pricing",
                        });
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
                    finalOriginalPrice <
                    finalPrice
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                "Original price cannot be less than selling price",
                        });
                }

                // Fixed products do not use variants.
                finalVariants =
                    [];
            }

            // ==================================================
            // VARIANT PRICING
            // ==================================================

            if (
                finalPricingType ===
                "variants"
            ) {
                finalPrice =
                    null;

                finalOriginalPrice =
                    null;

                if (
                    variants !==
                    undefined
                ) {
                    const parsedVariants =
                        parseJsonField(
                            variants,
                            null
                        );

                    if (
                        !Array.isArray(
                            parsedVariants
                        )
                    ) {
                        return res
                            .status(
                                400
                            )
                            .json({
                                success:
                                    false,

                                message:
                                    "Variants must be an array",
                            });
                    }

                    if (
                        parsedVariants.length ===
                        0
                    ) {
                        return res
                            .status(
                                400
                            )
                            .json({
                                success:
                                    false,

                                message:
                                    "At least one variant is required for variant pricing",
                            });
                    }

                    const variantError =
                        validateVariants(
                            parsedVariants,
                            finalOrderSelections
                        );

                    if (
                        variantError
                    ) {
                        return res
                            .status(
                                400
                            )
                            .json({
                                success:
                                    false,

                                message:
                                    variantError,
                            });
                    }

                    /*
                     * IMPORTANT:
                     *
                     * Inventory is preserved from existing variants.
                     *
                     * The Product Form cannot change:
                     *
                     * stock
                     * lowStockThreshold
                     *
                     * This prevents a normal product edit from
                     * accidentally resetting inventory.
                     */

                    finalVariants =
                        normalizeVariants(
                            parsedVariants,
                            product.variants ||
                                []
                        );
                }
            }

            // ==================================================
            // RELATED PRODUCTS
            //
            // If field is supplied, replace the complete list.
            //
            // This allows:
            //
            // [] = remove all related products
            //
            // ["id1", "id2"] = set selected products
            //
            // If omitted entirely, keep the existing list.
            // ==================================================

            let finalRelatedProducts =
                product.relatedProducts ||
                [];

            if (
                relatedProducts !==
                undefined
            ) {
                const parsedRelatedProducts =
                    parseJsonField(
                        relatedProducts,
                        null
                    );

                if (
                    !Array.isArray(
                        parsedRelatedProducts
                    )
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                "Related products must be an array",
                        });
                }

                const relatedProductsResult =
                    await validateRelatedProducts(
                        parsedRelatedProducts,
                        product._id
                    );

                if (
                    relatedProductsResult.error
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                relatedProductsResult.error,
                        });
                }

                finalRelatedProducts =
                    relatedProductsResult.value;
            }

            // ==================================================
            // FEATURED
            // ==================================================

            let finalFeatured =
                product.featured;

            if (
                featured !==
                undefined
            ) {
                finalFeatured =
                    parseBoolean(
                        featured,
                        product.featured
                    );
            }

            // ==================================================
            // STATUS
            // ==================================================

            const finalStatus =
                status ||
                product.status ||
                "active";

            if (
                ![
                    "active",
                    "inactive",
                ].includes(
                    finalStatus
                )
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Invalid product status",
                    });
            }

            // ==================================================
            // IMAGES
            //
            // imageOrder is supplied by the frontend.
            //
            // Existing image URLs are preserved.
            // New uploads are inserted where their
            // __NEW_IMAGE_X__ placeholders appear.
            // ==================================================

            const uploadedImageUrls =
                [];

            if (
                req.files?.length
            ) {
                if (
                    req.files.length >
                    10
                ) {
                    return res
                        .status(
                            400
                        )
                        .json({
                            success:
                                false,

                            message:
                                "Maximum 10 images allowed",
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
                            .status(
                                400
                            )
                            .json({
                                success:
                                    false,

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

            let finalImages =
                [];

            const parsedImageOrder =
                parseImageOrder(
                    imageOrder
                );

            if (
                parsedImageOrder
            ) {
                let newImageIndex =
                    0;

                for (
                    const imageEntry of
                        parsedImageOrder
                ) {
                    if (
                        typeof imageEntry !==
                        "string"
                    ) {
                        continue;
                    }

                    if (
                        imageEntry.startsWith(
                            "__NEW_IMAGE_"
                        )
                    ) {
                        const uploadedUrl =
                            uploadedImageUrls[
                                newImageIndex
                            ];

                        if (
                            uploadedUrl
                        ) {
                            finalImages.push(
                                uploadedUrl
                            );

                            newImageIndex +=
                                1;
                        }

                        continue;
                    }

                    if (
                        imageEntry.trim()
                    ) {
                        finalImages.push(
                            imageEntry
                        );
                    }
                }

                /*
                 * Safety:
                 * If uploads exist but a malformed imageOrder
                 * did not reference them, append them instead
                 * of silently losing uploaded images.
                 */

                while (
                    newImageIndex <
                    uploadedImageUrls.length
                ) {
                    finalImages.push(
                        uploadedImageUrls[
                            newImageIndex
                        ]
                    );

                    newImageIndex +=
                        1;
                }
            } else {
                /*
                 * Backward compatibility:
                 *
                 * If imageOrder isn't supplied, keep old images
                 * and append newly uploaded images.
                 */

                finalImages = [
                    ...(product.images ||
                        []),
                    ...uploadedImageUrls,
                ];
            }

            if (
                finalImages.length >
                10
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Maximum 10 images allowed",
                    });
            }

            // ==================================================
            // FIND REMOVED CLOUDINARY IMAGES
            // ==================================================

            const oldImages =
                product.images ||
                [];

            const removedImages =
                oldImages.filter(
                    (
                        oldImage
                    ) =>
                        !finalImages.includes(
                            oldImage
                        )
                );

            // ==================================================
            // UPDATE PRODUCT
            //
            // CRITICAL:
            //
            // stock and lowStockThreshold are NOT included.
            //
            // Existing inventory therefore remains untouched.
            // ==================================================

            product.category =
                finalCategory;

            product.name =
                finalName;

            product.slug =
                finalSlug;

            product.description =
                description !==
                undefined
                    ? description.trim()
                    : product.description;

            product.weight =
                finalWeight;

            product.pricingType =
                finalPricingType;

            product.originalPrice =
                finalOriginalPrice;

            product.price =
                finalPrice;

            product.images =
                finalImages;

            product.options =
                finalOptions;

            product.orderSelections =
                finalOrderSelections;

            product.variants =
                finalVariants;

            product.relatedProducts =
                finalRelatedProducts;

            product.status =
                finalStatus;

            product.featured =
                finalFeatured;

            /*
             * DO NOT TOUCH:
             *
             * product.stock
             * product.lowStockThreshold
             *
             * Inventory is managed separately.
             */

            await product.save();

            // ==================================================
            // DELETE REMOVED CLOUDINARY IMAGES
            // ==================================================

            if (
                removedImages.length >
                0
            ) {
                await Promise.all(
                    removedImages.map(
                        (
                            image
                        ) =>
                            deleteCloudinaryImage(
                                image
                            )
                    )
                );
            }

            // ==================================================
            // POPULATE
            // ==================================================

            const populatedProduct =
                await Product.findById(
                    product._id
                )
                    .populate(
                        "category",
                        "name slug status"
                    )
                    .populate(
                        "relatedProducts",
                        "name slug images price originalPrice pricingType status featured"
                    );

            return res
                .status(
                    200
                )
                .json({
                    success:
                        true,

                    product:
                        populatedProduct,
                });
        } catch (
            error
        ) {
            console.error(
                "UPDATE PRODUCT ERROR:",
                error
            );

            if (
                error.name ===
                "CastError"
            ) {
                return res
                    .status(
                        404
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Product not found",
                    });
            }

            if (
                error.name ===
                "ValidationError"
            ) {
                return res
                    .status(
                        400
                    )
                    .json({
                        success:
                            false,

                        message:
                            Object.values(
                                error.errors
                            )
                                .map(
                                    (
                                        err
                                    ) =>
                                        err.message
                                )
                                .join(
                                    ", "
                                ),
                    });
            }

            if (
                error.code ===
                11000
            ) {
                return res
                    .status(
                        409
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Another product uses this slug",
                    });
            }

            return res
                .status(
                    500
                )
                .json({
                    success:
                        false,

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

export const deleteProduct =
    async (
        req,
        res
    ) => {
        try {
            const product =
                await Product.findById(
                    req.params.id
                );

            if (
                !product
            ) {
                return res
                    .status(
                        404
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Product not found",
                    });
            }

            /*
             * Remove this product from other products'
             * relatedProducts arrays before deleting it.
             *
             * This prevents dangling references.
             */

            await Product.updateMany(
                {
                    relatedProducts:
                        product._id,
                },
                {
                    $pull: {
                        relatedProducts:
                            product._id,
                    },
                }
            );

            // ==================================================
            // DELETE PRODUCT IMAGES
            // ==================================================

            if (
                Array.isArray(
                    product.images
                ) &&
                product.images.length >
                    0
            ) {
                await Promise.all(
                    product.images.map(
                        (
                            image
                        ) =>
                            deleteCloudinaryImage(
                                image
                            )
                    )
                );
            }

            await product.deleteOne();

            return res
                .status(
                    200
                )
                .json({
                    success:
                        true,

                    message:
                        "Product deleted successfully",
                });
        } catch (
            error
        ) {
            console.error(
                "DELETE PRODUCT ERROR:",
                error
            );

            if (
                error.name ===
                "CastError"
            ) {
                return res
                    .status(
                        404
                    )
                    .json({
                        success:
                            false,

                        message:
                            "Product not found",
                    });
            }

            return res
                .status(
                    500
                )
                .json({
                    success:
                        false,

                    message:
                        error.message ||
                        "Failed to delete product",
                });
        }
    };