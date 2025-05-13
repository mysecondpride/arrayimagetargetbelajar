const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// const fileSchema = new Schema({
//   filename: { type: String, required: true },
//   fileType: { type: String }, // e.g., image/png, application/pdf
//   url: { type: String }, // e.g., local path or cloud URL
//   uploadedAt: { type: Date, default: Date.now },
// });

// Define the post schema
const Post = new Schema({
  title: { type: String },
  body: { type: String },
  createdAt: { type: Date, default: Date.now },
  files: [
    {
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      filename: { type: String },
      fileType: { type: String },
      url: { type: String }, // e.g., local path or cloud URL
      uploadedAt: { type: Date, default: Date.now },
    },
  ], // Embedding the file schema here
});
module.exports = mongoose.model("Post", Post);
