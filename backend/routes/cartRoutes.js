import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { 
  getCart, 
  addItem, 
  updateItemQuantity, 
  removeItem, 
  clearCart, 
  mergeCart 
} from "../controllers/cartController.js";

const router = express.Router();

router.use(authenticateUser);

router.route("/")
  .get(getCart)
  .delete(clearCart);

router.route("/items")
  .post(addItem);

router.route("/items/:itemId")
  .patch(updateItemQuantity)
  .delete(removeItem);

router.post("/merge", mergeCart);

export default router;