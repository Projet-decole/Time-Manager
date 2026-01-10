// backend/app.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const mountRoutes = require('./routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
mountRoutes(app);

// 404 handler - must be after all routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Error handling (MUST be last)
app.use(errorHandler);

module.exports = app;
