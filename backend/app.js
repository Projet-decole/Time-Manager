const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
	console.log(`Server is running on port http://localhost:${PORT}`);
});

module.exports = app;
