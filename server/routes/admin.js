//connectdengan env
require("dotenv").config();
const archiver = require("archiver");

//router penghubung ke database
const express = require("express");
const router = express.Router();
// router penghubung ke package dan model
var mongoose = require("mongoose");

//schema yang diperlukan:
//Schema post
const Post = require("../models/Post");
//Schema login
const User = require("../models/User");

//Layout yang dilempar ke target
const layoutAdmin = "../views/layouts/admin";

//Hashing the password
const bcrypt = require("bcrypt");

// mencocokkan token (ijin autorisasi atau API ) antara client dan server
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

//melakukan stream (lalulintas) file (streaming)
const Grid = require("gridfs-stream");

// melakukan edit, yang di HTML tersedia POST
const methodOverride = require("method-override");

router.use(methodOverride("_method"));
const upload = require("../../utils/gridFs"); // Import GridFS upload
const { GridFsStorage } = require("multer-gridfs-storage");

//how to connect by connection string
const conn = mongoose.createConnection(process.env.MONGODB_URI);

let bucket;
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
    res.render("admin/index", { locals });
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
  // console.log(Object.keys(req)) kalau ingin mengetahui method yang ada di req
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

    res.render("admin/dashboard", { data, layout: layoutAdmin });
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
    const data = await Post.findById(articleId);
    if (!data) {
      res.status(404).json({ message: "data was not foound" });
    }

    res.render("admin/post-article", { layout: layoutAdmin, data });
  } catch (error) {
    console.log("error", error);
  }
});

//admin
// router.get("/image/:id", (req, res) => {
//   try {
//     const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
//       bucketName: "upload",
//     });

//     const fileids = Array.isArray(req.query._id)
//       ? req.query._id
//       : [req.query._id];

//     const ids = fileids.forEach((id) => {
//       const fileId = new mongoose.Types.ObjectId(id);
//       // create stream, pipe it, or accumulate, etc.
//     });
//     const stream = bucket.openDownloadStream(ids);
//     stream.on("file", (file) => {
//       // Set correct content type
//       res.set("Content-Type", file.contentType || "image/jpeg");
//     });

//     stream.on("error", (err) => {
//       console.error("Stream error:", err.message);
//       res.status(404).json({ message: "File not found" });
//     });

//     stream.pipe(res);
//   } catch (err) {
//     console.error("Route error:", err.message);
//     res.status(500).json({ message: "Server error" });
//   }
// });

router.post("/add-post", upload.array("utama", 3), async (req, res) => {
  const { title, body } = req.body;
  try {
    if (!title || !body) {
      res
        .status(400)
        .json({ message: "pesan saya isi dulu ya field title dan content" });
    }

    const files = req.files.map((file) => ({
      filename: file.filename,
      fileType: file.mimetype,
      url: `/uploads/${file.filename}`, // or wherever your files are served from
    }));
    const ost = new Post({
      title,
      body,
      files,
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

router.get("/image/:id", async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    // ✅ First, define the collection
    const filesCollection = mongoose.connection.db.collection("upload.files");

    // ✅ Then, initialize the GridFS bucket
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "upload",
    });

    // ✅ Now use the collection to find the file metadata
    const file = await filesCollection.findOne({ _id: fileId });

    if (!file || !file.contentType.startsWith("image/")) {
      return res.status(404).send("Not an image");
    }

    // ✅ Set content type and stream the image
    res.set("Content-Type", file.contentType);
    const readStream = bucket.openDownloadStream(file._id);
    readStream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving image");
  }
});

// router.get("/image/:id", (req, res) => {
//   try {
//     const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
//       bucketName: "upload",
//     });

//     const fileId = new mongoose.Types.ObjectId(req.params.id);
//     const stream = bucket.openDownloadStream(fileId);

//     stream.on("file", (file) => {
//       // Set correct content type
//       res.set("Content-Type", file.contentType || "image/jpeg");
//     });

//     stream.on("error", (err) => {
//       console.error("Stream error:", err.message);
//       res.status(404).json({ message: "File not found" });
//     });

//     stream.pipe(res);
//   } catch (err) {
//     console.error("Route error:", err.message);
//     res.status(500).json({ message: "Server error" });
//   }
// });
// router.get("/image/zip", async (req, res) => {
//   const ids = Array.isArray(req.query._id) ? req.query._id : [req.query._id];
//   const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
//     bucketName: "upload",
//   });

//   res.setHeader("Content-Type", "application/zip");
//   res.setHeader("Content-Disposition", "attachment; filename=files.zip");

//   const archive = archiver("zip");
//   archive.pipe(res);

//   for (const id of ids) {
//     const objectId = new mongoose.Types.ObjectId(id);
//     const stream = bucket.openDownloadStream(objectId);
//     archive.append(stream, { name: `${id}.jpg` }); // You could fetch filename from DB if needed
//   }

//   archive.finalize();
// });

// router.get("/files", async (req, res) => {
//   try {
//     let files = await gfs.files.find().toArray();
//     res.json({ files });
//   } catch (err) {
//     res.json({ err });
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
router.put(
  "/edit-post/:id",
  upload.single("utama"),
  authMiddleware,
  async (req, res) => {
    const { title, body } = req.body;

    try {
      // 1. Find the post by ID
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).send("Post not found");

      // 2. Delete the old image from GridFS (if a new image is uploaded)
      if (req.file && post.filename) {
        const db = mongoose.connection.db;
        const bucket = new mongoose.mongo.GridFSBucket(db, {
          bucketName: "upload", // use your bucket name
        });

        await bucket.delete(post.filename); // remove old image by ID
      }

      // 3. Update the fields
      post.title = title;
      post.body = body;

      // 4. Update the image if new file is uploaded
      if (req.file && req.file.id) {
        post.filename = req.file.filename;
      }

      // 5. Save updated post
      await post.save();

      res.redirect("/dashboard");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating post");
    }
  }
);

router.delete("/delete-post/:id", async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// how to log out from the web app
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send("Logout failed");
    }
    res.redirect("/admin"); // or wherever you want
  });
});
module.exports = router;
