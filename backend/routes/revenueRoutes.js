import express from "express";
import { authenticateUser, requireAdmin } from "../middleware/authMiddleware.js";
import { getRevenueAnalytics } from "../controllers/revenueController.js";

const router = express.Router();

router.use(authenticateUser);
router.get("/", requireAdmin, getRevenueAnalytics);

export default router;