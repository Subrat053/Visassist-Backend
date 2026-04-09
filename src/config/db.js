const mongoose = require("mongoose");

const connectDB = async () => {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error("MONGODB_URI is required");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongodbUri);
  console.log("MongoDB connected");
};

module.exports = connectDB;
