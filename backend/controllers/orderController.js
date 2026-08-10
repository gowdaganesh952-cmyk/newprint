import Order from "../models/Order.js";

// GET /api/orders/stats
export const getOrderStats = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const totalOrders = await Order.countDocuments({ userId });
    const pendingOrders = await Order.countDocuments({ 
      userId, 
      status: "Processing" 
    });
    const completedOrders = await Order.countDocuments({ 
      userId, 
      status: "Delivered" 
    });

    res.status(200).json({ 
      success: true, 
      stats: { totalOrders, pendingOrders, completedOrders } 
    });
  } catch (error) {
    console.error("Get Order Stats Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch order stats" });
  }
};

// GET /api/orders
export const getOrders = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const limit = parseInt(req.query.limit) || 0; 
    
    const ordersQuery = Order.find({ userId }).sort({ createdAt: -1 });
    if (limit > 0) {
      ordersQuery.limit(limit);
    }
    
    const orders = await ordersQuery;

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const orderId = req.params.id;

    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get Order By ID Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch order details" });
  }
};