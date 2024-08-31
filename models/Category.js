const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  }
},
  {
    timestamps: true

  });

// Create the compound index on name and parentCategory
CategorySchema.index({ name: 1, parentCategory: 1 }, { unique: true });

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;
