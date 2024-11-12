const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const offerSchema = new Schema(
  {
    offerType: { 
      type: String, 
      required: true, 
      enum: ['Category', 'Product'] 
    }, 
    typeId: { 
      type: Schema.Types.ObjectId, 
      required: true, 
      refPath: 'offerType'
    },
    discountType: { type: String, required: true, enum: ['Percentage', 'Flat'], default: 'Percentage' },
    discountRate: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
