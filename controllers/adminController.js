require("dotenv").config();
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const bcrypt = require("bcrypt");
const { generateToken } = require("../services/jwtService");
const getPaginationData = require("../utils/pagination");

// TODO: Login logics
// Render Login Page
exports.loadLogin = async (req, res) => {
  try {
    res.render("admin/login");
  } catch (error) {
    console.log(error);
  }
};

// Handle Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ email, role: "admin" });

    if (!admin) {
      return res.render("admin/login", { errorMessage: "Invalid credential" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.render("admin/login", { errorMessage: "Invalid credential" });
    }

    // Generate JWT token
    const adminToken = generateToken(admin);

    // Store the token and admin first name in cookies
    res.cookie("adminToken", adminToken, { httpOnly: true, secure: true }); // 1 day expiration

    res.redirect("/admin/dashboard");
    console.log("login success");
  } catch (error) {
    console.log(error);
  }
};

// TODO: Dashboard logics
// Render Admin Dashboard
exports.loadDashboard = async (req, res) => {
  try {
    res.render("admin/dashboard");
  } catch (error) {
    console.log(error);
  }
};

// TODO: User management logics
// Render user management
exports.viewUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    // Use the pagination utility function
    const { data: users, pagination } = await getPaginationData(
      User,
      page,
      limit,
      { role: "user" }
    );

    // Update the pagination URLs to reflect the correct route
    pagination.prevPageUrl = pagination.prevPageUrl
      ? `/admin/users?page=${pagination.prevPageUrl}`
      : null;
    pagination.nextPageUrl = pagination.nextPageUrl
      ? `/admin/users?page=${pagination.nextPageUrl}`
      : null;

    res.render("admin/userManagement", { users, pagination });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

// Update user status (active, blocked)
exports.updateUserStatus = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    if (user) {
      user.status = user.status === "Active" ? "Blocked" : "Active";
      await user.save();

      // Send back the new status to the client
      res.status(200).json({ success: true, newStatus: user.status });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// TODO: Category management logics
// Fetch and display all categories
exports.getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    // Handle search and filters
    const searchQuery = req.query.search || "";
    const parentCategoryFilter = req.query.parentCategory || null;
    const statusFilter = req.query.status || null;

    // Build the filter object
    const filter = {
      name: { $regex: searchQuery, $options: "i" }, // Case-insensitive search by name
    };

    if (parentCategoryFilter) {
      filter.parentCategory = parentCategoryFilter;
    }

    if (statusFilter) {
      filter.status = statusFilter;
    }

    const populateOptions = [{ path: "parentCategory", select: "name" }];

    // Use the pagination utility function
    const { data: categories, pagination } = await getPaginationData(
      Category,
      page,
      limit,
      filter,
      populateOptions
    );

    // Assume we pass currentCategoryId as a query parameter when editing a category
    const currentCategoryId = req.query.currentCategoryId;
    const currentCategory = currentCategoryId
      ? await Category.findById(currentCategoryId)
      : null;

    res.render("admin/categoryManagement", {
      categories,
      pagination,
      searchQuery,
      parentCategoryFilter,
      statusFilter,
      currentCategoryParent: currentCategory
        ? currentCategory.parentCategory
        : "",
      currentCategoryStatus: currentCategory ? currentCategory.status : "",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

// Add a new category or subcategory
exports.addCategory = async (req, res) => {
  const { name, parentCategory } = req.body;

  try {
    const newCategory = new Category({
      name,
      parentCategory: parentCategory || null,
    });
    await newCategory.save();
    res.redirect("/admin/categories");
  } catch (error) {
    console.log(error);
  }
};

// Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, parentCategory, status } = req.body;

    // Find the category and update it
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { name, parentCategory: parentCategory ? parentCategory : null, status },
      { new: true } // Return the updated document
    );

    if (!updatedCategory) {
      return res.status(404).send("Category not found");
    }

    res.redirect("/admin/categories"); 
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// TODO: Product management logics
// Display all products
exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const populateOptions = [
      { path: "parentCategory" },
      {path: 'subcategory'},
      {path: 'variants'}
    ];
    // Use the pagination utility function
    const {data: products, pagination} = await getPaginationData(
      Product,
      page,
      limit,
      populateOptions
    );

    // Update the pagination URLs to reflect the correct route
    pagination.prevPageUrl = pagination.prevPageUrl
      ? `/admin/products?page=${pagination.prevPageUrl}`
      : null;
    pagination.nextPageUrl = pagination.nextPageUrl
      ? `/admin/products?page=${pagination.nextPageUrl}`
      : null;
    
    res.render("admin/productManagement", { products, pagination });
  } catch (error) {
    console.error(error);
  }
};

// Load add product form
exports.loadAddForm = async (req, res) => {
  try {
    const categories = await Category.find({ parentCategory: null });
    res.render("admin/addProduct", { categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// Add a new product
exports.addProduct = async (req, res) => {
  const {
    name,
    brand,
    category,
    subcategory,
    quantity,
    price,
    discountPrice,
    description,
    colors,
    images,
  } = req.body;
  console.log(req.body);

  try {
    const product = await Product.findOne({ name });
    if (product) {
      res.render("admin/productManagement", {
        errorMessage: "Product already exist",
      });
    }

    const newProduct = new Product({
      name,
      brand,
      category,
      subcategory,
      quantity,
      price,
      discountPrice,
      description,
      colors,
      images,
    });

    await newProduct.save();

    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
  }
};

// Handle logout
exports.logout = (req, res) => {
  try {
    res.clearCookie("adminToken");
    res.redirect("/admin/login");
  } catch (error) {
    console.error(error);
  }
};
