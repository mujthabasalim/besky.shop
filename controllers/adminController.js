require('dotenv').config();
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const bcrypt = require('bcrypt');
const { generateToken } = require('../services/jwtService');
const getPaginationData = require('../utils/pagination');
const mongoose = require('mongoose');

// Common Error Handler
const handleError = (res, error, message = 'Server Error') => {
    console.error(message, error);
    return res.status(500).send(message);
};

// Utility to find an entity by ID and handle errors
const findEntityById = async (model, id, res) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ID');
    }
    const entity = await model.findById(id);
    if (!entity) {
        return res.status(404).send(`${model.modelName} not found`);
    }
    return entity;
};

// Render Login Page
exports.loadLogin = (req, res) => res.render('admin/login');

// Handle Login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await User.findOne({ email, role: 'admin' });
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.render('admin/login', { errorMessage: 'Invalid credential' });
        }
        const adminToken = generateToken(admin);
        res.cookie('adminToken', adminToken, { httpOnly: true, secure: true });
        return res.redirect('/admin/dashboard');
    } catch (error) {
        return handleError(res, error, 'Login failed');
    }
};

// Render Admin Dashboard
exports.loadDashboard = (req, res) => res.render('admin/dashboard');

// User Management: View Users
exports.viewUsers = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const limit = 10;
        const { data: users, pagination } = await getPaginationData(User, page, limit, { role: 'user' });
        return res.render('admin/userManagement', { users, pagination });
    } catch (error) {
        return handleError(res, error, 'Failed to load users');
    }
};

// Update User Status
exports.updateUserStatus = async (req, res) => {
    try {
        const user = await findEntityById(User, req.params.userId, res);
        if (user) {
            user.status = user.status === 'Active' ? 'Blocked' : 'Active';
            await user.save();
            return res.status(200).json({ success: true, newStatus: user.status });
        }
    } catch (error) {
        return handleError(res, error, 'Failed to update user status');
    }
};

// Category Management: View All Categories
exports.getAllCategories = async (req, res) => {
  try {
    const { page = 1, search = '', parentCategory, status } = req.query;
    const limit = 10;

    // Create the filter object
    const filter = {
      name: { $regex: search, $options: 'i' },
      ...(parentCategory && { parentCategory }),  // only include if parentCategory is provided
      ...(status && { status }),  // only include if status is provided
    };

    const populateOptions = [{ path: 'parentCategory', select: 'name' }];
    const { data: categories, pagination } = await getPaginationData(Category, page, limit, filter, populateOptions);

    return res.render('admin/categoryManagement', {
      categories,
      pagination,
      searchQuery: search,  // renamed for clarity
      parentCategoryFilter: parentCategory,  // pass the filter name directly
      statusFilter: status,  // pass the filter name directly
    });
  } catch (error) {
    return handleError(res, error, 'Failed to load categories');
  }
};


// Add or Update Category
exports.saveCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, parentCategory, status } = req.body;
        const categoryData = { name, parentCategory: parentCategory || null, status };
        if (categoryId) {
            await Category.findByIdAndUpdate(categoryId, categoryData, { new: true });
        } else {
            await new Category(categoryData).save();
        }
        return res.redirect('/admin/categories');
    } catch (error) {
        return handleError(res, error, 'Failed to save category');
    }
};

// Product Management: View All Products
exports.getAllProducts = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const limit = 10;
        const populateOptions = ['parentCategory', 'subCategory', 'variants'];
        const { data: products, pagination } = await getPaginationData(Product, page, limit, {}, populateOptions);
        return res.render('admin/productManagement', { products, pagination });
    } catch (error) {
        return handleError(res, error, 'Failed to load products');
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

// Handle product addition
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      description,
      parentCategory,
      subCategory,
      price,
      discount,
      attributes,
      isActive: isActiveString,
      variants,
    } = req.body;

    // Handle file uploads
    const files = req.files || []; // All uploaded files

    // Map files to variants
    const variantFilesMap = {};
    files.forEach((file) => {
      // Extract the variant index from the file fieldname
      const match = file.fieldname.match(/variants\[(\d+)\]\[images\]\[\]/);
      if (match) {
        const variantIndex = match[1];
        if (!variantFilesMap[variantIndex]) {
          variantFilesMap[variantIndex] = [];
        }
        path = file.path.replace(
          "C:\\Users\\YASNA UBAID\\Desktop\\Web development\\be.sky",
          ""
        );
        variantFilesMap[variantIndex].push(path);
      }
    });

    // Handle variants
    const variantPromises = variants.map(async (variant, index) => {
      const {
        color,
        sizes: sizesString,
        stock: stockString,
        isActive: variantIsActiveString,
      } = variant;
      const images = variantFilesMap[index] || [];

      // Convert sizes and stock from comma-separated strings to arrays
      const sizes = sizesString.split(",").map((size) => size.trim());
      const stock = stockString.split(",").map((s) => parseInt(s.trim(), 10));

      // Check if sizes and stock arrays have the same length
      if (sizes.length !== stock.length) {
        throw new Error("Sizes and stock counts do not match");
      }

      // Convert variant's isActive from string to boolean
      const variantIsActive = variantIsActiveString === "on";

      // Create Variant
      const newVariant = new Variant({
        color,
        sizes: sizes.map((size, index) => ({ size, stock: stock[index] })),
        images: images.map((image) => ({ url: image })),
        isActive: variantIsActive,
      });

      return newVariant.save();
    });

    const savedVariants = await Promise.all(variantPromises);

    // Create Product
    const newProduct = new Product({
      name,
      brand,
      description,
      parentCategory,
      subCategory,
      price,
      discount,
      finalPrice: Math.round(price - (price * discount) / 100),
      attributes: attributes
        ? attributes.split(",").map((attr) => attr.trim())
        : [],
      variants: savedVariants.map((variant) => variant._id),
      isActive: isActiveString === "on",
    });

    await newProduct.save();

    res.redirect("/admin/products"); // Redirect to the products list or a success page
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};



// Handle product update
exports.updateProduct = async (req, res) => {
  const productId = req.params.id;
  console.log(productId);
  
  const {
    name,
    brand,
    parentCategory,
    subCategory,
    price,
    discount,
    attributes,
    description,
    isActive: isActiveString,
    variants,
  } = req.body;

  try {
    // Handle file uploads
    const files = req.files || []; // All uploaded files

    // Find the existing product by id
    const product = await Product.findById(productId).populate('variants');
    if (!product) {
      return res.render("admin/editProduct", { errorMessage: "Product Not found" });
    }

    // Map files to variants
    const variantFilesMap = {};
    files.forEach((file) => {
      const match = file.fieldname.match(/variants\[(\d+)\]\[images\]\[\]/);
      if (match) {
        const variantIndex = match[1];
        if (!variantFilesMap[variantIndex]) {
          variantFilesMap[variantIndex] = [];
        }
        const path = file.path.replace(
          "C:\\Users\\YASNA UBAID\\Desktop\\Web development\\be.sky",
          ""
        );
        variantFilesMap[variantIndex].push(path);
      }
    });

    // Iterate through variants in the request and update or create them
    const updatedVariants = await Promise.all(
      variants.map(async (variant, index) => {
        const {
          _id: variantId,
          color,
          sizes: sizesString,
          stock: stockString,
          isActive: variantIsActiveString,
        } = variant;
    
        // Handle image uploads for this variant
        const newImages = variantFilesMap[index] || [];
    
        // Convert sizes and stock from comma-separated strings to arrays
        const sizes = sizesString.split(",").map((size) => size.trim());
        const stock = stockString.split(",").map((s) => parseInt(s.trim(), 10));
    
        // Check if sizes and stock arrays have the same length
        if (sizes.length !== stock.length) {
          const errorMsg = `Sizes and stock counts do not match for variant ID: ${variantId}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
    
        // Convert variant's isActive from string to boolean
        const variantIsActive = variantIsActiveString === "on";
    
        let existingVariant;
        if (variantId) {
          // Check if variantId is defined and try to find the existing variant
          existingVariant = product.variants.find(v => v._id.toString() === variantId.toString());
        }
    
        if (existingVariant) {
          // Update existing variant
          existingVariant.color = color;
          existingVariant.sizes = sizes.map((size, idx) => ({ size, stock: stock[idx] }));
          
          // Append new images to the existing images array
          if (newImages.length > 0) {
            existingVariant.images = [
              ...existingVariant.images,
              ...newImages.map((image) => ({ url: image }))
            ];
          }
    
          existingVariant.isActive = variantIsActive;
    
          await existingVariant.save();
          return existingVariant;
        } else {
          // Create new variant if it doesn't exist
          const newVariant = new Variant({
            color,
            sizes: sizes.map((size, idx) => ({ size, stock: stock[idx] })),
            images: newImages.map((image) => ({ url: image })),
            isActive: variantIsActive,
          });
    
          await newVariant.save();
          return newVariant;
        }
      })
    );
    

    // Update the product details
    product.name = name;
    product.brand = brand;
    product.parentCategory = parentCategory;
    product.subCategory = subCategory;
    product.price = price;
    product.discount = discount;
    product.finalPrice = Math.round(price - (price * discount) / 100);
    product.attributes = attributes ? attributes.split(",").map((attr) => attr.trim()) : [];
    product.description = description;
    product.isActive = isActiveString === 'on';
    product.updatedAt = Date.now();

    // Save the updated product
    await product.save();

    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error updating product:", error.message);
    res.status(500).send("Server Error");
  }
};


// Delete Image
exports.deleteImage = async (req, res) => {
    try {
        const variant = await Variant.findOne({ "images._id": req.params.imageId });
        if (variant) {
            variant.images.id(req.params.imageId).remove();
            await variant.save();
            return res.status(200).json({ message: 'Image deleted successfully' });
        }
    } catch (error) {
        return handleError(res, error, 'Failed to delete image');
    }
};

// Handle image deletion
exports.deleteImage = async (req, res) => {
  const { imageId } = req.params;

  try {
    const variant = await Variant.findOne({ "images._id": imageId });
    
    if (variant) {
      variant.images = variant.images.filter(image => image._id.toString() !== imageId);
      await variant.save();
      return res.status(200).json({ message: 'Image deleted from variant' });
    }

    return res.status(404).json({ message: 'Image not found' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).send('Internal Server Error');
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

// Handle logout
exports.logout = (req, res) => {
  try {
    res.clearCookie("adminToken");
    res.redirect("/admin/login");
  } catch (error) {
    console.error(error);
  }
};
