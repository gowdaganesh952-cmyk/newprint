import Order from "../models/Order.js";

/* ============================================================
   GET REVENUE ANALYTICS
============================================================ */

export const getRevenueAnalytics = async (req, res) => {
    try {
        const { range = "30d", startDate: customStart, endDate: customEnd } = req.query;

        const now = new Date();
        let startDate = new Date();
        let endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        let groupByFormat = "%Y-%m-%d";

        switch (range) {
            case "7d":
                startDate.setDate(now.getDate() - 7);
                startDate.setHours(0, 0, 0, 999);
                break;
            case "30d":
                startDate.setDate(now.getDate() - 30);
                startDate.setHours(0, 0, 0, 999);
                break;
            case "90d":
                startDate.setDate(now.getDate() - 90);
                startDate.setHours(0, 0, 0, 999);
                break;
            case "1y":
                startDate.setFullYear(now.getFullYear() - 1);
                startDate.setHours(0, 0, 0, 999);
                groupByFormat = "%Y-%m";
                break;
            case "custom":
                if (customStart && customEnd) {
                    startDate = new Date(customStart);
                    startDate.setHours(0, 0, 0, 999);
                    endDate = new Date(customEnd);
                    endDate.setHours(23, 59, 59, 999);
                } else {
                    startDate.setDate(now.getDate() - 30);
                    startDate.setHours(0, 0, 0, 999);
                }
                break;
            default:
                startDate.setDate(now.getDate() - 30);
                startDate.setHours(0, 0, 0, 999);
        }

        // Previous period for comparison
        const durationMs = endDate.getTime() - startDate.getTime();
        const prevEndDate = new Date(startDate.getTime() - 1);
        const prevStartDate = new Date(prevEndDate.getTime() - durationMs);

        // 1. Current Period Summary (Paid Orders)
        const currentPaidMatch = {
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: "Paid"
        };

        const currentSummaryAgg = await Order.aggregate([
            { $match: currentPaidMatch },
            {
                $group: {
                    _id: null,
                    paidRevenue: { $sum: "$totalAmount" },
                    subtotalRevenue: { $sum: "$subtotal" },
                    deliveryRevenue: { $sum: "$deliveryFee" },
                    paidOrdersCount: { $sum: 1 },
                    averageOrderValue: { $avg: "$totalAmount" }
                }
            }
        ]);

        const currentSummary = currentSummaryAgg[0] || {
            paidRevenue: 0,
            subtotalRevenue: 0,
            deliveryRevenue: 0,
            paidOrdersCount: 0,
            averageOrderValue: 0
        };

        // 2. Previous Period Summary
        const prevPaidMatch = {
            createdAt: { $gte: prevStartDate, $lte: prevEndDate },
            paymentStatus: "Paid"
        };

        const prevSummaryAgg = await Order.aggregate([
            { $match: prevPaidMatch },
            {
                $group: {
                    _id: null,
                    paidRevenue: { $sum: "$totalAmount" },
                    paidOrdersCount: { $sum: 1 },
                    averageOrderValue: { $avg: "$totalAmount" }
                }
            }
        ]);

        const prevSummary = prevSummaryAgg[0] || {
            paidRevenue: 0,
            paidOrdersCount: 0,
            averageOrderValue: 0
        };

        const calcGrowth = (current, previous) => {
            if (!previous || previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 1000) / 10;
        };

        const paidRevenueGrowth = calcGrowth(currentSummary.paidRevenue, prevSummary.paidRevenue);
        const paidOrdersGrowth = calcGrowth(currentSummary.paidOrdersCount, prevSummary.paidOrdersCount);
        const aovGrowth = calcGrowth(currentSummary.averageOrderValue, prevSummary.averageOrderValue);

        // 3. Trend Aggregation
        const trendAgg = await Order.aggregate([
            { $match: currentPaidMatch },
            {
                $group: {
                    _id: { $dateToString: { format: groupByFormat, date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 4. Payment Breakdown (All orders in timeframe)
        const timeframeMatch = { createdAt: { $gte: startDate, $lte: endDate } };
        const paymentBreakdownAgg = await Order.aggregate([
            { $match: timeframeMatch },
            {
                $group: {
                    _id: "$paymentStatus",
                    count: { $sum: 1 },
                    amount: { $sum: "$totalAmount" }
                }
            }
        ]);

        const paymentStatuses = ["Paid", "Pending", "Failed", "Cancelled", "Refunded"];
        const paymentBreakdown = paymentStatuses.map((status) => {
            const found = paymentBreakdownAgg.find((p) => p._id === status);
            return {
                status,
                count: found ? found.count : 0,
                amount: found ? found.amount : 0
            };
        });

        // 5. Order Status Breakdown
        const orderStatusBreakdownAgg = await Order.aggregate([
            { $match: timeframeMatch },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const orderStatuses = ["Not Completed", "Confirmed", "Shipped", "Delivered", "Cancelled"];
        const orderStatusBreakdown = orderStatuses.map((status) => {
            const found = orderStatusBreakdownAgg.find((o) => o._id === status);
            return {
                status,
                count: found ? found.count : 0
            };
        });

        // 6. Top Products by Revenue & Units
        const productStatsAgg = await Order.aggregate([
            { $match: currentPaidMatch },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    name: { $first: "$items.name" },
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    unitsSold: { $sum: "$items.quantity" }
                }
            }
        ]);

        const totalProductRevenue = productStatsAgg.reduce((sum, p) => sum + p.revenue, 0);

        const topProductsByRevenue = [...productStatsAgg]
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
            .map((p) => ({
                productId: p._id,
                name: p.name,
                revenue: p.revenue,
                unitsSold: p.unitsSold,
                share: totalProductRevenue > 0 ? Math.round((p.revenue / totalProductRevenue) * 1000) / 10 : 0
            }));

        const topProductsByUnits = [...productStatsAgg]
            .sort((a, b) => b.unitsSold - a.unitsSold)
            .slice(0, 5)
            .map((p) => ({
                productId: p._id,
                name: p.name,
                unitsSold: p.unitsSold,
                revenue: p.revenue
            }));

        // 7. Sales Table
        const salesTableAgg = await Order.aggregate([
            { $match: timeframeMatch },
            {
                $group: {
                    _id: { $dateToString: { format: groupByFormat, date: "$createdAt" } },
                    totalOrders: { $sum: 1 },
                    paidOrders: {
                        $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, 1, 0] }
                    },
                    revenue: {
                        $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$totalAmount", 0] }
                    }
                }
            },
            {
                $project: {
                    date: "$_id",
                    orders: "$totalOrders",
                    paidOrders: "$paidOrders",
                    revenue: "$revenue",
                    aov: {
                        $cond: [
                            { $gt: ["$paidOrders", 0] },
                            { $divide: ["$revenue", "$paidOrders"] },
                            0
                        ]
                    }
                }
            },
            { $sort: { date: -1 } }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                range,
                startDate,
                endDate,
                summary: {
                    paidRevenue: currentSummary.paidRevenue,
                    paidRevenueGrowth,
                    paidOrdersCount: currentSummary.paidOrdersCount,
                    paidOrdersGrowth,
                    averageOrderValue: Math.round(currentSummary.averageOrderValue * 100) / 100,
                    aovGrowth,
                    deliveryRevenue: currentSummary.deliveryRevenue,
                    subtotalRevenue: currentSummary.subtotalRevenue
                },
                comparison: {
                    previousPaidRevenue: prevSummary.paidRevenue,
                    previousPaidOrdersCount: prevSummary.paidOrdersCount,
                    previousAov: Math.round(prevSummary.averageOrderValue * 100) / 100
                },
                trend: trendAgg.map((t) => ({
                    date: t._id,
                    revenue: t.revenue,
                    orders: t.orders
                })),
                paymentBreakdown,
                orderStatusBreakdown,
                topProductsByRevenue,
                topProductsByUnits,
                salesTable: salesTableAgg
            }
        });

    } catch (error) {
        console.error("Get Revenue Analytics Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch revenue analytics"
        });
    }
};