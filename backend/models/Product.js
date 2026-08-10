import mongoose from 'mongoose';

const productOptionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    values: [{ type: String, required: true }]
}, { _id: false });

// NEW: Schema for Order Selections
const productOrderSelectionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    values: [{ type: String, required: true }],
    required: { type: Boolean, default: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Product category is required']
    },
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'Product slug is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    price: {
        type: Number,
        min: [0, 'Price cannot be negative']
    },
    images: {
        type: [String],
        validate: [arrayLimit, 'Exceeds the limit of 10 images']
    },
    
    // Existing Content / Information
    options: [productOptionSchema],
    
    // NEW: Customer Selections
    orderSelections: [productOrderSelectionSchema],

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    featured: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

function arrayLimit(val) {
    return val.length <= 10;
}

export default mongoose.model('Product', productSchema);