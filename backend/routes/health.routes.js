// backend/routes/health.routes.js

const express = require('express');
const healthController = require('../controllers/health.controller');

const router = express.Router();

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', healthController.check);

module.exports = router;
