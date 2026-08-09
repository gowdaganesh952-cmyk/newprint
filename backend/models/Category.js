import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
    },
    slug: {
        type: String,
        required: [true, 'Category slug is required'],
        trim: true,
        lowercase: true,
        unique: true,
    },
    description: {
        type: String,
        trim: true,
        default: "",
    },
    image: {
        type: String,
        default: "", // Cloudinary implementation deferred to Phase 2
    },
    priority: {
        type: Number,
        default: 1,
        min: [1, 'Priority must be at least 1'],
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    }
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);