const mongoose = require("mongoose");

const getDb = async () => {
  if (mongoose.connection.readyState >= 1) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not defined in environment variables");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB Atlas");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

module.exports = { getDb };
