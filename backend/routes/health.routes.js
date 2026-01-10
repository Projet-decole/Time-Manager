// backend/routes/health.routes.js

const express = require('express');
const healthController = require('../controllers/health.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * @route   GET /health
 * @desc    Liveness probe - is the server running?
 * @access  Public (no auth required)
 */
router.get('/health', healthController.check);

/**
 * @route   GET /ready
 * @desc    Readiness probe - are dependencies available?
 * @access  Public (no auth required)
 */
router.get('/ready', asyncHandler(healthController.ready));

module.exports = router;
