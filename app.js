//use .env in our application
require("dotenv").config(); // untuk mengawali suatu setting dengan ENV dan express

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const crypto = require("crypto");

//Layouting
const expressLayout = require("express-ejs-layouts");
//cookie parser--agar tidak dosol dalam nginput username dan password. Ia juga berpasangan dengan session
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const methodOverride = require("method-override");

//connect to mongoDB
const { connectDB } = require("./server/config/db");
const app = express();
const PORT = 5000;

//pemanggilan connection of mongoDB
connectDB();

// bagaimana kita bisa mendapatkan data search tapi dengan aturan middleware?? berikut ini caranya
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride("_method"));

app.use(bodyParser.json());

//session, session ini mengandung logic, ini adalah basic
app.use(
  session({
    secret: "keybord cat",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
  })
);

//templete engine

//penggunaan app.use yang memerlukan suatu middleware-- kalimat ini terinspirasi dari bugging
//layouting
app.use(expressLayout);
app.set("layout", "./layouts/main");
app.set("view engine", "ejs");

//publikasi
app.use(express.static("public")); //express.static()--is not middleware itself

//request dan respond di pisahkan dalam suatu route
app.use("/", require("./server/routes/main"));
app.use("/", require("./server/routes/admin"));

app.listen(PORT, () => {
  console.log(`success to connect to the ${PORT}`);
});
