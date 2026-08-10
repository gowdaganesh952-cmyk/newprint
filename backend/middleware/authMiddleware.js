// backend/middleware/authMiddleware.js
import { requireAuth, clerkClient } from '@clerk/express';

// 1. Require Authentication (Standard Users)
export const authenticateUser = requireAuth();

// 2. Require Admin Role (Must be chained AFTER authenticateUser)
export const requireAdmin = async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthenticated" });
        }

        // Fetch fresh user data directly from Clerk backend to prevent client spoofing
        const user = await clerkClient.users.getUser(userId);
        
        if (user.publicMetadata?.role !== "admin") {
            return res.status(403).json({ 
                success: false, 
                message: "Forbidden: Admin access required" 
            });
        }

        // Attach user to req for downstream usage
        req.user = user;
        next();
    } catch (error) {
        console.error("Admin Auth Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error during authorization" 
        });
    }
};