const mongoose = require("mongoose");
const User = require("../models/User");

const connectDB = async () => {
  try {
    const uri =
      process.env.MONGO_URI ||
      "mongodb://127.0.0.1:27017/smart_parking";

    const conn = await mongoose.connect(uri, {
      dbName: process.env.MONGO_DB_NAME || "smart_parking",
    });

    const indexes = await User.collection.indexes();
    const rfidIndex = indexes.find((index) => index.name === "rfidCardId_1");
    if (rfidIndex && !rfidIndex.partialFilterExpression) {
      await User.collection.dropIndex("rfidCardId_1");
    }
    await User.collection.createIndex(
      { rfidCardId: 1 },
      { unique: true, name: "rfidCardId_1", partialFilterExpression: { rfidCardId: { $type: "string" } } }
    );

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;