const express = require("express");

const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");
const layoutAdmin = "../views/layouts/admin";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const grid=require('gridfs-stream')
const methodOverride = require("method-override");
const { upload } = require("../../utils/gridFs"); // Import GridFS upload
const { conn } = require("../../utils/gridFs");
const jwtSecret = process.env.JWT_SECRET;
const { getGFS } = require("../config/db");
let gfs;

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
    const data = await Post.find();
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
router.post("/add-post", authMiddleware, async (req, res) => {
  //fungsi authMiddleware melindungi ketika sesion habis, token tidak permanen

  try {
    const { body, title } = req.body;
    const newPost = new Post({ body, title });
    const data = await newPost.save();
    res.render("admin/dashboard", { data });
  } catch (error) {
    console.log("error", error);
  }
});

router.post("/upload", upload.single("file"), (req, res) => {
  res.json({ file: req.file });
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

//mencoba to change to array-- sayang sekali gfsnya tidak ada disini, tapi sudah dibetulin
router.get("/files", async (req, res) => {
  try {
    gfs = getGFS(); // Get GridFS instance
    const files = await gfs.collection("uploads").find().toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ err: "No files exist" });
    }

    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// get filename of the file image just findOne

router.get("/files/:filename", async (req, res) => {
  try {
    const gfs = getGFS(); // Get GridFS instance
    const files = await gfs
      .collection("uploads")
      .findOne({ filename: req.params.filename }, (err, file) => {
        if (!file || file.length === 0) {
          return res.status(404).json({
            err: " no file exist",
          });
        }
        return res.json;
      });

    if (!files || files.length === 0) {
      return res.status(404).json({ err: "No files exist" });
    }

    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

//Display an image with createReadStream
const { GridFSBucket } = require("mongodb");

router.get("/image/:filename", async (req, res) => {
  try {
    const gfs = getGFS(); // Get GridFS instance

    // Find file metadata
    const file = await gfs
      .collection("uploads")
      .findOne({ filename: req.params.filename });

    if (!file) {
      return res.status(404).json({ err: "No file exists" });
    }

    // Check if it's an image
    if (!file.contentType.startsWith("image/")) {
      return res.status(400).json({ err: "Not an image file" });
    }

    // Use GridFSBucket for streaming
    const bucket = new GridFSBucket(gfs.db, { bucketName: "uploads" });
    const readstream = bucket.openDownloadStreamByName(file.filename);
    readstream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Server error" });
  }
});

module.exports = router;
