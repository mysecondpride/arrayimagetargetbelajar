// config/storage.js
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const crypto = require("crypto");
const path = require("path");
const mongoose = require("mongoose");

const storage = new GridFsStorage({
  url: "mongodb://localhost:27017/blogBnB", // your MongoDB URI
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err);
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename,
          bucketName: "uploads", // this creates the collection uploads.files
        };
        resolve(fileInfo);
      });
    });
  },
});

const upload = multer({ storage });

module.exports = upload;
