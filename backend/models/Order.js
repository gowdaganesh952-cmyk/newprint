import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { 
      type: String, 
      required: true,
      index: true
    },
    orderNumber: { 
      type: String, 
      required: true, 
      unique: true 
    },
    items: [
      {
        name: { type: String, required: true },
        image: { type: String },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        selections: { type: mongoose.Schema.Types.Mixed }
      }
    ],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Processing" 
    },
    paymentStatus: { 
      type: String, 
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending" 
    },
    shippingAddress: { 
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);