import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// ============================================================
// HELPER: GENERATE DETERMINISTIC ITEM KEY
// ============================================================
const generateItemKey = (productId, selections = {}) => {
  const sortedKeys = Object.keys(selections).sort();
  const selectionString = sortedKeys.map(k => `${k}:${selections[k]}`).join('|');
  return `${productId}${selectionString ? '|' + selectionString : ''}`;
};

// ============================================================
// HELPER: VALIDATE PRODUCT & SELECTIONS
// ============================================================
const validateCartItem = async (productId, requestedSelections = {}) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }
  if (product.status !== "active") {
    throw new Error("Product is currently unavailable");
  }

  const orderSelections = product.orderSelections || [];
  const validatedSelections = {};

  for (const reqSel of orderSelections) {
    const val = requestedSelections[reqSel.name];
    if (reqSel.required && !val) {
      throw new Error(`Missing required selection: ${reqSel.name}`);
    }
    if (val) {
      if (!reqSel.values.includes(val)) {
        throw new Error(`Invalid value for ${reqSel.name}`);
      }
      validatedSelections[reqSel.name] = val;
    }
  }

  return { product, validatedSelections };
};

// ============================================================
// GET CART (With Price/Availability Reconciliation)
// ============================================================
export const getCart = async (req, res) => {
  try {
    const userId = req.auth.userId;
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
      return res.status(200).json({ success: true, cart, messages: [] });
    }

    let isModified = false;
    const messages = [];
    const validItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      
      if (!product || product.status !== "active") {
        messages.push(`${item.name} is no longer available and was removed from your cart.`);
        isModified = true;
        continue;
      }

      if (product.price !== item.price) {
        messages.push(`The price of ${item.name} has changed from ₹${item.price} to ₹${product.price}.`);
        item.price = product.price;
        isModified = true;
      }

      validItems.push(item);
    }

    if (isModified) {
      cart.items = validItems;
      await cart.save();
    }

    // Calculate totals for UI convenience
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.status(200).json({ 
      success: true, 
      cart: {
        items: cart.items,
        subtotal,
        itemCount
      },
      messages 
    });
  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
};

// ============================================================
// ADD ITEM
// ============================================================
export const addItem = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { productId, quantity = 1, selections = {} } = req.body;

    if (quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

    const { product, validatedSelections } = await validateCartItem(productId, selections);
    const itemKey = generateItemKey(productId, validatedSelections);

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(item => item.itemKey === itemKey);

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId,
        itemKey,
        name: product.name,
        image: product.images?.[0] || "",
        price: product.price,
        quantity,
        selections: validatedSelections
      });
    }

    await cart.save();
    res.status(200).json({ success: true, message: "Item added to cart", cart });
  } catch (error) {
    console.error("Add Item Error:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to add item" });
  }
};

// ============================================================
// UPDATE QUANTITY
// ============================================================
export const updateItemQuantity = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.find(i => i._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    item.quantity = quantity;
    await cart.save();

    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Update Quantity Error:", error);
    res.status(500).json({ success: false, message: "Failed to update quantity" });
  }
};

// ============================================================
// REMOVE ITEM
// ============================================================
export const removeItem = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter(i => i._id.toString() !== itemId);
    await cart.save();

    res.status(200).json({ success: true, message: "Item removed", cart });
  } catch (error) {
    console.error("Remove Item Error:", error);
    res.status(500).json({ success: false, message: "Failed to remove item" });
  }
};

// ============================================================
// CLEAR CART
// ============================================================
export const clearCart = async (req, res) => {
  try {
    const userId = req.auth.userId;
    await Cart.findOneAndUpdate({ userId }, { items: [] });
    res.status(200).json({ success: true, message: "Cart cleared" });
  } catch (error) {
    console.error("Clear Cart Error:", error);
    res.status(500).json({ success: false, message: "Failed to clear cart" });
  }
};

// ============================================================
// MERGE GUEST CART
// ============================================================
export const mergeCart = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { items = [] } = req.body;

    if (!items || items.length === 0) {
      return res.status(200).json({ success: true, message: "No items to merge" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    for (const guestItem of items) {
      try {
        const { product, validatedSelections } = await validateCartItem(guestItem.productId, guestItem.selections);
        const itemKey = generateItemKey(guestItem.productId, validatedSelections);
        
        const existingItemIndex = cart.items.findIndex(item => item.itemKey === itemKey);

        if (existingItemIndex > -1) {
          cart.items[existingItemIndex].quantity += guestItem.quantity;
        } else {
          cart.items.push({
            productId: product._id,
            itemKey,
            name: product.name,
            image: product.images?.[0] || "",
            price: product.price,
            quantity: guestItem.quantity,
            selections: validatedSelections
          });
        }
      } catch (err) {
        console.warn(`Merge validation failed for product ${guestItem.productId}:`, err.message);
        // Skip invalid items silently during merge
      }
    }

    await cart.save();
    res.status(200).json({ success: true, message: "Cart merged successfully", cart });
  } catch (error) {
    console.error("Merge Cart Error:", error);
    res.status(500).json({ success: false, message: "Failed to merge cart" });
  }
};