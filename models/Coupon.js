// Coupon.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const couponSchema = new Schema(
  {
    couponCode: { 
      type: String, 
      required: true,
    },
    discountType: { 
      type: String, 
      required: true, 
      enum: ['Percentage', 'Flat'], 
      default: 'Percentage' 
    },
    discountRate: { type: Number, required: true },
    maxDiscount: { type: Number, required: true },
    minPurchase: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
