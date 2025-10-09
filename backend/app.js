const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route de test
app.get("/", (req, res) => {
	res.json({ message: "Time Manager API is running!" });
});

app.get("/health", (req, res) => {
	res.json({ status: "OK", timestamp: new Date() });
});

module.exports = app;
