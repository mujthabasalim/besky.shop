const mongoose = require("mongoose");
const Order = require("../models/Order");

// Get Top 10 Products
async function getTopProducts() {
  return await Order.aggregate([
    { $match: { orderStatus: "delivered" } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        totalSold: { $sum: "$items.quantity" },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    { $unwind: "$productDetails" },
    {
      $project: {
        _id: 1,
        totalSold: 1,
        "productDetails.name": 1,
        "productDetails.price": 1,
        "productDetails.brand": 1,
      },
    },
  ]);
}

// Get Top 10 Categories
async function getTopCategories() {
  return await Order.aggregate([
    { $match: { orderStatus: "delivered" } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    { $unwind: "$productDetails" },
    {
      $group: {
        _id: {
          parentCategory: "$productDetails.parentCategory",
          subCategory: "$productDetails.subCategory",
        },
        totalSold: { $sum: "$items.quantity" },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "categories",
        localField: "_id.parentCategory",
        foreignField: "_id",
        as: "parentCategoryDetails",
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id.subCategory",
        foreignField: "_id",
        as: "subCategoryDetails",
      },
    },
    { $unwind: "$parentCategoryDetails" },
    { $unwind: "$subCategoryDetails" },
    {
      $project: {
        totalSold: 1,
        "parentCategoryDetails.name": 1,
        "subCategoryDetails.name": 1,
      },
    },
  ]);
}

module.exports = {
  getTopProducts,
  getTopCategories,
};
