import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { 
  getOrders, 
  getOrderStats, 
  getOrderById 
} from "../controllers/orderController.js";

const router = express.Router();

router.use(authenticateUser);

router.get("/stats", getOrderStats);
router.get("/", getOrders);
router.get("/:id", getOrderById);

export default router;