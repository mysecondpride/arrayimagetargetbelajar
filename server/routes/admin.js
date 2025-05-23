//connectdengan env
require("dotenv").config();

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
const uploads = require("../../utils/gridFs"); // Import GridFS upload
const { GridFsStorage } = require("multer-gridfs-storage");
const PostProducts = require("../models/PostProducts");

//how to connect by connection string
const conn = mongoose.createConnection(process.env.MONGODB_URI);

// let bucket;
let gfs;

conn.once("open", function () {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
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

router.post("/add-post", uploads.array("utama", 10), async (req, res) => {
  const { title, body } = req.body;

  try {
    if (!title || !body) {
      return res.status(400).json({
        message: "pesan saya isi dulu ya field title dan content",
      });
    }

    // Process uploaded files into fileSchema format
    const files = req.files?.map((file) => ({
      fileId: new mongoose.Types.ObjectId(file.id), // ← This is the GridFS _id
      filename: file.filename,
      fileType: file.mimetype,
      url: `/files/${file.filename}`, // or custom download route
      uploadedAt: new Date(),
    }));

    // Save new Post with file metadata
    const ost = new Post({
      title,
      body,
      files, // your schema expects an array of file objects
    });

    console.log(files);

    await ost.save();

    res.status(201).json({ message: "Blog created!", ost });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Something went wrong while creating the blog post.",
    });
  }
});

router.get("/image/:id", (req, res) => {
  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads",
    });
    const { id } = req.params;
    const fileId = new mongoose.Types.ObjectId(id);
    const stream = bucket.openDownloadStream(fileId);

    stream.on("file", (file) => {
      // Set correct content type
      res.set("Content-Type", file.contentType || "image/jpg");
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
  uploads.single("utama"),
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
          bucketName: "uploads", // use your bucket name
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

router.get("/display-products", authMiddleware, async (req, res) => {
  try {
    const data = await PostProducts.find({});
    console.log(data, "ini data produk");

    res.render("admin/display-products", { layout: layoutAdmin, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Something went wrong while you are getting the products.",
    });
  }
});

//segala sesuatu tentang produk
router.get("/post-display-products", authMiddleware, async (req, res) => {
  try {
    const data = await Post.find({});

    res.render("admin/post-display-products", { data, layout: layoutAdmin });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Something went wrong while creating the blog post.",
    });
  }
});

router.post(
  "/post-display-products",
  authMiddleware,
  uploads.single("image1"),
  async (req, res) => {
    try {
      const {
        NamaProduk1,
        Harga1,
        Stok1,
        Keterangan1,
        NamaProduk2,
        Harga2,
        Stok2,
        Keterangan2,
        NamaProduk3,
        Harga3,
        Stok3,
        Keterangan3,
      } = req.body;

      const brankas = [
        NamaProduk1,
        Harga1,
        Stok1,
        Keterangan1,
        NamaProduk2,
        Harga2,
        Stok2,
        Keterangan2,
        NamaProduk3,
        Harga3,
        Stok3,
        Keterangan3,
      ];

      if (!brankas) {
        return res.status(400).json({
          message: "Semua field product diisi dulu ya",
        });
      }

      const fileSingle = {
        fileId: file.id,
        filename: file.filename,
        url: `/files/${file.filename}`,
        fileType: file.mimetype,
        uploadedAt: new Date(),
      };

      console.log("FILES RECEIVED:", req.file);
      const ost = new PostProducts({
        Produk1: [
          {
            NamaProduk1,
            Harga1,
            Stok1,
            Keterangan1,
            fileImages: fileSingle.image1,
          },
        ],
        Produk2: [
          {
            NamaProduk2,
            Harga2,
            Stok2,
            Keterangan2,
            // fileImages: fileSingle.Produk2Files,
          },
        ],
        Produk3: [
          {
            NamaProduk3,
            Harga3,
            Stok3,
            Keterangan3,
            // fileImages: fileSingle.Produk3Files,
          },
        ],
      });
      await ost.save();
      res.status(201).json({ message: "PostProducts created!", ost });

      // res.redirect("admin/display-products");
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "Something went wrong while creating the blog post.",
      });
    }
  }
);

//images untuk produk pada post-display-product

// router.get(
//   "/imagesofproducts/:postId/:itemId",
//   authMiddleware,
//   async (req, res) => {
//     const { postId, itemId } = req.params;

//     // disini harus ada pull nya..
//     try {
//       const updatedPost = await PostProducts.findByIdAndUpdate(
//         postId,
//         { $pull: { files: { _id: itemId } } },
//         { new: true }
//       );

//       if (!updatedPost) {
//         return res.status(404).json({ message: "Post not found" });
//       }

//       // Convert string to MongoDB ObjectId
//       const fileId = new mongoose.Types.ObjectId(itemId);
//       const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
//         bucketName: "uploads", // important: must match the bucket used when uploading
//       });

//       const stream = bucket.openDownloadStream(fileId);

//       stream.on("file", (file) => {
//         res.set("Content-Type", file.contentType || "application/octet-stream");
//       });

//       stream.on("error", (err) => {
//         console.error("Download stream error:", err.message);
//         if (!res.headersSent) {
//           res.status(404).json({ message: "File not found" });
//         }
//       });

//       stream.pipe(res);
//     } catch (err) {
//       return res.status(400).json({ message: "Invalid file ID" });
//     }
//   }
// );

router.get(
  "/imagesofproducts/:postId/:itemId",
  authMiddleware,
  async (req, res) => {
    const { postId, itemId } = req.params;

    try {
      // First, verify the file belongs to the post
      const post = await PostProducts.findOne({
        _id: postId,
        "files._id": itemId,
      });

      if (!post) {
        return res.status(404).json({ message: "Post or file not found" });
      }

      const fileId = new mongoose.Types.ObjectId(itemId);
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: "uploads", // same bucket name used when uploading
      });

      const stream = bucket.openDownloadStream(fileId);

      stream.on("file", (file) => {
        res.set("Content-Type", file.contentType || "application/octet-stream");
      });

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(404).json({ message: "File not found in GridFS" });
        }
      });

      stream.pipe(res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.delete("/delete-item1/:postId/:itemId", async (req, res) => {
  const { postId, itemId } = req.params;

  try {
    const updatedPost = await PostProducts.findByIdAndUpdate(
      postId,
      { $pull: { Produk1: { _id: itemId } } },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.redirect("/display-products");
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Error deleting nested item" });
  }
});
router.delete("/delete-item2/:postId/:itemId", async (req, res) => {
  const { postId, itemId } = req.params;

  try {
    const updatedPost = await PostProducts.findByIdAndUpdate(
      postId,
      { $pull: { Produk2: { _id: itemId } } },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.redirect("/display-products");
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Error deleting nested item" });
  }
});

router.delete("/delete-item3/:postId/:itemId", async (req, res) => {
  const { postId, itemId } = req.params;

  try {
    const updatedPost = await PostProducts.findByIdAndUpdate(
      postId,
      { $pull: { Produk3: { _id: itemId } } },
      { new: true }
    );
    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.redirect("/display-products");
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Error deleting nested item" });
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
