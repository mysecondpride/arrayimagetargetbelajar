const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Post = require("../models/Post");
const Grid = require("gridfs-stream");
// const Gf = require("../../utils/gridStream");
const { GridFSBucket } = require("mongodb");
const conn = mongoose.createConnection("mongodb://127.0.0.1:27017/blogBnB");
let gfs;

conn.once("open", function () {
  gfs = Grid(conn.db, mongoose.mongo);
});

router.get("/", async (req, res) => {
  const locals = {
    title: "GadgetBase",
    description:
      "blog tentang smartphone yang membahas tentang ulasan | smartphone terbaru | pengalaman ",
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
    title: "GadgetBase",
    description: "ulasan | smartphone terbaru | pengalaman ",
  };
  const slug = req.params.id;
  const data = await Post.findById(slug);

  res.render("post", { locals, data });
});

// router.get("/files", (req, res) => {
//   gfs.findOne(
//     { filename: "5575638e1fb9c23f0df83e7c5d1931b6.jpg" },
//     (err, files) => {
//       if (!files || files.length === 0) {
//         return res.status(404).json({ err: "no file exist" });
//       }
//       return res.json(files);
//     }
//   );
// });

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
