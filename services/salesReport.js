const Order = require("../models/Order");

const generateSalesReport = async (startDate, endDate) => {
  const matchStage = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    orderStatus: 'delivered'
  };

  
  const aggregation = [
    { $match: matchStage },
    { 
      $group: {
        _id: null, // Group everything together
        totalSalesAmount: { $sum: "$grandTotal" },
        totalOrders: { $sum: 1 },
        totalDiscounts: { $sum: "$couponDiscount" },
        totalShipping: { $sum: "$deliveryCharge" }
      }
    }
  ];

  const result = await Order.aggregate(aggregation);
  return result
};

module.exports = {
  generateSalesReport,
}