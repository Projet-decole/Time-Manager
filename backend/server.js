// backend/server.js

const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`${signal} received, closing server...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

// Handle both SIGTERM (Docker/production) and SIGINT (Ctrl+C/development)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
