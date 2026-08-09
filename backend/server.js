import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { clerkMiddleware } from "@clerk/express";

import connectDB from "./config/db.js";
import cloudinary from "./config/cloudinary.js";

import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";

// ============================================================
// ENVIRONMENT
// ============================================================

dotenv.config();

// ============================================================
// APP
// ============================================================

const app = express();

// ============================================================
// TRUST PROXY
// ============================================================

/*
 * Required when running behind Vercel / Render / another
 * reverse proxy.
 *
 * This allows express-rate-limit to correctly determine
 * the client IP.
 */
app.set("trust proxy", 1);

// ============================================================
// SECURITY
// ============================================================

app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: "cross-origin",
        },
    })
);

// ============================================================
// CORS
// ============================================================

/*
 * FRONTEND_URLS example:
 *
 * FRONTEND_URLS=http://localhost:3000,https://newprint.vercel.app
 *
 * You can also use FRONTEND_URL for a single production URL.
 */

const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS
        ? process.env.FRONTEND_URLS.split(",")
        : []),
]
    .filter(Boolean)
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = [
    ...new Set(configuredOrigins),
];

console.log(
    "Allowed CORS origins:",
    allowedOrigins
);

app.use(
    cors({
        origin(origin, callback) {
            /*
             * Requests without Origin:
             * Postman
             * server-to-server
             * health checks
             */
            if (!origin) {
                return callback(null, true);
            }

            if (
                allowedOrigins.includes(origin)
            ) {
                return callback(null, true);
            }

            console.warn(
                "Blocked CORS origin:",
                origin
            );

            return callback(
                new Error("Not allowed by CORS")
            );
        },

        credentials: true,

        methods: [
            "GET",
            "HEAD",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],
    })
);

// ============================================================
// BODY PARSERS
// ============================================================

app.use(
    express.json({
        limit: "10mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb",
    })
);

app.use(cookieParser());

// ============================================================
// LOGGING
// ============================================================

app.use(
    morgan(
        process.env.NODE_ENV === "production"
            ? "combined"
            : "dev"
    )
);

// ============================================================
// CLERK
// ============================================================

app.use(clerkMiddleware());

// ============================================================
// RATE LIMITING
// ============================================================

/*
 * PUBLIC READ LIMITER
 *
 * GET/HEAD requests are allowed much more frequently
 * because the public website can request products,
 * categories, etc.
 */

const publicReadLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        limit:
            process.env.NODE_ENV ===
            "production"
                ? 1500
                : 10000,

        standardHeaders:
            "draft-7",

        legacyHeaders: false,

        skip: (req) =>
            ![
                "GET",
                "HEAD",
            ].includes(req.method),

        message: {
            success: false,
            message:
                "Too many requests. Please wait a moment and try again.",
        },
    });

/*
 * WRITE LIMITER
 *
 * POST / PUT / PATCH / DELETE
 */

const writeLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        limit:
            process.env.NODE_ENV ===
            "production"
                ? 200
                : 2000,

        standardHeaders:
            "draft-7",

        legacyHeaders: false,

        skip: (req) =>
            [
                "GET",
                "HEAD",
                "OPTIONS",
            ].includes(req.method),

        message: {
            success: false,
            message:
                "Too many update requests. Please wait and try again.",
        },
    });

app.use(
    "/api",
    publicReadLimiter
);

app.use(
    "/api",
    writeLimiter
);

// ============================================================
// DATABASE
// ============================================================

/*
 * connectDB() should use a cached MongoDB connection.
 *
 * This middleware makes sure the database is available
 * before an API request reaches a controller.
 */

app.use(
    "/api",
    async (req, res, next) => {
        try {
            await connectDB();
            next();
        } catch (error) {
            console.error(
                "DATABASE CONNECTION ERROR:",
                error
            );

            next(error);
        }
    }
);

// ============================================================
// CLOUDINARY
// ============================================================

/*
 * Cloudinary configuration is initialized once.
 *
 * Your uploadStream() helper in productController.js
 * uses this configured Cloudinary instance.
 */



// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message:
            "New Print Backend Running 🚀",
        environment:
            process.env.NODE_ENV ||
            "development",
    });
});

// ============================================================
// API ROUTES
// ============================================================

app.use(
    "/api/categories",
    categoryRoutes
);

app.use(
    "/api/products",
    productRoutes
);

// ============================================================
// API 404
// ============================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API Route Not Found",
    });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
    (err, req, res, next) => {
        console.error(
            "GLOBAL ERROR:",
            err?.stack || err
        );

        // --------------------------------------------
        // CORS
        // --------------------------------------------

        if (
            err?.message ===
            "Not allowed by CORS"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Origin is not allowed.",
            });
        }

        // --------------------------------------------
        // MULTER
        // --------------------------------------------

        if (
            err?.name ===
            "MulterError"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    err.message ||
                    "File upload failed.",
            });
        }

        // --------------------------------------------
        // CLERK / AUTH
        // --------------------------------------------

        if (
            err?.message ===
                "Unauthenticated" ||
            err?.statusCode === 401
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Unauthenticated",
            });
        }

        // --------------------------------------------
        // RESPONSE
        // --------------------------------------------

        return res.status(
            err?.status || 500
        ).json({
            success: false,

            message:
                process.env.NODE_ENV ===
                "production"
                    ? "Internal Server Error"
                    : err?.message ||
                      "Internal Server Error",
        });
    }
);

// ============================================================
// LOCAL DEVELOPMENT SERVER
// ============================================================

/*
 * IMPORTANT:
 *
 * Vercel production should NOT call app.listen().
 *
 * We only start the Express server locally.
 */

if (
    process.env.NODE_ENV !==
    "production"
) {
    const PORT =
        process.env.PORT || 5000;

    app.listen(
        PORT,
        () => {
            console.log(
                "======================================"
            );

            console.log(
                `🚀 New Print Backend Running`
            );

            console.log(
                `🌐 http://localhost:${PORT}`
            );

            console.log(
                "======================================"
            );
        }
    );
}

// ============================================================
// VERCEL EXPORT
// ============================================================

export default app;