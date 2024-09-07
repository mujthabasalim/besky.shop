const Product = require("../models/Product");
const Category = require("../models/Category");
const Variant = require("../models/Variant");
const Review = require("../models/Review");
// Render verification page
exports.loadHome = async (req, res) => {
  try {
    res.render("user/home");
  } catch (error) {
    console.error(error);
  }
};

exports.loadShop = async (req, res) => {
  try {
    const filter = {};

    if (req.query.category) {
      filter.$or = [
        { parentCategory: req.query.category },
        { subCategory: req.query.category },
      ];
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.finalPrice = {};
      if (req.query.minPrice) {
        filter.finalPrice.$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        filter.finalPrice.$lte = parseFloat(req.query.maxPrice);
      }
    }

    if (req.query.color) {
      filter["variants.color"] = req.query.color;
    }

    if (req.query.size) {
      filter["variants.sizes.size"] = req.query.size;
    }

    const products = await Product.find(filter)
      .populate("parentCategory")
      .populate("subCategory")
      .populate("variants");

    // Flatten variants into a single list
    const variants = products.flatMap((product) =>
      product.variants.map((variant) => ({
        productId: product._id,
        productName: product.name,
        productBrand: product.brand,
        productPrice: product.price,
        productFinalPrice: product.finalPrice,
        variant,
      }))
    );

    // Fetch all categories for the filters
    const categories = await Category.find().populate({
      path: "parentCategory",
      select: "name",
    });

    res.render("user/shop", {
      variants,
      categories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while loading the shop.");
  }
};

exports.showProduct = async (req, res) => {
  const { variantId } = req.params;

  try {
    const product = await Product.findOne({ variants: variantId })
      .populate({
        path: "variants",
        match: { _id: variantId },
      })
      .populate({
        path: 'reviews'
      });

    if (!product) {
      return res.status(404).send('Product not found');
    }

    const reviewCount = product.reviews.length;
    const averageRating = reviewCount > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
      : 0;

    const variants = await Product.findById(product._id)
    .populate("variants")
    .populate('reviews')

    const variant = product.variants[0];
    const hasStock = variant.sizes.some(size => size.stock > 0);
    const stockStatus = hasStock ? 'In stock' : 'Out of stock';

    res.render("user/productDetails", {
      product,
      variant,
      variants: variants.variants,
      reviewCount,
      averageRating,
      stockStatus,
    });
  } catch (error) {
    console.error(error);
  }
};
