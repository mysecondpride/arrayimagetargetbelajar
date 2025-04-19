const express = require("express");
const fs = require("fs");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");
const layoutAdmin = "../views/layouts/admin";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const upload = require("../../utils/gridFs"); // Import GridFS upload
const jwtSecret = process.env.JWT_SECRET;
var mongoose = require("mongoose");
const { log } = require("console");
const conn = mongoose.createConnection("mongodb://127.0.0.1:27017/blogBnB");
const { ObjectId } = require("mongodb");
let gfs;

conn.once("open", function () {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("upload");
});
/* GET */
/* admin-loginpage */

router.get("/admin", async (req, res) => {
  try {
    const locals = {
      title: "admin",
      description: "ini adalah page dari admin",
    };
    res.render("admin/index", { locals, layout: layoutAdmin });
  } catch (error) {
    console.log("error", error);
  }
});

/* POST */
/* Check-Login */

// router.post("/admin", async (req, res) => {
//   try {
//     if (req.body.username === "admin" && req.body.password === "password") {
//       res.send("you are logg in");
//     } else {
//       res.send("your username and password doesnt match");
//     }
//   } catch (error) {
//     console.log("error", error);
//   }
// });
router.post("/admin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "invalid credentials" });
    }
    const isPassword = await bcrypt.compare(password, user.password);
    if (!isPassword) {
      return res.status(401).json({ message: "invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/dashboard");
  } catch (error) {
    console.log("error");
  }
});

//function that helping me out after soon we erase the cookies
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }
  //jika berhasil lakukan verifikasi token//tentunya pakai try krn ini database
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "unauthorized" });
  }
};

/* POST */
/* Check-Register */

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await User.create({ username, password: hashedPassword });
      res.status(201).json({ message: "user created" });
    } catch (error) {
      if (error.code === 11000) {
        //jika tidak unik
        res.status(409).json({ message: "User already in use" }); //email atau password konflik
      }
      res.status(500).json({ message: "internal server error" });
    }
  } catch (error) {
    console.log("error", error);
  }
});

//dashboard
router.get("/dashboard", authMiddleware, async (req, res) => {
  //fungsi authMiddleware melindungi ketika sesion habis, token tidak permanen
  try {
    const data = await Post.find({});
    console.log(data);

    res.render("admin/dashboard", { data });
  } catch (error) {
    console.log("error", error);
  }
});

/* GET */
/* admin-addpost */

router.get("/add-post", authMiddleware, async (req, res) => {
  try {
    res.render("admin/add-post", { layout: layoutAdmin });
  } catch (error) {
    console.log("error", error);
  }
});

router.get("/post-article/:id", authMiddleware, async (req, res) => {
  try {
    const articleId = req.params.id;
    const data = await Post.findById(articleId)
      .populate({ path: "imageFileId", strictPopulate: false })
      .exec((err, post) => {
        if (err) {
          console.log(err);
          res.redirect("/post");
        } else {
          res.status(200).json({ message: data });
        }
      });

    // res.render("admin/post-article", { layout: layoutAdmin, data });
  } catch (error) {
    console.log("error", error);
  }
});

//admin
router.get("/image/:id", (req, res) => {
  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "upload",
    });

    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const stream = bucket.openDownloadStream(fileId);

    stream.on("file", (file) => {
      // Set correct content type
      res.set("Content-Type", file.contentType || "image/jpeg");
    });

    stream.on("error", (err) => {
      console.error("Stream error:", err.message);
      res.status(404).json({ message: "File not found" });
    });

    stream.pipe(res);
  } catch (err) {
    console.error("Route error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/add-post", upload.single("utama"), async (req, res) => {
  console.log("Uploaded file:", req.file); // Add this line

  const { title, body } = req.body;
  try {
    if (!title || !body || req.file) {
      // return res
      //   .status(400)
      //   .json({ error: "image, title, body are required." });
      console.log("ojo lali ngisi file yo");
    }

    const ost = new Post({
      title,
      body,
      imageFileId: req.file._id, //ketika diganti file ini bson yang salah
    });
    await ost.save();
    res.json({ message: "Blog created!", ost: ost });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Something went wrong while creating the blog post." });
  }
});

router.get("/files", async (req, res) => {
  try {
    let files = await gfs.files.find().toArray();
    res.json({ files });
  } catch (err) {
    res.json({ err });
  }
});

/* get to Edit */
/* admin-edit-post */

// router.get("/edit-post/:id", authMiddleware, async (req, res) => {
//   try {
//     const data = await Post.findOne({ _id: req.params.id });

//     res.render("admin/edit-post", { layout: layoutAdmin, data });
//   } catch (error) {
//     res.status(500).send("Error updating post");
//   }
// });

// router.get("/edit-post/:id", authMiddleware, async (req, res) => {
//   try {
//     const data = await Post.findOne({ _id: req.params.id });

//     res.render("admin/edit-post", { layout: layoutAdmin, data });
//   } catch (error) {
//     res.status(500).send("Error updating post");
//   }
// });

router.get("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "edit-post",
      description: "edit post of article",
    };
    const data = await Post.findOne({ _id: req.params.id });

    // if (!data) return res.status(404).send("updated article is not found");

    res.render("admin/edit-post", { locals, data, layout: layoutAdmin });
  } catch (error) {
    res.status(500).send("Error updating post");
  }
});

//ini masih belum fix ya......

router.put("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      body: req.body.body,
      // updateddAt: Date.now(),
    });

    // if (!data) return res.status(404).send("updated article is not found");

    res.redirect(`/edit-post/${req.params.id}`);
  } catch (error) {
    res.status(500).send("Error updating post");
  }
});

module.exports = router;
