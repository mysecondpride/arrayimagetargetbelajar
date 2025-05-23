const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostProducts = new Schema({
  Produk1: [
    {
      NamaProduk1: { type: String },
      Harga1: { type: Number },
      Stok1: { type: Number },
      Keterangan1: { type: String },
      fileImages: {
        fileId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        filename: { type: String },
        fileType: { type: String },
        url: { type: String }, // e.g., local path or cloud URL
        uploadedAt: { type: Date, default: Date.now },
      },
    },
  ],
  Produk2: [
    {
      NamaProduk2: { type: String },
      Harga2: { type: Number },
      Stok2: { type: Number },
      Keterangan2: { type: String },
      fileImages: {
        fileId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        filename: { type: String },
        fileType: { type: String },
        url: { type: String }, // e.g., local path or cloud URL
        uploadedAt: { type: Date, default: Date.now },
      },
    },
  ],
  Produk3: [
    {
      NamaProduk3: { type: String },
      Harga3: { type: Number },
      Stok3: { type: Number },
      Keterangan3: { type: String },
      fileImages: {
        fileId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        filename: { type: String },
        fileType: { type: String },
        url: { type: String }, // e.g., local path or cloud URL
        uploadedAt: { type: Date, default: Date.now },
      },
    },
  ],

  // files: [
  //   {
  //     fileId: {
  //       type: mongoose.Schema.Types.ObjectId,
  //     },
  //     filename: { type: String },
  //     fileType: { type: String },
  //     url: { type: String }, // e.g., local path or cloud URL
  //     uploadedAt: { type: Date, default: Date.now },
  //   },
  // ],
});

module.exports = mongoose.model("PostAllProducts", PostProducts);
