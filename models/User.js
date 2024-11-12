const mongoose = require('mongoose');

// Define the Address schema
const addressSchema = new mongoose.Schema({
  fName: {type: String, required: true},
  lName: {type: String, required: true},
  contactNo: {type: Number, required: true},
  postcode: {type: Number, required: true},
  state: {type: String, required: true},
  city: {type: String, required: true},
  houseName: {type: String, required: true},
  area: {type: String, required: true},
  landmark: {type: String},
  isDefault: {type: Boolean, default: false},
  type: {type: String, required: true}
});

// Define the User schema
const userSchema = new mongoose.Schema({
  googleId: { type: String, default: null },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  profilePicture: { type: String },
  phone: { type: String },
  addresses: [addressSchema],
  role: { type: String, default: 'user' },
  status: { type: String, enum: ['Active', 'Blocked'], default: 'Active' }
}, {
  timestamps: true
});

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
