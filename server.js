const express = require("express");
const path = require("path");
const cors = require("cors");
const auth = require("basic-auth");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Autenticación básica para admin
const adminAuth = (req, res, next) => {
  const user = auth(req);
  if (
    user &&
    user.name === process.env.ADMIN_USER &&
    user.pass === process.env.ADMIN_PASS
  ) {
    return next();
  }
  res.set("WWW-Authenticate", 'Basic realm="Admin Area"');
  res.status(401).send("Acceso denegado");
};

app.get("/admin", adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "admin.html"));
});

// Rutas separadas
