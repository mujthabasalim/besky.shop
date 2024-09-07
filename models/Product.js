const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  description: { type: String, required: true },
  parentCategory: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategory: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalPrice: {type: Number},
  attributes: [String],
  variants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Variant' }],
  isActive: { type: Boolean, default: true },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexing for performance
ProductSchema.index({ name: 1, variants: 1 }, { unique: true });
ProductSchema.index({ name: 1, parentCategory: 1, subCategory: 1 }, { unique: true });

// Virtual field to populate reviews
ProductSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false
});

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;

