const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

// Order Item Schema
const OrderItemSchema = new Schema({
  productId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  variantId: { 
    type: Schema.Types.ObjectId, 
    required: true 
  },
  name: { type: String, required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  originalPrice: { type: Number, required: true, min: 0 },
  discountedPrice: { type: Number, min: 0 },
  total: { type: Number, required: true, min: 0 },
});

// Shipping Address Schema
const addressSchema = new Schema({
  fName: { type: String, required: true },
  lName: { type: String, required: true },
  contactNo: { type: Number, required: true },
  postcode: { type: Number, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  houseName: { type: String, required: true },
  area: { type: String, required: true },
  landmark: { type: String },
  isDefault: { type: Boolean, default: false },
  type: { type: String, required: true }
});

// Main Order Schema
const OrderSchema = new Schema({
  orderId: {
    type: String,
    unique: true,
    required: true,
    default: () => uuidv4(),
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [OrderItemSchema],
  shippingAddress: addressSchema,
  paymentMethod: { 
    type: String, 
    enum: ['razorpay', 'cod', 'wallet'], 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'awaiting_payment'], 
    default: 'pending' 
  },
  discountCode: { type: String, default: null },
  couponDiscount: { type: Number, default: 0 },
  couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null },
  discountType: { type: String, enum: ['Percentage', 'Flat'], default: null },
  maxDiscount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  orderStatus: { 
    type: String, 
    enum: ['pending', 'shipped', 'delivered', 'cancelled', 'returned', 'pending_approval'], 
    default: 'pending' 
  },
  approvalStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  cancellationReason: { type: String },
  returnReason: { type: String },
  adminResponse: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

OrderSchema.index({ createdAt: 1 });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ couponId: 1 });

OrderSchema.pre('save', async function (next) {
  if (!this.customOrderId) {
    this.customOrderId = uuidv4();
  }
  next();
});

// Create Order model
const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
