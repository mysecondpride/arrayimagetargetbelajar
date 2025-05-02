// db.js
const mongoose = require("mongoose");
// require("dotenv").config();

// const connectDB = async () => {
//   try {
//     mongoose.set("strictQuery", false);
//     const conn = await mongoose.connect(process.env.MONGODB_URI);
//     console.log(`Database connected: ${connection.host}`);
//   } catch (error) {
//     console.log(error);
//   }
// };

// server/config/db.js (example)

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
module.exports = connectDB;
