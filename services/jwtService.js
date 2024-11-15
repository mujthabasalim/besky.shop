require('dotenv').config();
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, profilePicture: user.profilePicture },
    process.env.JWT_SECRET_KEY,
    { expiresIn: '1w' }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET_KEY);
};

module.exports = { generateToken, verifyToken };
