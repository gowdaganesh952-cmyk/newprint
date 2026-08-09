import multer from 'multer';

// Use memory storage to hold files in buffer for Cloudinary streaming
const storage = multer.memoryStorage();

// Accept only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per image
        files: 10 // Max 10 files
    }
});