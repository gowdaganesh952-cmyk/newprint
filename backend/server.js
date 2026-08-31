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
import addressRoutes from "./routes/addressRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";

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
            // Allow requests without an Origin header.
            // Useful for server-to-server requests,
            // uptime monitors and health checks.
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
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
// HEALTH CHECK
// ============================================================

/*
 * Lightweight endpoint for:
 *
 * - Render health checks
 * - External uptime monitoring
 * - Service availability testing
 *
 * IMPORTANT:
 *
 * This endpoint intentionally does NOT connect to MongoDB.
 *
 * External uptime monitor can request:
 *
 * GET /health
 *
 * every 10 minutes.
 *
 * Do NOT use setInterval() here.
 */

app.get(
    "/health",
    (req, res) => {
        return res.status(200).json({
            success: true,
            status: "ok",
            service: "new-print-backend",
            timestamp: new Date().toISOString(),
        });
    }
);

// ============================================================
// ROOT STATUS
// ============================================================

app.get(
    "/",
    (req, res) => {
        return res.status(200).json({
            success: true,
            message:
                "New Print Backend Running 🚀",
            environment:
                process.env.NODE_ENV ||
                "production",
        });
    }
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

app.use(
    clerkMiddleware()
);

// ============================================================
// RATE LIMITING
// ============================================================

const publicReadLimiter =
    rateLimit({
        windowMs: 15 * 60 * 1000,

        limit:
            process.env.NODE_ENV === "production"
                ? 1500
                : 10000,

        standardHeaders: "draft-7",

        legacyHeaders: false,

        skip: (req) =>
            !["GET", "HEAD"].includes(
                req.method
            ),

        message: {
            success: false,
            message:
                "Too many requests. Please wait a moment and try again.",
        },
    });

const writeLimiter =
    rateLimit({
        windowMs: 15 * 60 * 1000,

        limit:
            process.env.NODE_ENV === "production"
                ? 200
                : 2000,

        standardHeaders: "draft-7",

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
 * MongoDB is connected only for /api requests.
 *
 * /health and / do NOT connect to MongoDB.
 *
 * This keeps health checks extremely fast and lightweight.
 */

app.use(
    "/api",
    async (
        req,
        res,
        next
    ) => {
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

app.use(
    "/api/addresses",
    addressRoutes
);

app.use(
    "/api/orders",
    orderRoutes
);

app.use(
    "/api/cart",
    cartRoutes
);

// ============================================================
// API 404
// ============================================================

app.use(
    (req, res) => {
        return res.status(404).json({
            success: false,
            message:
                "API Route Not Found",
        });
    }
);

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
    (
        err,
        req,
        res,
        next
    ) => {
        console.error(
            "GLOBAL ERROR:",
            err?.stack || err
        );

        // ----------------------------------------------------
        // CORS
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // MULTER
        // ----------------------------------------------------

        if (
            err?.name === "MulterError"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    err.message ||
                    "File upload failed.",
            });
        }

        // ----------------------------------------------------
        // AUTHENTICATION
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // GENERAL ERROR
        // ----------------------------------------------------

        return res
            .status(
                err?.status || 500
            )
            .json({
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
// SERVER START
// ============================================================

/*
 * IMPORTANT FOR RENDER + VERCEL
 *
 * Vercel:
 * - VERCEL environment variable is available.
 * - Export the Express app.
 * - Do NOT call app.listen().
 *
 * Render:
 * - VERCEL is not present.
 * - Render provides process.env.PORT.
 * - Start Express on that port.
 *
 * Local:
 * - VERCEL is not present.
 * - Use PORT from environment or 5000.
 */

const isVercel =
    process.env.VERCEL === "1" ||
    process.env.VERCEL === "true" ||
    Boolean(process.env.VERCEL);

if (!isVercel) {
    const PORT =
        process.env.PORT || 5000;

    app.listen(
        PORT,
        "0.0.0.0",
        () => {
            console.log(
                "======================================"
            );

            console.log(
                "🚀 New Print Backend Running"
            );

            console.log(
                `🌐 Port: ${PORT}`
            );

            console.log(
                "❤️ Health: /health"
            );

            console.log(
                `🌍 Environment: ${
                    process.env.NODE_ENV ||
                    "development"
                }`
            );

            console.log(
                `☁️ Platform: ${
                    process.env.RENDER === "true"
                        ? "Render"
                        : "Local"
                }`
            );

            console.log(
                "======================================"
            );
        }
    );
}

// ============================================================
// EXPORT
// ============================================================

export default app;