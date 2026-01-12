// backend/routes/index.js

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const teamsRoutes = require('./teams.routes');
const categoriesRoutes = require('./categories.routes');
const projectsRoutes = require('./projects.routes');
const timeEntriesRoutes = require('./time-entries.routes');
const templatesRoutes = require('./templates.routes');
const healthController = require('../controllers/health.controller');

/**
 * Mount all routes on the Express app
 * @param {Express} app - Express application instance
 */
const mountRoutes = (app) => {
  // Root endpoint
  app.get('/', healthController.root);

  // Health check endpoints at root level (no auth, no /api/v1 prefix)
  // Routes: GET /health, GET /ready
  app.use('/', healthRoutes);

  // API v1 routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/teams', teamsRoutes);
  app.use('/api/v1/categories', categoriesRoutes);
  app.use('/api/v1/projects', projectsRoutes);
  app.use('/api/v1/time-entries', timeEntriesRoutes);
  app.use('/api/v1/templates', templatesRoutes);
};

module.exports = mountRoutes;
