import mongoose from 'mongoose';
import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';

// ============================================================
// HELPER: GENERATE SLUG
// ============================================================

const generateSlug = (text) => {
    if (!text) return "";

    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

// ============================================================
// HELPER: UPLOAD BUFFER TO CLOUDINARY
// ============================================================

const uploadStream = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'new_print_products'
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
// GET PRODUCTS
// @route   GET /api/products
// @access  Public
// ============================================================

export const getProducts = async (req, res) => {
    try {
        const {
            status,
            featured,
            category,
            limit
        } = req.query;

        const filter = {};

        // ------------------------------------------------------
        // STATUS
        // ------------------------------------------------------

        if (status) {
            filter.status = status;
        }

        // ------------------------------------------------------
        // FEATURED
        // ------------------------------------------------------

        if (featured !== undefined) {
            filter.featured = featured === "true";
        }

        // ------------------------------------------------------
        // CATEGORY
        // ------------------------------------------------------

        if (category) {
            filter.category = category;
        }

        // ------------------------------------------------------
        // QUERY
        // ------------------------------------------------------

        let query = Product.find(filter)
            .populate(
                "category",
                "name slug status"
            )
            .sort({
                createdAt: -1
            });

        // ------------------------------------------------------
        // LIMIT
        // ------------------------------------------------------

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

        // ------------------------------------------------------
        // RESPONSE
        // ------------------------------------------------------

        return res.status(200).json({
            success: true,
            products
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
                "Failed to fetch products"
        });
    }
};

// ============================================================
// GET SINGLE PRODUCT (UPDATED FOR SLUG SUPPORT)
// @route   GET /api/products/:id
// @access  Public
// ============================================================

export const getProduct = async (req, res) => {
    try {
        const identifier = req.params.id;

        let product;

        // 1. If identifier is a valid MongoDB ObjectId, try to find by _id first.
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            product = await Product.findById(identifier).populate(
                "category",
                "name slug"
            );
        }

        // 2. If not found by ID (or not a valid ID), try finding by slug.
        if (!product) {
            product = await Product.findOne({
                slug: identifier.toLowerCase()
            }).populate(
                "category",
                "name slug"
            );
        }

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            product
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
                "Failed to fetch product"
        });
    }
};

// ============================================================
// CREATE PRODUCT
// @route   POST /api/products
// @access  Admin Only
// ============================================================

export const createProduct = async (req, res) => {
    try {
        const {
            category,
            name,
            description = "",
            status = "active"
        } = req.body;

        let {
            slug,
            price,
            featured,
            options,
            orderSelections 
        } = req.body;

        // ------------------------------------------------------
        // REQUIRED FIELDS
        // ------------------------------------------------------

        if (!category) {
            return res.status(400).json({
                success: false,
                message:
                    "Product category is required"
            });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Product name is required"
            });
        }

        // ------------------------------------------------------
        // SLUG
        // ------------------------------------------------------

        slug = slug?.trim()
            ? generateSlug(slug)
            : generateSlug(name);

        if (!slug) {
            return res.status(400).json({
                success: false,
                message:
                    "Unable to generate product slug"
            });
        }

        const existingProduct =
            await Product.findOne({
                slug
            });

        if (existingProduct) {
            return res.status(409).json({
                success: false,
                message:
                    "A product with this slug already exists"
            });
        }

        // ------------------------------------------------------
        // PRICE
        // ------------------------------------------------------

        let parsedPrice;

        if (
            price !== undefined &&
            price !== ""
        ) {
            parsedPrice = Number(price);

            if (Number.isNaN(parsedPrice)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Price must be a valid number"
                });
            }

            if (parsedPrice < 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Price cannot be negative"
                });
            }
        }

        // ------------------------------------------------------
        // FEATURED
        // ------------------------------------------------------

        const parsedFeatured =
            featured === true ||
            featured === "true";

        // ------------------------------------------------------
        // OPTIONS (Existing Info)
        // ------------------------------------------------------

        let parsedOptions = [];

        if (options) {
            try {

                parsedOptions =
                    typeof options === "string"
                        ? JSON.parse(options)
                        : options;

            } catch (error) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid product options"
                });
            }
        }

        if (!Array.isArray(parsedOptions)) {
            return res.status(400).json({
                success: false,
                message:
                    "Product options must be an array"
            });
        }

        // ------------------------------------------------------
        // VALIDATE OPTIONS
        // ------------------------------------------------------

        for (const option of parsedOptions) {

            if (!option.name?.trim()) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Option name cannot be empty"
                });
            }

            if (
                !Array.isArray(option.values) ||
                option.values.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Option "${option.name}" must have at least one value`
                });
            }
        }

        // ------------------------------------------------------
        // ORDER SELECTIONS
        // ------------------------------------------------------
        
        let parsedOrderSelections = [];

        if (orderSelections) {
            try {
                parsedOrderSelections =
                    typeof orderSelections === "string"
                        ? JSON.parse(orderSelections)
                        : orderSelections;
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid order selections"
                });
            }
        }

        if (!Array.isArray(parsedOrderSelections)) {
            return res.status(400).json({
                success: false,
                message: "Order selections must be an array"
            });
        }

        for (const sel of parsedOrderSelections) {
            if (!sel.name?.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Order selection name cannot be empty"
                });
            }

            if (
                !Array.isArray(sel.values) ||
                sel.values.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Order selection "${sel.name}" must have at least one value`
                });
            }
        }

        // ------------------------------------------------------
        // UPLOAD IMAGES
        // ------------------------------------------------------

        const imageUrls = [];

        if (req.files?.length) {

            for (const file of req.files) {

                if (!file.buffer) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid image upload"
                    });
                }

                const url =
                    await uploadStream(
                        file.buffer
                    );

                imageUrls.push(url);
            }
        }

        // ------------------------------------------------------
        // CREATE
        // ------------------------------------------------------

        const product =
            await Product.create({
                category,
                name: name.trim(),
                slug,
                description:
                    description.trim(),
                price: parsedPrice,
                images: imageUrls,
                options: parsedOptions,
                orderSelections: parsedOrderSelections,
                status,
                featured: parsedFeatured
            });

        // ------------------------------------------------------
        // POPULATE CATEGORY
        // ------------------------------------------------------

        const populatedProduct =
            await Product
                .findById(product._id)
                .populate(
                    "category",
                    "name slug status"
                );

        return res.status(201).json({
            success: true,
            product: populatedProduct
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
                        .join(", ")
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "A product with this slug already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to create product"
        });
    }
};

// ============================================================
// UPDATE PRODUCT
// @route   PUT /api/products/:id
// @access  Admin Only
// ============================================================

export const updateProduct = async (req, res) => {
    try {
        const {
            category,
            name,
            description,
            status
        } = req.body;

        let {
            slug,
            price,
            featured,
            options,
            orderSelections, 
            existingImages
        } = req.body;

        let product =
            await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // ------------------------------------------------------
        // SLUG
        // ------------------------------------------------------

        if (slug) {
            slug = generateSlug(slug);

            const slugConflict =
                await Product.findOne({
                    slug,
                    _id: {
                        $ne: req.params.id
                    }
                });

            if (slugConflict) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Another product uses this slug"
                });
            }
        } else if (
            name &&
            name !== product.name
        ) {
            slug = generateSlug(name);

            const slugConflict =
                await Product.findOne({
                    slug,
                    _id: {
                        $ne: req.params.id
                    }
                });

            if (slugConflict) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Auto-generated slug conflicts"
                });
            }
        } else {
            slug = product.slug;
        }

        // ------------------------------------------------------
        // PRICE
        // ------------------------------------------------------

        let parsedPrice = product.price;

        if (
            price !== undefined &&
            price !== ""
        ) {
            parsedPrice = Number(price);

            if (Number.isNaN(parsedPrice)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Price must be a valid number"
                });
            }

            if (parsedPrice < 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Price cannot be negative"
                });
            }
        }

        // ------------------------------------------------------
        // FEATURED
        // ------------------------------------------------------

        let parsedFeatured =
            product.featured;

        if (featured !== undefined) {
            parsedFeatured =
                featured === true ||
                featured === "true";
        }

        // ------------------------------------------------------
        // OPTIONS (Existing Info)
        // ------------------------------------------------------

        let parsedOptions =
            product.options || [];

        if (options !== undefined) {
            try {
                parsedOptions =
                    typeof options === "string"
                        ? JSON.parse(options)
                        : options;
            } catch {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid product options"
                });
            }
        }

        if (!Array.isArray(parsedOptions)) {
            return res.status(400).json({
                success: false,
                message:
                    "Product options must be an array"
            });
        }

        // ------------------------------------------------------
        // VALIDATE OPTIONS
        // ------------------------------------------------------

        for (const option of parsedOptions) {
            if (!option.name?.trim()) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Option name cannot be empty"
                });
            }

            if (
                !Array.isArray(option.values) ||
                option.values.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Option "${option.name}" must have at least one value`
                });
            }
        }

        // ------------------------------------------------------
        // ORDER SELECTIONS 
        // ------------------------------------------------------

        let parsedOrderSelections = product.orderSelections || [];

        if (orderSelections !== undefined) {
            try {
                parsedOrderSelections =
                    typeof orderSelections === "string"
                        ? JSON.parse(orderSelections)
                        : orderSelections;
            } catch {
                return res.status(400).json({
                    success: false,
                    message: "Invalid order selections"
                });
            }
        }

        if (!Array.isArray(parsedOrderSelections)) {
            return res.status(400).json({
                success: false,
                message: "Order selections must be an array"
            });
        }

        for (const sel of parsedOrderSelections) {
            if (!sel.name?.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Order selection name cannot be empty"
                });
            }

            if (
                !Array.isArray(sel.values) ||
                sel.values.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Order selection "${sel.name}" must have at least one value`
                });
            }
        }

        // ------------------------------------------------------
        // EXISTING IMAGES
        // ------------------------------------------------------

        let finalImages = [];

        if (existingImages) {
            finalImages = Array.isArray(existingImages)
                ? existingImages
                : [existingImages];
        } else {
            finalImages = product.images || [];
        }

        // ------------------------------------------------------
        // NEW IMAGES
        // ------------------------------------------------------

        if (
            req.files &&
            req.files.length > 0
        ) {
            for (const file of req.files) {
                if (!file.buffer) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid image upload"
                    });
                }

                const url =
                    await uploadStream(
                        file.buffer
                    );

                finalImages.push(url);
            }
        }

        // ------------------------------------------------------
        // IMAGE LIMIT
        // ------------------------------------------------------

        if (finalImages.length > 10) {
            return res.status(400).json({
                success: false,
                message:
                    "Maximum 10 images allowed"
            });
        }

        // ------------------------------------------------------
        // UPDATE
        // ------------------------------------------------------

        product =
            await Product.findByIdAndUpdate(
                req.params.id,
                {
                    category,
                    name,
                    slug,
                    description,
                    price: parsedPrice,
                    status,
                    featured: parsedFeatured,
                    options: parsedOptions,
                    orderSelections: parsedOrderSelections, 
                    images: finalImages
                },
                {
                    new: true,
                    runValidators: true
                }
            ).populate(
                "category",
                "name slug status"
            );

        return res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        console.error(
            "UPDATE PRODUCT ERROR:",
            error
        );

        if (error.name === "CastError") {
            return res.status(404).json({
                success: false,
                message: "Product not found"
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
                        .join(", ")
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Another product uses this slug"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to update product"
        });
    }
};

// ============================================================
// DELETE PRODUCT
// @route   DELETE /api/products/:id
// @access  Admin Only
// ============================================================

export const deleteProduct = async (req, res) => {
    try {
        const product =
            await Product.findById(
                req.params.id
            );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        await product.deleteOne();

        return res.status(200).json({
            success: true,
            message:
                "Product deleted successfully"
        });

    } catch (error) {
        console.error(
            "DELETE PRODUCT ERROR:",
            error
        );

        if (error.name === "CastError") {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to delete product"
        });
    }
};