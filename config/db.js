const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/beSkyDB');
    console.log('MongoDB connected');
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
};

module.exports = connectDB;
