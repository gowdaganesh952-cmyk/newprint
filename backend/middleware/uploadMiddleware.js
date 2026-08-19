import multer from "multer";

/* ============================================================
   STORAGE
============================================================ */

/*
 * Keep uploaded files in memory.
 *
 * The cart controller sends the buffer
 * to Cloudinary.
 */

const storage =
  multer.memoryStorage();

/* ============================================================
   FILE FILTER
============================================================ */

/*
 * Only image files are allowed.
 */

const fileFilter = (
  req,
  file,
  cb
) => {
  if (
    file?.mimetype?.startsWith(
      "image/"
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Not an image! Please upload only images."
      ),
      false
    );
  }
};

/* ============================================================
   MULTER CONFIGURATION
============================================================ */

/*
 * Maximum size:
 *
 * 10 MB PER IMAGE
 *
 * 10 * 1024 * 1024
 * = 10,485,760 bytes
 *
 * Maximum files:
 *
 * 10 files per multipart request.
 *
 * The cart frontend currently uploads
 * ONE print image per request, so this
 * does not allow bypassing the 6-image
 * limit for a physical product.
 */

export const upload =
  multer({
    storage,

    fileFilter,

    limits: {
      fileSize:
        10 * 1024 * 1024,

      files: 10,
    },
  });