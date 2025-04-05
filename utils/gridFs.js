const { GridFsStorage } = require("multer-gridfs-storage");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const mongoose = require("mongoose");
// const mongoDB_URI = process.env.mongodb;
const dbURI = "mongodb://localhost:27017/blogBnB";

mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

const conn = mongoose.connection; // Use existing connection

let storage;
let gfs;
conn.once("open", () => {
  console.log("GridFS Storage Ready");

  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads",
  });

  storage = new GridFsStorage({
    db: conn.db, // Use the existing DB connection-- saya modif ke db uri
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename =
            buf.toString("hex") + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: "uploads",
          };
          resolve(fileInfo);
        });
      });
    },
  });
});

const upload = multer({ storage });

module.exports = { upload, gfs };
