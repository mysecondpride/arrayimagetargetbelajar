// upload.js
require("dotenv").config();
const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
// const db = require("../server/config/db");
const mongoose = require("mongoose");

const conn = mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//langkah menggunakan gridstream adalah langkah ke-2

// conn.on("connected", () => console.log("connected"));
// conn.on("open", () => console.log("open"));
// conn.once("open", () => {
//   "mongo connection was established";
// });
// Use mongoose.connection for GridFsStorage
const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err);

        const filename = buf.toString("hex") + path.extname(file.originalname);
        resolve({
          filename: filename,
          bucketName: "upload", // optional; defaults to 'fs'
        });
      });
    });
  },
});

const upload = multer({ storage });

module.exports = upload;
