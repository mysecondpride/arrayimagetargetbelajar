const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const fileSchema = new Schema({
  filename: { type: String, required: true },
  fileType: { type: String }, // e.g., image/png, application/pdf
  url: { type: String }, // link to file if stored on cloud/local path
  uploadedAt: { type: Date, default: Date.now },
});

const postSchema = new Schema({
  title: { type: String },
  body: { type: String },
  createdAt: { type: Date, default: Date.now },
  files: [fileSchema], // renamed from "file" to "files"
});

module.exports = mongoose.model("Post", postSchema);
