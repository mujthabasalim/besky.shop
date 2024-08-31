const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, default: null },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, },
  role: { type: String, default: 'user' },
  status: { type: String, enum: ['Active', 'Blocked'], default: 'Active' }
},
  {
    timestamps: true

  });

const User = mongoose.model('User', userSchema);
module.exports = User;