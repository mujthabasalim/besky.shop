const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Offer = require("../models/Offer");
const Coupon = require("../models/Coupon");
const Wishlist = require("../models/Wishlist");
const Wallet = require("../models/Wallet");
const Review = require("../models/Review");
const { applyHighestDiscount } = require("../utils/discountCalculator");
const WalletService = require("../services/WalletService");
const { createNotification } = require("../services/notificationService");
const { generateInvoice } = require("../services/pdfService");
const Notification = require("../models/Notification");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const getPaginationData = require("../utils/pagination");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

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
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const sort = req.query.sort || "-createdAt";

    // Initialize filter with isActive checks for product and categories
    const filter = {
      isActive: true,  // Product must be active
      parentCategory: { $exists: true },
      subCategory: { $exists: true },
    };

    // Only include products with active parent and subcategories
    const activeCategories = await Category.find({ isActive: true }).select('_id');

    const activeCategoryIds = activeCategories.map(category => category._id);

    filter.parentCategory = { $in: activeCategoryIds };
    filter.subCategory = { $in: activeCategoryIds };

    // Additional filters based on query parameters
    if (req.query.category) filter.subCategory = req.query.category;

    if (req.query.price) {
      const priceRange = req.query.price.split("-");
      const minPrice = parseInt(priceRange[0]);
      const maxPrice = parseInt(priceRange[1]);
      filter.price = { $gte: minPrice, $lte: maxPrice };
    }

    if (req.query.color) {
      filter["variants.color"] = { $regex: req.query.color, $options: "i" };
    }

    if (req.query.size) {
      filter["variants.sizes.size"] = { $regex: req.query.size, $options: "i" };
    }

    if (req.query.search) {
      const matchedCategories = await Category.find({
        name: { $regex: req.query.search, $options: "i" },
        isActive: true  // Ensure searched categories are active
      });
      const categoryIds = matchedCategories.map((category) => category._id);

      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { brand: { $regex: req.query.search, $options: "i" } },
        { attributes: { $elemMatch: { $regex: req.query.search, $options: "i" } } },
        { parentCategory: { $in: categoryIds } },
        { subCategory: { $in: categoryIds } },
      ];
    }

    const populateOptions = [
      { path: "parentCategory", select: "name" },
      { path: "subCategory", select: "name" },
      { path: "variants" },
    ];

    const { data: products, pagination } = await getPaginationData(
      Product,
      page,
      limit,
      filter,
      "/shop",
      populateOptions,
      sort
    );

    const currentDate = new Date();
    const offers = await Offer.find({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    const productsWithDiscounts = products.map((product) => {
      const discountedPrice = applyHighestDiscount(product, offers);
      return {
        ...product.toObject(),
        discountedPrice,
      };
    });

    const categories = await Category.find().populate({
      path: "parentCategory",
      select: "name",
    });

    let wishlist = [];
    if (req.user) {
      const userWishlist = await Wishlist.findOne({ userId: req.user.id });
      if (userWishlist) {
        wishlist = userWishlist.products.map((item) => item.productId.toString());
      }
    }

    if (req.xhr) {
      return res.json({
        products: productsWithDiscounts,
        categories,
        wishlist,
        pagination,
      });
    } else {
      res.render('user/shop', {
        products: productsWithDiscounts,
        categories,
        wishlist,
        pagination,
        query: req.query,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while loading the shop.');
  }
};

exports.searchProduct = async (req, res) => {
  const { query } = req.query;

  try {
    if (!query || query.trim() === "") {
      return res.redirect(req.get("referer") || "/");
    }

    res.redirect(`/shop?search=${encodeURIComponent(query)}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.showProduct = async (req, res) => {
  const { productId, variantIndex } = req.params;

  try {
    const product = await Product.findOne({ _id: productId }).populate({
      path: "reviews",
    });

    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Fetch active offers that are currently valid
    const currentDate = new Date();
    const offers = await Offer.find({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    // Calculate discounted prices for each product
    product.discountedPrice = applyHighestDiscount(product, offers);

    const reviewCount = product.reviews.length;
    const averageRating =
      reviewCount > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviewCount
        : 0;

    const variant = product.variants[variantIndex];
    const hasStock = variant.sizes.some((size) => size.stock > 0);
    const stockStatus = hasStock ? "In stock" : "Out of stock";

    // Fetch the user's wishlist if the user is logged in
    let wishlist = [];
    if (req.user) {
      const userWishlist = await Wishlist.findOne({ userId: req.user.id });
      if (userWishlist) {
        wishlist = userWishlist.products.map((item) =>
          item.productId.toString()
        );
      }
    }

    res.render("user/productDetails", {
      product,
      variant,
      reviewCount,
      averageRating,
      stockStatus,
      wishlist,
    });
  } catch (error) {
    console.error(error);
  }
};

// Render profile page
exports.showProfile = async (req, res) => {
  try {
    const user = await User.findById({ _id: req.user.id });
    res.render("user/profile", { user });
  } catch (error) {
    console.error(error);
  }
};

// Handle profile update
exports.updateProfile = async (req, res) => {
  const { firstName, lastName, phone, email } = req.body;

  try {
    const user = await User.findById(req.user.id);

    let profilePicture = user.profilePicture;
    if (req.file) {
      profilePicture = req.file.path.replace(
        "C:\\Users\\YASNA UBAID\\Desktop\\Web development\\be.sky",
        ""
      );
    }

    const userData = { firstName, lastName, phone, email, profilePicture };

    if (user) {
      await User.findByIdAndUpdate(user, userData, { new: true });
      res.redirect("/protected/profile");
    } else {
      console.log("User not found");
    }
  } catch (error) {
    console.error(error);
  }
};

// Handle address addition and updating
exports.saveAddress = async (req, res) => {
  const {
    addressId,
    fName,
    lName,
    contactNo,
    houseName,
    area,
    landmark,
    postcode,
    city,
    state,
    type,
    isDefault,
  } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.render("user/profile", { errorMessage: "User not found" });
    }

    const addressData = {
      fName,
      lName,
      contactNo: parseInt(contactNo),
      houseName,
      area,
      landmark,
      postcode: parseInt(postcode, 10),
      city,
      state,
      type,
      isDefault: isDefault === "on",
    };

    // If the address is set as default, make others non-default
    if (addressData.isDefault) {
      user.addresses.forEach((address) => (address.isDefault = false));
    }

    if (addressId) {
      // If addressId exists, update the existing address
      const addressIndex = user.addresses.findIndex(
        (address) => address._id.toString() === addressId
      );

      if (addressIndex !== -1) {
        user.addresses[addressIndex] = {
          ...user.addresses[addressIndex],
          ...addressData,
        };
      } else {
        return res.render("user/profile", {
          errorMessage: "Address not found",
        });
      }
    } else {
      // Otherwise, add a new address
      user.addresses.push(addressData);
    }

    await user.save();

    // Redirect back to the previous page instead of a specific URL
    res.redirect(req.get("referer") || "/protected/profile");
  } catch (error) {
    console.error(error);
    res.render("user/profile", {
      errorMessage: "An error occurred while saving the address.",
    });
  }
};

// Handle address deletion
exports.deleteAddress = async (req, res) => {
  const addressId = req.params.addressId;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log("User not found");
      return res.render("user/profile", { errorMessage: "User not found" });
    }

    const addressIndex = user.addresses.findIndex(
      (address) => address._id.toString() === addressId
    );

    if (addressIndex !== -1) {
      // Remove the address from the array
      user.addresses.splice(addressIndex, 1);

      await user.save();

      // Redirect back to the previous page instead of a specific URL
      res.redirect(req.get("referer") || "/protected/profile");
    } else {
      console.log("Address not found");
      return res.render("user/profile", { errorMessage: "Address not found" });
    }
  } catch (error) {
    console.error(error);
    console.log("An error occurred while deleting the address.");
    res.render("user/profile", {
      errorMessage: "An error occurred while deleting the address.",
    });
  }
};

const calculateCartSummaryAndValidate = async (userId, couponCode = null) => {
  const cart = await Cart.findOne({ userId }).populate("items.productId");
  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const currentDate = new Date();
  const offers = await Offer.find({
    isActive: true,
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate },
  });

  let subtotal = 0;
  const cartItems = cart.items.map((item) => {
    const product = item.productId;
    const variant = product.variants.id(item.variantId);
    const sizeData = variant.sizes.find((s) => s.size === item.size);

    if (!variant || !sizeData || sizeData.stock < item.quantity) {
      throw new Error(
        `Insufficient stock for ${product.name} (${item.size}, ${variant.color}).`
      );
    }

    const inventoryStatus = sizeData.stock > 0 ? "In stock" : "Stock out";
    const discountedPrice = applyHighestDiscount(product, offers);
    const total = item.quantity * discountedPrice;
    subtotal += total;

    return {
      productId: product._id,
      variantId: variant._id,
      name: product.name,
      size: item.size,
      color: variant.color,
      image: variant.images[0],
      quantity: item.quantity,
      originalPrice: product.price,
      discountedPrice,
      total,
      inventoryStatus,
    };
  });

  // Apply coupon logic
  let couponDiscount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({
      couponCode,
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });
    if (!coupon) throw new Error("Invalid coupon.");
    if (subtotal < coupon.minPurchase) {
      throw new Error(`Minimum purchase required is ₹${coupon.minPurchase}.`);
    }
    // Check if user has already used the coupon
    if (coupon.usedBy.includes(userId)) {
      throw new Error("Coupon has already been used.");
    }

    couponDiscount =
      coupon.discountType === "Percentage"
        ? Math.min((subtotal * coupon.discountRate) / 100, coupon.maxDiscount)
        : Math.min(coupon.discountRate, coupon.maxDiscount);
    subtotal -= couponDiscount;
  }

  const deliveryCharge = subtotal >= 5000 ? 0 : 40;
  const grandTotal = subtotal + deliveryCharge;

  return {
    cartItems,
    cartSummary: {
      subtotal,
      deliveryCharge,
      couponDiscount,
      grandTotal,
    },
  };
};

// Show cart data
exports.showCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      if (req.path === "/protected/cart/data") {
        return res.json({
          success: true,
          cartItems: [],
          cartSummary: { subtotal: 0, deliveryCharge: 0, grandTotal: 0 },
        });
      }
    }

    const couponCode = req.session.couponCode || null;

    const { cartItems, cartSummary } = await calculateCartSummaryAndValidate(
      userId,
      couponCode
    );

    if (req.path === "/protected/cart") {
      return res.render("user/cart", { cartItems, cartSummary });
    } else {
      return res.json({ success: true, cartItems, cartSummary });
    }
  } catch (error) {
    console.error("Error fetching cart:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch cart data." });
  }
};

// Manage cart: add or update items
exports.manageCart = async (req, res) => {
  const { productId, variantId, size, quantity } = req.body;

  if (
    !productId ||
    !variantId ||
    !size ||
    typeof quantity !== "number" ||
    quantity <= 0
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product details." });
  }

  try {
    const userId = req.user.id;

    const cart =
      (await Cart.findOne({ userId })) || new Cart({ userId, items: [] });

    const product = await Product.findById(productId).select("variants");
    const variant = product.variants.id(variantId);
    const sizeData = variant.sizes.find((s) => s.size === size);

    if (!sizeData || sizeData.stock < quantity) {
      throw new Error("Insufficient stock for the selected size");
    }

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        item.variantId.toString() === variantId &&
        item.size === size
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity = quantity;
    } else {
      cart.items.push({ productId, variantId, size, quantity });
    }

    await cart.save();
    return await exports.showCart(req, res);
  } catch (error) {
    console.error("Error managing cart:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Apply coupon code
exports.applyCoupon = async (req, res) => {
  const { couponCode } = req.body;
  try {
    const userId = req.user.id;
    const updatedCartSummary = await calculateCartSummaryAndValidate(
      userId,
      couponCode
    );

    req.session.couponCode = couponCode || req.session.couponCode;

    return res.json({
      success: true,
      cartSummary: updatedCartSummary.cartSummary,
      couponCode,
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove coupon code
exports.removeCoupon = async (req, res) => {
  try {
    const userId = req.user.id;

    // Recalculate the cart summary without the coupon
    const { cartItems, cartSummary } = await calculateCartSummaryAndValidate(
      userId
    );

    req.session.couponCode = null;
    return res.status(200).json({
      success: true,
      message: "Coupon removed successfully.",
      cartSummary,
    });
  } catch (error) {
    console.error("Error removing coupon:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove coupon.",
    });
  }
};

// Delete product from cart
exports.deleteCart = async (req, res) => {
  const { productId, variantId } = req.body;

  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found!" });
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        item.variantId.toString() === variantId
    );

    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in cart!" });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    return res.json({
      success: true,
      message: "Product removed from cart successfully!",
    });
  } catch (error) {
    console.error("Error deleting item from cart:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the item from the cart.",
    });
  }
};

// Save checkout details (selected address, coupon, payment method)
exports.saveToNext = async (req, res) => {
  try {
    const { selectedAddressId, couponCode, selectedPaymentMethod } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    req.session.addressId = selectedAddressId || req.session.addressId;
    req.session.couponCode = couponCode || req.session.couponCode;
    req.session.paymentMethod =
      selectedPaymentMethod || req.session.paymentMethod;

    res.json({
      success: true,
      message: "Checkout details saved successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error!" });
  }
};

// Handle checkout stages (shipping, payment, summary)
exports.handleCheckoutStage = async (req, res) => {
  try {
    const { stage } = req.params;
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    const shippingAddress = user.addresses.id(req.session.addressId);
    const couponCode = req.session.couponCode;
    const paymentMethod = req.session.paymentMethod;

    const { cartItems, cartSummary } = await calculateCartSummaryAndValidate(
      userId,
      couponCode
    );

    const currentDate = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
      usedBy: { $nin: user.id },
    }).sort({ createdAt: -1 });

    const walletBalance = await WalletService.getBalance(userId);

    switch (stage) {
      case "shipping":
        return res.render("user/shippingAddress", {
          user,
          couponCode,
          cartItems,
          cartSummary,
          coupons,
        });
      case "payment":
        return res.render("user/paymentMethod", {
          user,
          walletBalance,
          cartItems,
          cartSummary,
        });
      case "summary":
        return res.render("user/orderSummary", {
          user,
          cartItems,
          shippingAddress,
          paymentMethod,
          cartSummary,
        });
      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid checkout stage!" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error!" });
  }
};

// Main function to handle order placement
exports.placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { couponCode } = req.session;
    const addressId = req.session.addressId;
    const paymentMethod = req.session.paymentMethod;

    // Validate payment method
    if (!paymentMethod) {
      return res
        .status(400)
        .json({ success: false, message: "Payment method is missing." });
    }

    // Fetch the user to get the shipping address
    const user = await User.findById(userId).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Find the shipping address by ID
    const shippingAddress = user.addresses.find(
      (address) => address._id.toString() === addressId
    );
    if (!shippingAddress) {
      return res
        .status(400)
        .json({ success: false, message: "Shipping address not found." });
    }

    // If coupon is applied, check if the user has already used it
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ couponCode });

      if (!coupon) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid coupon code." });
      }

      // Check if user has already used the coupon
      if (coupon.usedBy.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: "Coupon has already been used.",
        });
      }
    }

    // Validate cart and calculate total amounts using the summary function
    const { cartItems, cartSummary } = await calculateCartSummaryAndValidate(
      userId,
      couponCode
    );

    // Create the order object
    const order = new Order({
      userId,
      items: cartItems,
      shippingAddress,
      paymentMethod,
      discountCode: couponCode || null,
      couponDiscount: cartSummary.couponDiscount || 0,
      subtotal: cartSummary.subtotal,
      deliveryCharge: cartSummary.deliveryCharge,
      grandTotal: cartSummary.grandTotal,
      paymentStatus: paymentMethod === "cod" ? "pending" : "awaiting_payment",
    });

    // Check if payment method is 'wallet' and proceed to debit the wallet
    if (paymentMethod === "wallet") {
      // Debit the wallet for the total amount
      const debitResult = await WalletService.debitWallet(
        userId,
        cartSummary.grandTotal,
        "Order Payment"
      );

      if (!debitResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to process wallet payment.",
        });
      }

      // If payment was successful, update payment status
      order.paymentStatus = "paid";
    }

    // Reduce stock for COD or Wallet payments (since they are confirmed payments)
    if (paymentMethod === "cod" || paymentMethod === "wallet") {
      for (const item of cartItems) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product with ID ${item.productId} not found.`,
          });
        }

        const variant = product.variants.id(item.variantId);
        if (!variant) {
          return res.status(404).json({
            success: false,
            message: `Variant with ID ${item.variantId} not found.`,
          });
        }

        // Find the size and reduce the stock
        const sizeObj = variant.sizes.find((s) => s.size === item.size);
        if (sizeObj) {
          if (sizeObj.stock < item.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for product ${product.name}, size ${item.size}.`,
            });
          }

          sizeObj.stock -= item.quantity;
        } else {
          return res.status(404).json({
            success: false,
            message: `Size ${item.size} not found for product ${item.productId}.`,
          });
        }

        await product.save();
      }
    }

    // Save the order
    await order.save();

    // If coupon is applied, mark it as used by the user
    if (couponCode) {
      coupon.usedBy.push(userId);
      await coupon.save();
    }

    // For Razorpay, create payment and send Razorpay order ID back
    if (paymentMethod === "razorpay") {
      try {
        const razorpayOrder = await razorpay.orders.create({
          amount: order.grandTotal * 100,
          currency: "INR",
          receipt: `order_${order._id}`,
        });

        return res.status(200).json({
          success: true,
          razorpayOrderId: razorpayOrder.id,
          orderId: order._id,
          amount: order.grandTotal,
          message: "Order created successfully. Proceed with Razorpay payment.",
        });
      } catch (err) {
        console.error("Error creating Razorpay order:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to create Razorpay order.",
        });
      }
    }

    // Clear the cart after the order is placed
    await Cart.findOneAndUpdate({ userId }, { items: [] });

    // Clear session data after order
    req.session.addressId = null;
    req.session.paymentMethod = null;
    req.session.couponCode = null;

    // If wallet or COD, return success
    res
      .status(200)
      .json({ success: true, message: "Order placed successfully.", order });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  const { razorpayPaymentId, razorpayOrderId, razorpaySignature, orderId } =
    req.body;

  try {
    // Fetch the order to check payment method
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    // If the order was paid using the wallet, no need to verify Razorpay payment
    if (order.paymentMethod === "wallet") {
      return res.status(200).json({
        success: true,
        message: "Wallet payment already verified.",
      });
    }

    // if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature || !orderId) {
    //   console.log("razorpayPaymentId", razorpayPaymentId, 'razorpayOrderId', razorpayOrderId, 'razorpaySignature', 'orderId', orderId)
    //   return res.status(400).json({ success: false, message: "Missing required parameters." });
    // }

    // Generate the expected signature using Razorpay secret
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    // Compare the generated signature with the Razorpay signature
    if (generatedSignature === razorpaySignature) {
      // Update order status to 'paid' on successful payment
      order.paymentStatus = "paid";
      order.razorpayPaymentId = razorpayPaymentId;
      await order.save();

      // Clear the cart after the order is placed
      await Cart.findOneAndUpdate({ userId: order.userId }, { items: [] });

      // Clear session data after order
      req.session.addressId = null;
      req.session.paymentMethod = null;
      req.session.couponCode = null;

      return res
        .status(200)
        .json({ success: true, message: "Payment verified successfully." });
    } else {
      // Payment failed, update status to 'failed'
      order.paymentStatus = "failed";
      await order.save();
      return res
        .status(400)
        .json({
          success: false,
          message: "Payment verification failed. Please try again.",
        });
    }
  } catch (error) {
    console.error("Error during payment verification:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Internal server error during payment verification.",
      });
  }
};

exports.retryPayment = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    if (order.paymentStatus === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Order is already paid." });
    }

    // Create a new Razorpay order for retry payment
    const razorpayOrder = await razorpay.orders.create({
      amount: order.grandTotal * 100,
      currency: "INR",
      receipt: `retry_order_${order._id}`,
    });

    res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: order.grandTotal,
    });
  } catch (error) {
    console.error("Error initiating retry payment:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to initiate retry payment." });
  }
};

// Show all orders
exports.showOrders = async (req, res) => {
  const query = req.query;
  const orderId = query.order;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    const orders = await Order.find({ userId: user.id }).sort({
      createdAt: -1,
    });
    if (!orders) {
      return res
        .status(404)
        .json({ success: false, message: "Orders not found!" });
    }

    if (orderId) {
      const order = orders.find((order) => order._id.toString() === orderId);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found!" });
      }

      return res.render("user/orderDetails", { user, order });
    } else {
      res.render("user/order", { user, orders });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error!" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { action } = req.params;
  const { orderId, reason } = req.body;

  try {
    // Fetch order and check if it exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Get the user who placed the order
    const userId = order.userId;

    // Initialize notification details
    let notificationTitle = "";
    let notificationType = "";
    let message = "";

    // Handle actions: 'cancel' and 'return'
    switch (action) {
      case "cancel":
        order.orderStatus = "cancelled";
        order.cancellationReason = reason;
        notificationTitle = "Order Cancelled";
        notificationType = "Order Cancelled";
        message = `The order ${orderId} has been cancelled. Reason: ${reason}.`;

        // Loop through each item in the order to restock
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
          "Full refund for cancelled order"
        );
        break;

      case "return":
        order.orderStatus = "pending_approval";
        order.returnReason = reason;
        order.approvalStatus = "pending";
        notificationTitle = "Return Requested";
        notificationType = "Return Requested";
        const orderLink = `<a href="/admin/orders?orderId=${orderId}" target="_blank">View Order</a>`;
        message = `The order ${orderId} has been requested to return. Reason: ${reason}. ${orderLink}`;
        break;

      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid action" });
    }

    // Save updated order
    order.updatedAt = Date.now();
    await order.save();

    // Create notifications for both admin and user
    await createNotification({
      title: notificationTitle,
      message,
      refId: orderId,
      refType: "Order",
      type: notificationType,
      notificationFor: ["admin"],
    });

    await createNotification({
      title: notificationTitle,
      message,
      refId: orderId,
      refType: "Order",
      type: notificationType,
      notificationFor: ["user"],
      userId: userId,
    });

    // Return response based on the action
    const successMessage =
      action === "cancel"
        ? "Order cancelled successfully, and a full refund has been issued."
        : "Return request sent for approval.";

    return res.json({ success: true, message: successMessage });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

exports.downloadInvoice = async (req, res) => {
  const orderId = req.query.orderId;
  try {
    const order = await Order.findById({ _id: orderId });

    if (order) {
      generateInvoice(order, res);
    } else {
      res.status(400).json({ success: false, message: "Order not found" });
    }
    console.log(order);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

// Show coupons
exports.showCoupons = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    const currentDate = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
      usedBy: { $nin: user.id },
    }).sort({ createdAt: -1 });

    res.render("user/coupon", { user, coupons });
  } catch (error) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Show wishlist
exports.showWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    // Find the user's wishlist and populate products
    const wishlist = await Wishlist.findOne({ userId: user._id })
      .populate("products.productId")
      .sort({ createdAt: -1 });

    if (!wishlist) {
      return res
        .status(404)
        .json({ success: false, message: "Wishlist not found!" });
    }

    // Fetch active offers that are currently valid
    const currentDate = new Date();
    const offers = await Offer.find({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    // Calculate discounted prices for each product in the wishlist
    wishlist.products.forEach((item) => {
      const product = item.productId;
      if (product) {
        product.discountedPrice = applyHighestDiscount(product, offers);
      }
    });

    res.render("user/wishlist", { user, wishlist });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.manageWishlist = async (req, res) => {
  const { productId } = req.body;
  const { action } = req.params;
  const userId = req.user.id;

  try {
    let wishlist = await Wishlist.findOne({ userId });

    // Create wishlist if it doesn't exist
    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    if (action === "add") {
      // Check if the product is already in the wishlist
      if (
        !wishlist.products.some(
          (product) => product.productId.toString() === productId
        )
      ) {
        wishlist.products.push({ productId });
      }
    } else if (action === "remove") {
      // Remove product from wishlist
      wishlist.products = wishlist.products.filter(
        (product) => product.productId.toString() !== productId
      );
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    // Save the updated wishlist
    await wishlist.save();

    return res.json({
      success: true,
      message: `Product ${action}ed to wishlist`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to ${action} product in wishlist`,
    });
  }
};

// Show coupons
exports.showWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    const wallet = await Wallet.aggregate([
      { $match: { userId: user._id } }, // Match the wallet for the specified user
      {
        $project: {
          userId: 1,
          balance: 1,
          transactions: {
            $sortArray: { input: "$transactions", sortBy: { createdAt: -1 } },
          }, // Sort transactions by createdAt
        },
      },
    ]);
    console.log(wallet[0].transactions[0]);

    res.render("user/wallet", { user, wallet: wallet[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
