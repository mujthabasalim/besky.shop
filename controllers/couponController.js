const Coupon = require("../models/Coupon");
const getPaginationData = require("../utils/pagination");


exports.getAllCoupons = async (req, res) => {
  try {
  const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const sort = req.query.sort || '-createdAt';
    const search = req.query.search || '';

    // Prepare filters from the request
    const filters = {
      status: req.query.statusFilter || ''
      // Add other filters as needed
    };

    const query = {};

    // Apply filters to the query
    if (filters.status) {
      query.status = filters.status;
    }

    if (search) {
      query.$or = [
        { type: { $regex: search, $options: 'i' } },
      ];
    }

    const { data: coupons, pagination } = await getPaginationData(
      Coupon,
      page,
      limit,
      query,
      '/admin/coupons',
      [],
      sort
    );

    if (req.xhr) {
      return res.render('admin/couponManagement', { coupons, pagination, sort, search, filters, layout: false });
    }

    return res.render('admin/couponManagement', { coupons, pagination, sort, search, filters });
  } catch (error) {
    req.flash('error', error.message);
    return res.redirect('/admin/coupons');
  }
};

// Create or Update an coupon
exports.saveCoupon = async (req, res) => {
  const { couponCode,discountType, discountRate, minPurchase, maxDiscount, startDate, endDate, isActive } =
    req.body;
  const { id: couponId } = req.params;  

  const existingCoupon = await Coupon.findOne({ couponCode, startDate, endDate });

  // Convert endDate to a Date object and add 23 hours, 59 minutes, 59 seconds, and 999 milliseconds
  let expiryDate = new Date(endDate).setHours(23, 59, 59, 999);
  const couponData = {
    couponCode,
    discountType,
    discountRate,
    maxDiscount,
    minPurchase,
    startDate,
    endDate: expiryDate,
    isActive: isActive === "on",
  };

  try {
    if (couponId) {
      // Update coupon
      await Coupon.findByIdAndUpdate(couponId, couponData);
      req.flash("success", "Coupon updated successfully");
    } else {
      if (existingCoupon) {
        req.flash("error", "Coupon already exist");
        return res.redirect("/admin/coupons");
      }
      // Create new coupon
      const newCoupon = new Coupon(couponData);
      await newCoupon.save();
      req.flash("success", "Coupon created successfully");
    }

    res.redirect("/admin/coupons");
  } catch (error) {
    console.error("Error saving coupon:", error);
    req.flash("error", "Error saving coupon.");
    res.redirect("/admin/coupons");
  }
};

// Handle coupon deletion
exports.deleteCoupon = async (req, res) => {
  const couponId = req.params.couponId;

  try {
    await Coupon.findByIdAndDelete(couponId);
    req.flash("success", "Coupon deleted successfully");
    res.redirect("/admin/coupons");
  } catch (error) {
    console.error("Error deleting coupon:", error);
    req.flash("error", "Error deleting coupon.");
    res.redirect("/admin/coupons");
  }
};