require("dotenv").config();
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Offer = require("../models/Offer");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const moment = require("moment");
const { generateToken } = require("../services/jwtService");
const { generateSalesReport } = require("../services/salesReport");
const { generatePDFReport } = require("../services/pdfService");
const generateExcelReport = require("../services/excelService");
const getPaginationData = require("../utils/pagination");
const WalletService = require("../services/WalletService");
const { createNotification } = require("../services/notificationService");
const {
  getTopProducts,
  getTopCategories,
} = require("../services/bestSellerService");
const mongoose = require("mongoose");
const exp = require("constants");

// Common Error Handler
const handleError = (res, error, message = "Server Error") => {
  console.error(message, error);
  return res.status(500).send(message);
};

// Utility to find an entity by ID and handle errors
const findEntityById = async (model, id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send("Invalid ID");
  }
  const entity = await model.findById(id);
  if (!entity) {
    return res.status(404).send(`${model.modelName} not found`);
  }
  return entity;
};

// Render Login Page
exports.loadLogin = (req, res) => res.render("admin/login");

// Handle Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.render("admin/login", { errorMessage: "Invalid credential" });
    }
    const adminToken = generateToken(admin);
    res.cookie("adminToken", adminToken, { httpOnly: true, secure: true });
    return res.redirect("/admin/dashboard");
  } catch (error) {
    return handleError(res, error, "Login failed");
  }
};

// Render Admin Dashboard
exports.loadDashboard = (req, res) => res.render("admin/dashboard");

exports.getSalesReport = async (req, res) => {
  try {
    let { period, startDate, endDate, tableType } = req.query;

    // Check if the request is for sales report or transaction table
    const isTransactionTable = tableType === "transaction";
    // Determine the date range based on the selected period
    if (period) {
      const now = moment();

      switch (period) {
        case "daily":
          startDate = now.startOf("day").toISOString();
          endDate = now.endOf("day").toISOString();
          break;
        case "weekly":
          startDate = now.startOf("week").toISOString();
          endDate = now.endOf("week").toISOString();
          break;
        case "monthly":
          startDate = now.startOf("month").toISOString();
          endDate = now.endOf("month").toISOString();
          break;
        case "yearly":
          startDate = now.startOf("year").toISOString();
          endDate = now.endOf("year").toISOString();
          break;
        default:
          return res
            .status(400)
            .json({ success: false, message: "Invalid period selected" });
      }
    } else if (startDate && endDate) {
      // Custom date range selected
      startDate = moment(startDate).startOf("day").toISOString();
      endDate = moment(endDate).endOf("day").toISOString();
    } else {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid period or date range.",
      });
    }

    const limit = 5;
    const page = parseInt(req.query.page) || 1;
    const sort = "-createdAt";
    const populateOptions = [{ path: "userId", select: "firstName" }];
    const query = {
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: "delivered",
    };
    const search = req.query.search || "";
    const filters = {};

    // Search query logic
    if (search) {
      query.$or = [
        { _id: { $regex: search, $options: "i" } },
        { paymentMethod: { $regex: search, $options: "i" } },
        { orderStatus: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination function fetching orders
    const { data: orders, pagination } = await getPaginationData(
      Order,
      page,
      limit,
      query,
      "/admin/sales-report",
      populateOptions,
      sort,
      filters
    );

    const salesReport = await generateSalesReport(startDate, endDate);

    res.status(200).json({
      success: true,
      salesReport,
      orders,
      pagination,
      sort,
      search,
    });
  } catch (error) {
    console.error("Error fetching sales report:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching sales report" });
  }
};

exports.downloadFile = async (req, res) => {
  const { fileType } = req.params;
  let { period, startDate, endDate } = req.query;

  try {
    // Convert period to date range
    if (period) {
      const now = moment();

      switch (period) {
        case "daily":
          startDate = now.startOf("day").toISOString();
          endDate = now.endOf("day").toISOString();
          break;
        case "weekly":
          startDate = now.startOf("week").toISOString();
          endDate = now.endOf("week").toISOString();
          break;
        case "monthly":
          startDate = now.startOf("month").toISOString();
          endDate = now.endOf("month").toISOString();
          break;
        case "yearly":
          startDate = now.startOf("year").toISOString();
          endDate = now.endOf("year").toISOString();
          break;
        default:
          return res
            .status(400)
            .json({ success: false, message: "Invalid period selected" });
      }
    } else if (startDate && endDate) {
      startDate = moment(startDate).startOf("day").toISOString();
      endDate = moment(endDate).endOf("day").toISOString();
    } else {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid period or date range.",
      });
    }

    const salesReport = await generateSalesReport(startDate, endDate);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: "delivered",
    });

    if (fileType === "pdf") {
      generatePDFReport(startDate, endDate, salesReport[0], orders, res); // Stream PDF to client
    } else if (fileType === "excel") {
      generateExcelReport(startDate, endDate, salesReport[0], orders, res);
    } else {
      res.status(400).json({ success: false, message: "Invalid file type" });
    }
  } catch (error) {
    console.error("Error fetching sales report:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching sales report" });
  }
};

exports.getBestSelling = async (req, res) => {
  try {
    const topProducts = await getTopProducts();
    const topCategories = await getTopCategories();

    res.json({ topProducts, topCategories });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.viewUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const sort = req.query.sort || "-createdAt";
    const search = req.query.search || "";

    // Prepare filters from the request
    const filters = {
      status: req.query.statusFilter || "",
      // Add other filters as needed
    };

    const query = { role: "user" };

    // Apply filters to the query
    if (filters.status) {
      query.status = filters.status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const { data: users, pagination } = await getPaginationData(
      User,
      page,
      limit,
      query,
      "/admin/users",
      [],
      sort
    );

    if (req.xhr) {
      return res.render("admin/userManagement", {
        users,
        pagination,
        sort,
        search,
        filters,
        layout: false,
      });
    }

    return res.render("admin/userManagement", {
      users,
      pagination,
      sort,
      search,
      filters,
    });
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/admin/users");
  }
};

// Update User Status
exports.updateUserStatus = async (req, res) => {
  try {
    const user = await findEntityById(User, req.params.userId, res);
    if (user) {
      user.status = user.status === "Active" ? "Blocked" : "Active";
      res.clearCookie("token");
      await user.save();
      return res.status(200).json({ success: true, newStatus: user.status });
    }
  } catch (error) {
    return handleError(res, error, "Failed to update user status");
  }
};

// Category Management: View All Categories
exports.getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const sort = req.query.sort || "-createdAt";
    const search = req.query.search || "";

    // Prepare filters from the request
    const filters = {
      status: req.query.statusFilter || "",
      // Add other filters as needed
    };

    const query = {};

    // Apply filters to the query
    if (filters.status) {
      query.status = filters.status;
    }

    if (search) {
      query.$or = [{ type: { $regex: search, $options: "i" } }];
    }

    const populateOptions = [{ path: "parentCategory", select: "name" }];
    const { data: categories, pagination } = await getPaginationData(
      Category,
      page,
      limit,
      query,
      "/admin/categories",
      populateOptions,
      sort
    );

    if (req.xhr) {
      return res.render("admin/categoryManagement", {
        categories,
        pagination,
        sort,
        search,
        filters,
        layout: false,
      });
    }

    return res.render("admin/categoryManagement", {
      categories,
      pagination,
      sort,
      search,
      filters,
    });
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/admin/categories");
  }
};

exports.getParentCategories = async (req, res) => {
  try {
    const categories = await Category.find({ parentCategory: null });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Error fetching parent categories" });
  }
};

// Add or Update Category
exports.saveCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, parentCategory, isActive } = req.body;
    const categoryData = {
      name,
      parentCategory: parentCategory || null,
      isActive: isActive === 'true',
    };
    if (categoryId) {
      await Category.findByIdAndUpdate(categoryId, categoryData, { new: true });
    } else {
      await new Category(categoryData).save();
    }
    return res.redirect("/admin/categories");
  } catch (error) {
    return handleError(res, error, "Failed to save category");
  }
};

// Product Management: View All Products
exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const sort = req.query.sort || "-createdAt";
    const search = req.query.search || "";

    const query = {};
    const filters = {};

    // Capture dynamic filters from query params
    if (req.query.priceRangeFilter) {
      const priceRange = req.query.priceRangeFilter;
      if (priceRange === "500") {
        query.price = { $lte: 500 };
      } else if (priceRange === "1000") {
        query.price = { $gte: 500, $lte: 1000 };
      } else if (priceRange === "1001") {
        query.price = { $gte: 1001 };
      }
      filters.priceRange = priceRange;
    }

    if (req.query.parentCategoryFilter) {
      query.parentCategory = req.query.parentCategoryFilter;
      filters.parentCategory = req.query.parentCategoryFilter;
    }

    if (req.query.subCategoryFilter) {
      query.subCategory = req.query.subCategoryFilter;
      filters.subCategory = req.query.subCategoryFilter;
    }

    if (req.query.brandFilter) {
      query.brand = req.query.brandFilter;
      filters.brand = req.query.brandFilter;
    }

    // Add search logic for product name or any other searchable fields
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    // Get categories and brands for filters
    const parentCategories = await Category.find({ parentCategory: null });
    const subCategories = await Category.find({
      parentCategory: { $ne: null },
    });
    const brands = await Product.distinct("brand");

    const populateOptions = ["parentCategory", "subCategory", "variants"];

    const { data: products, pagination } = await getPaginationData(
      Product,
      page,
      limit,
      query,
      "/admin/products",
      populateOptions,
      sort
    );

    // Render partial view if it's an AJAX request
    if (req.xhr) {
      return res.render("admin/productManagement", {
        products,
        pagination,
        sort,
        search,
        filters,
        layout: false,
      });
    }

    // Render full page view
    return res.render("admin/productManagement", {
      products,
      pagination,
      sort,
      search,
      filters,
      parentCategories,
      subCategories,
      brands,
    });
  } catch (error) {
    return handleError(res, error, "Failed to load products");
  }
};

// Load Add/Edit Product Form
exports.loadProductForm = async (req, res) => {
  try {
    const categories = await Category.find({ parentCategory: null });

    // If there is an ID in the parameters, load the product for editing
    if (req.params.id) {
      const productId = req.params.id;

      // Validate the product ID
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).send("Invalid product ID");
      }

      // Find the product by ID and populate the relevant fields
      const product = await Product.findById(productId)
        .populate("parentCategory")
        .populate("subCategory")
        .populate("variants");

      if (!product) {
        return res.status(404).send("Product not found");
      }

      // Render the edit product form
      return res.render("admin/editProduct", { product, categories });
    }

    // If no ID is present, render the add product form
    return res.render("admin/addProduct", { categories });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
};

// Fetch subcategories based on parent category
exports.getSubcategories = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const subCategories = await Category.find({ parentCategory: categoryId });
    res.json(subCategories);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.saveProduct = async (req, res) => {
  const productId = req.params.id;
  const {
    name,
    brand,
    parentCategory,
    subCategory,
    price,
    attributes,
    description,
    isActive,
    variants,
  } = req.body;

  try {
    // Handle file uploads
    const files = req.files || [];

    // Map files to variants
    const variantFilesMap = {};
    files.forEach((file) => {
      const match = file.fieldname.match(
        /variants\[(\d+)\]\[newImages\]\[(\d+)\]/
      );
      if (match) {
        const variantIndex = match[1];
        const imageIndex = match[2];
        if (!variantFilesMap[variantIndex]) {
          variantFilesMap[variantIndex] = [];
        }
        const path = file.path.replace(
          "C:\\Users\\YASNA UBAID\\Desktop\\Web development\\be.sky",
          ""
        );
        variantFilesMap[variantIndex].push({ imageIndex, path });
      }
    });

    let existingProduct = null;
    if (productId) {
      // Fetch the existing product for updates
      existingProduct = await Product.findById(productId);
      if (!existingProduct) {
        return res.status(404).send("Product not found.");
      }
    }

    // Handle variants
    const variantsData = variants.map((v, index) => {
      const {
        _id,
        color,
        sizes: sizesString,
        stocks: stocksString,
        isActive,
        existingImages = [],
      } = v;
      let images = [...existingImages];

      // Convert sizes and stock from comma-separated strings to arrays
      const sizes = sizesString.split(",").map((sz) => sz.trim());
      const stocks = stocksString
        .split(",")
        .map((st) => parseInt(st.trim(), 10));

      if (sizes.length !== stocks.length) {
        throw new Error(
          `Sizes and stock counts do not match for variant ${index}`
        );
      }

      // Replace specific images if new ones are uploaded
      if (variantFilesMap[index] && variantFilesMap[index].length > 0) {
        variantFilesMap[index].forEach(({ imageIndex, path }) => {
          images[imageIndex] = path;
        });
      }

      // Create the variant object, preserving the _id if it exists
      const variant = {
        _id, // This keeps the old _id if it's available, preventing MongoDB from generating a new one
        color,
        sizes: sizes.map((size, idx) => ({ size, stock: stocks[idx] })),
        images,
        isActive: isActive === "on",
      };

      return variant;
    });

    const productData = {
      name,
      brand,
      parentCategory,
      subCategory,
      price,
      attributes: attributes
        ? attributes.split(",").map((tag) => tag.trim())
        : [],
      description,
      variants: variantsData,
      isActive: isActive === "on",
    };

    if (productId) {
      // For updating existing product
      existingProduct.variants.forEach((existingVariant) => {
        // Find corresponding variant from the request
        const updatedVariant = variantsData.find(
          (v) => v._id && v._id.toString() === existingVariant._id.toString()
        );

        // Update the existing variant with new data if found
        if (updatedVariant) {
          Object.assign(existingVariant, updatedVariant);
        }
      });

      // Push new variants (those without _id)
      variantsData.forEach((newVariant) => {
        if (!newVariant._id) {
          existingProduct.variants.push(newVariant);
        }
      });

      // Update basic product data
      existingProduct.name = name;
      existingProduct.brand = brand;
      existingProduct.parentCategory = parentCategory;
      existingProduct.subCategory = subCategory;
      existingProduct.price = price;
      existingProduct.attributes = attributes
        ? attributes.split(",").map((tag) => tag.trim())
        : [];
      existingProduct.description = description;
      existingProduct.isActive = isActive === "on";

      // Save the updated product
      await existingProduct.save();
    } else {
      // For creating a new product
      await new Product(productData).save();
    }

    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while saving the product.");
  }
};

// Handle image deletion
exports.deleteImage = async (req, res) => {
  try {
    const { productId, variantIndex, imageIndex } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    if (!product.variants[variantIndex]) {
      return res.status(400).json({ message: "Variant not found." });
    }

    const imageToDelete = product.variants[variantIndex].images[imageIndex];

    if (!imageToDelete) {
      return res.status(400).json({ message: "Image not found." });
    }

    product.variants[variantIndex].images.splice(imageIndex, 1);

    await product.save();

    const imagePath = path.join(__dirname, "..", imageToDelete);
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error(`Error deleting image file: ${err.message}`);
      }
    });

    res.status(200).json({ message: "Image deleted successfully." });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const sort = req.query.sort || "-createdAt";
    const search = req.query.search || "";
    const filters = {};

    const query = {};

    if (search) {
      query.$or = [{ items: { $regex: search, $options: "i" } }];
    }

    const { data: orders, pagination } = await getPaginationData(
      Order,
      page,
      limit,
      query,
      "/admin/orders",
      [],
      sort
    );

    if (req.xhr) {
      return res.render("admin/orderManagement", {
        orders,
        pagination,
        sort,
        search,
        filters,
        layout: false,
      });
    }

    return res.render("admin/orderManagement", {
      orders,
      pagination,
      sort,
      search,
      filters,
    });
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/admin/orders");
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    console.log(orderId);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.orderStatus = status;

    // If status is 'cancelled', update product stock
    let notificationTitle;
    if (status === "returned") {
      order.orderStatus = "returned";
      order.approvalStatus = "approved";

      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (!product) continue;

        const variant = product.variants.id(item.variantId);
        if (!variant) continue;

        const sizeObj = variant.sizes.find((s) => s.size === item.size);
        if (sizeObj) sizeObj.stock += item.quantity; // Restock the item

        await product.save(); // Save updated product stock
      }

      // Refund the entire amount paid by the customer
      await WalletService.creditWallet(
        order.userId,
        order.grandTotal,
        "Full refund for returned order"
      );
    }

    order.updatedAt = Date.now();
    await order.save();

    await createNotification({
      title: `Order ${status}`,
      message: `The order ${orderId} has been ${status}.`,
      refId: orderId,
      refType: "Order",
      type: `Order ${status}`,
      notificationFor: ["user"],
      userId: order.userId,
    });

    return res
      .status(200)
      .json({ message: "Order item status updated successfully", order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// List all offers
exports.getAllOffers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const sort = req.query.sort || "-createdAt";
    const search = req.query.search || "";

    // Prepare filters from the request
    const filters = {
      status: req.query.statusFilter || "",
      // Add other filters as needed
    };

    const query = {};

    // Apply filters to the query
    if (filters.status) {
      query.status = filters.status;
    }

    if (search) {
      query.$or = [{ type: { $regex: search, $options: "i" } }];
    }

    const populateOptions = ["typeId"];
    const { data: offers, pagination } = await getPaginationData(
      Offer,
      page,
      limit,
      query,
      "/admin/offers",
      populateOptions,
      sort
    );

    if (req.xhr) {
      return res.render("admin/offerManagement", {
        offers,
        pagination,
        sort,
        search,
        filters,
        layout: false,
      });
    }

    return res.render("admin/offerManagement", {
      offers,
      pagination,
      sort,
      search,
      filters,
    });
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/admin/offers");
  }
};

// Create or Update an Offer
exports.saveOffer = async (req, res) => {
  const {
    offerType,
    typeId,
    discountRate,
    discountType,
    startDate,
    endDate,
    isActive,
  } = req.body;

  try {
    const existingOffer = await Offer.findOne({ typeId });
    let existingOfferId;
    if (existingOffer) {
      existingOfferId = existingOffer._id.toString();
    }
    const { id: offerId } = req.params;

    // Convert endDate to a Date object and add 23 hours, 59 minutes, 59 seconds, and 999 milliseconds
    let expiryDate = new Date(endDate).setHours(23, 59, 59, 999);

    const offerData = {
      offerType,
      typeId,
      discountRate,
      discountType,
      startDate,
      endDate: expiryDate,
      isActive: isActive === "on",
    };

    if (offerId) {
      // Update offer
      await Offer.findByIdAndUpdate(offerId, offerData);
      req.flash("success", "Offer updated successfully");
    } else if (existingOffer) {
      await Offer.findByIdAndUpdate(existingOfferId, offerData);
      req.flash("success", "Offer replaced successfully");
    } else {
      // Create new offer
      const newOffer = new Offer(offerData);
      await newOffer.save();
      req.flash("success", "Offer created successfully");
    }

    res.redirect("/admin/offers");
  } catch (error) {
    console.error("Error saving offer:", error);
    req.flash("error", "Error saving offer.");
    res.redirect("/admin/offers");
  }
};

// Fetch categories or products based on offerType
exports.getEntities = async (req, res) => {
  const { offerType } = req.query;

  try {
    if (offerType === "Category") {
      const categories = await Category.find();
      return res.json(categories);
    } else if (offerType === "Product") {
      const products = await Product.find();
      return res.json(products);
    } else {
      return res.status(400).json({
        message: 'Invalid offerType. Must be either "category" or "product".',
      });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error fetching data" });
  }
};

// Handle coupon deletion
exports.deleteOffer = async (req, res) => {
  const offerId = req.params.offerId;

  try {
    await Offer.findByIdAndDelete(offerId);
    req.flash("success", "Offer deleted successfully");
    res.redirect("/admin/offers");
  } catch (error) {
    console.error("Error deleting Offer:", error);
    req.flash("error", "Error deleting Offer.");
    res.redirect("/admin/offers");
  }
};

// Handle logout
exports.logout = async (req, res) => {
  try {
    res.clearCookie("adminToken");
    res.redirect("/admin/login");
  } catch (error) {
    console.error(error);
  }
};
