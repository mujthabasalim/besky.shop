const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://mujthabasalim98:T5swPLeJij1P0I06@besky.soyyq.mongodb.net/');
    console.log('MongoDB connected');
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
};

module.exports = connectDB;
