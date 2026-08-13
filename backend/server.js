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
            // Useful for server-to-server requests and health checks.
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
 * IMPORTANT:
 *
 * Keep this endpoint lightweight.
 *
 * External uptime monitor:
 *
 * GET /health
 *
 * Example:
 *
 * https://your-render-service.onrender.com/health
 *
 * Configure your external monitor to request this
 * automatically every 10 minutes.
 *
 * DO NOT put setInterval() here.
 *
 * If Render suspends the service, the Node.js process
 * and its timers are also suspended.
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
                "development",
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
 * MongoDB connection is only required for /api routes.
 *
 * /health does NOT reach this middleware.
 *
 * This keeps the health endpoint extremely lightweight.
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

        // CORS
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

        // Multer
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

        // Authentication
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

        // General error
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
// LOCAL DEVELOPMENT SERVER
// ============================================================

if (
    process.env.NODE_ENV !==
    "production"
) {
  // ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 5000;

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
            `❤️ Health: /health`
        );

        console.log(
            `🌍 Environment: ${
                process.env.NODE_ENV ||
                "development"
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