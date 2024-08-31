const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const variantSchema = new Schema({
  color: { type: String, required: true },
  sizes: [
    {
      size: { type: String, required: true },  // E.g., S, M, L, XL, XXL
      stock: { type: Number, required: true }, // Stock corresponding to the size
    },
  ],
  images: [
    {
      url: { type: String, required: true },
    },
  ],
  isActive: { type: Boolean, default: true },
});


module.exports = mongoose.model('Variant', variantSchema);
