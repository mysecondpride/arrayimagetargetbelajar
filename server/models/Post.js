const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Post = new Schema({
  id: {
    type: mongoose.Types.ObjectId,
  },
  title: {
    type: String,
    // required: true,
  },
  body: {
    type: String,
    // required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // sets the current date/time when the post is created
  },
  file: {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    filename: String,
    contentType: String,
  },
});

module.exports = mongoose.model("Post", Post);
