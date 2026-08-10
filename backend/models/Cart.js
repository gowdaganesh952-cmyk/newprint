import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  itemKey: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  image: { 
    type: String 
  },
  price: { 
    type: Number, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  selections: { 
    type: Map, 
    of: String,
    default: {}
  }
}, { _id: true }); // keep _id for easy direct item deletion if needed

const cartSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    unique: true,
    index: true
  },
  items: [cartItemSchema]
}, { timestamps: true });

export default mongoose.model("Cart", cartSchema);