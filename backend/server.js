// backend/server.js

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`);
});

// Fermeture propre
process.on("SIGTERM", () => {
	console.log("SIGTERM received, closing server...");
	server.close(() => {
		console.log("Server closed");
		process.exit(0);
	});
});
