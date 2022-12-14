// @EXTERNALS
const express = require("express");
const mongoose = require("mongoose");
const expressSanitizer = require("express-sanitizer");
const sanitize = require("mongo-sanitize");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
require("dotenv").config();
// @MISC

mongoose.connect(
  process.env.DB_CONNECTION,
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) throw err;
    console.log("Connected to database");
  }
);

// * EXPRESS *
const app = express();

app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1);

// * BODY PARSER *
app.use(express.urlencoded({ extended: true, limit: 25000000 }));
app.use(
  express.json({
    limit: 25000000,
  })
);
// * BODY PARSER ERROR HANDLER *
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  if (req.headers["content-type"] === "application/x-www-form-urlencoded") {
    //req.flash("warning", err.message);
    return res.status(403).redirect(req.headers.referer);
  }
  return res.status(200).json({ error: true, message: err.message });
});

// * SANITIZE BODY AND QUERY PARAMS *
app.use((req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);

  next();
});

app.use(function (req, res, next) {
  // * ALLOWED ORIGINS *
  const allowedOrigins = [
    "https://pcsdata.herokuapp.com",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "https://bestbetsbot.herokuapp.com",
    "https://www.bullvsbear.pro",
    "bullvsbear.pro",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin))
    res.setHeader("Access-Control-Allow-Origin", origin);

  // * ALLOWED METHODS *
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // * ALLOWED HEADERS *
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.use(expressSanitizer());

// * API ROUTES *
const oracleApi = require("./api/oracle");
const roundsApi = require("./api/rounds");
app.use("/api/oracle", oracleApi);
app.use("/api/rounds", roundsApi);

const options = {
  customCss: ".swagger-ui .topbar { display: none }",
};

// * MAIN ROUTE *
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));

let port = process.env.PORT;
app.listen(port, () => console.log(`Listening on port ${port}...`));
