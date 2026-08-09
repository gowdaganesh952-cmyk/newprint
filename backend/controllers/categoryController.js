import Category from '../models/Category.js';

// Helper to normalize strings into valid URL slugs
const generateSlug = (text) => {
    if (!text) return "";
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

// @route   GET /api/categories (Public)
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ priority: 1, name: 1 });
        res.status(200).json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @route   GET /api/categories/:id (Public)
export const getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: "Category not found" });
        
        res.status(200).json({ success: true, category });
    } catch (error) {
        if (error.name === 'CastError') return res.status(404).json({ success: false, message: "Category not found" });
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @route   POST /api/categories (Admin Only)
export const createCategory = async (req, res) => {
    try {
        const { name, description, image, priority, status } = req.body;
        let { slug } = req.body;

        if (!name) return res.status(400).json({ success: false, message: "Category name is required" });

        // Auto-generate slug if missing, normalize if provided
        slug = slug ? generateSlug(slug) : generateSlug(name);
        if (!slug) return res.status(400).json({ success: false, message: "Valid slug could not be generated" });

        // Uniqueness check
        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
            return res.status(409).json({ success: false, message: "Category with this slug already exists" });
        }

        const category = await Category.create({ name, slug, description, image, priority, status });
        res.status(201).json({ success: true, category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @route   PUT /api/categories/:id (Admin Only)
export const updateCategory = async (req, res) => {
    try {
        const { name, description, image, priority, status } = req.body;
        let { slug } = req.body;

        let category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: "Category not found" });

        if (slug) {
            slug = generateSlug(slug);
            const slugConflict = await Category.findOne({ slug, _id: { $ne: req.params.id } });
            if (slugConflict) return res.status(409).json({ success: false, message: "Another category with this slug already exists" });
        } else if (name && name !== category.name) {
            slug = generateSlug(name);
            const slugConflict = await Category.findOne({ slug, _id: { $ne: req.params.id } });
            if (slugConflict) return res.status(409).json({ success: false, message: "Auto-generated slug conflicts with existing category" });
        } else {
            slug = category.slug; // Keep existing
        }

        category = await Category.findByIdAndUpdate(
            req.params.id,
            { name: name || category.name, slug, description, image, priority, status },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, category });
    } catch (error) {
        if (error.name === 'CastError') return res.status(404).json({ success: false, message: "Category not found" });
        res.status(500).json({ success: false, message: error.message });
    }
};

// @route   PATCH /api/categories/:id/status (Admin Only)
export const updateCategoryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!category) return res.status(404).json({ success: false, message: "Category not found" });
        res.status(200).json({ success: true, category });
    } catch (error) {
        if (error.name === 'CastError') return res.status(404).json({ success: false, message: "Category not found" });
        res.status(500).json({ success: false, message: error.message });
    }
};

// @route   DELETE /api/categories/:id (Admin Only)
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: "Category not found" });

        // TODO: Phase 2 - Add Product dependency check here
        // const hasProducts = await Product.exists({ category: req.params.id });
        // if (hasProducts) return res.status(400).json({ success: false, message: "Cannot delete category linked to products" });

        await category.deleteOne();
        res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        if (error.name === 'CastError') return res.status(404).json({ success: false, message: "Category not found" });
        res.status(500).json({ success: false, message: error.message });
    }
};