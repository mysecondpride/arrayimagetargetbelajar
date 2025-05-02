//connect to database
require("dotenv").config();

//penghubung router
const express = require("express");
const router = express.Router();

// router penghubung ke package dan model
const mongoose = require("mongoose");

//perobaan layout di main
// const layOut = require(".");
//schema yang diperlukan:
//Schema post
const Post = require("../models/Post");

// const Grid = require("gridfs-stream");

const { GridFSBucket } = require("mongodb");

//how to connect to mongoDB with string
const conn = mongoose.createConnection(process.env.MONGODB_URI);

//Making a global variable
let gfs;

// Bagaimana ketika connect dengan database bisa langsung tertuju pada collection
conn.once("open", function () {
  const bucket = new GridFSBucket(conn.db, {
    bucketName: "upload", // <-- equivalent to gfs.collection('upload')
  });

  // Now you use bucket to upload/download files
});
router.get("/", async (req, res) => {
  const locals = {
    title: "Accounting Basis",
    description:
      "blog tentang akuntansi | perpajakan | aplikasi pembukuan UMKM ",
  };
  // router ini untuk melempar data yang sudah kita post
  let perPage = 10;
  let page = req.query.page || 1;
  const data = await Post.aggregate([{ $sort: { createdAt: -1 } }])
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec();

  const count = await Post.countDocuments();
  const nextPage = parseInt(page) + 1;
  const hasNextPage = nextPage <= Math.ceil(count / perPage);
  res.render("index", {
    locals,
    data,
    current: page,
    nextPage: hasNextPage ? nextPage : null,
  });
});
router.get("/about", (req, res) => {
  res.render("about");
});

router.get("/post/:id", async (req, res) => {
  const locals = {
    title: "Accounting Basis",
    description:
      "blog tentang akuntasi | laporan keuangan | aplikasi pembukuan untuk UMKM ",
  };
  const slug = req.params.id;
  const data = await Post.findById(slug);

  res.render("post", { locals, data });
});

//Post
//Post:searchTerm
router.post("/search", async (req, res) => {
  try {
    const locals = {
      title: "Search",
      description:
        "Blog yang mengulas semua hal tentang telepon dan teknologi kekinian",
    };
    const searchTerm = req.body.searchTerm;
    const noSpecialChar = searchTerm.replace(/[^a-zA-Z0-9]/g, "");
    const data = await Post.find({
      $or: [
        { title: { $regex: new RegExp(noSpecialChar, "i") } },
        { body: { $regex: new RegExp(noSpecialChar, "i") } },
      ],
    });

    res.render("search", {
      data,
      locals,
    });
  } catch (error) {
    console.log(error);
  }
});

// bagaimana cara mengecek mesin pencari bekerja atau tidak dari yang kita tuliskan, masuk ke browser
// router.post("/search", async (req, res) => {
//   try {
//     const locals = {
//       title: "Search",
//       description:
//         "Blog yang mengulas semua hal tentang telepon dan teknologi kekinian",
//     };
//     const searchTerm = req.body.searchTerm;
//     console.log(searchTerm);

//     res.send(searchTerm);
//   } catch (error) {
//     console.log(error);
//   }
// });

// jika tidak menginginkan pagination
// router.get("/", async (req, res) => {
//   const locals = {
//     title: "GadgetBase",
//     description: "ulasan | smartphone terbaru | pengalaman ",
//   };
//   // router ini untuk melempar data yang sudah kita post
//   try {
//     const data = await Post.find();
//     res.render("index", { locals, data });
//   } catch (error) {
//     console.log(error);
//   }
// });

// ini sekedar untuk menguji skema kita berjalan atau belum
// function insertData() {
//   post.insertMany([
//     { title: "berjuanglah", body: "ini adalah penyelamatan hidupmu" },
//     {
//       title: "bersyukurlah",
//       body: "masih ada harapan untukmu",
//     },
//   ]);
// }

// insertData();
module.exports = router;
