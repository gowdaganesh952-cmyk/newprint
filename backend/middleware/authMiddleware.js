import { requireAuth, clerkClient } from "@clerk/express";

// ============================================================
// AUTHENTICATED USER
// ============================================================

export const authenticateUser = requireAuth();


// ============================================================
// ADMIN ONLY
// ============================================================

export const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthenticated",
      });
    }

    const user = await clerkClient.users.getUser(userId);

    const role = user.publicMetadata?.role;

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin access required",
      });
    }

    // Make verified Clerk user available downstream.
    req.user = user;

    next();
  } catch (error) {
    console.error("Admin Auth Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error during authorization",
    });
  }
};