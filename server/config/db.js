const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const dbURI = "mongodb://localhost:27017/blogBnB";

let gfs; // Declare gfs at the top

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    // const conn = await mongoose.connect(process.env.MONGODB_URI);
    const conn = await mongoose.connect(dbURI);
    console.log(`database_connected: ${conn.connection.host}`);

    // Assign to the global gfs
    // gfs = Grid(conn.connection.db, mongoose.mongo);
    // gfs.collection("uploads");

    // return { db: conn.connection.db, gfs };
  } catch (error) {
    console.error("Database connection error:", error);
  }
};

const getGFS = () => {
  if (!gfs) {
    throw new Error(
      "gfs is not initialized. Make sure connectDB() is called first."
    );
  }
  return gfs;
};

module.exports = { connectDB, getGFS };
