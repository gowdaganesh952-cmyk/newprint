import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { 
  getAddresses, 
  addAddress, 
  updateAddress, 
  deleteAddress, 
  setDefaultAddress 
} from "../controllers/addressController.js";

const router = express.Router();

router.use(authenticateUser);

router.route("/")
  .get(getAddresses)
  .post(addAddress);

router.route("/:id")
  .put(updateAddress)
  .delete(deleteAddress);

router.route("/:id/default")
  .patch(setDefaultAddress);

export default router;