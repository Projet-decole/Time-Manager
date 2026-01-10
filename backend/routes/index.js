// backend/routes/index.js

const healthRoutes = require('./health.routes');
const healthController = require('../controllers/health.controller');

/**
 * Mount all routes on the Express app
 * @param {Express} app - Express application instance
 */
const mountRoutes = (app) => {
  // Root endpoint
  app.get('/', healthController.root);

  // Health check endpoints
  app.use('/health', healthRoutes);
  app.use('/ready', healthRoutes);

  // Future routes will be added here:
  // app.use('/api/v1/auth', authRoutes);
  // app.use('/api/v1/users', userRoutes);
  // app.use('/api/v1/time-entries', timeEntriesRoutes);
};

module.exports = mountRoutes;
