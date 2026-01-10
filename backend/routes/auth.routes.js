// backend/routes/auth.routes.js

const express = require('express');
const authController = require('../controllers/auth.controller');
const asyncHandler = require('../utils/asyncHandler');
const { loginSchema, validate } = require('../validators/auth.validator');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user with email and password
 * @access  Public
 */
router.post('/login', validate(loginSchema), asyncHandler(authController.login));

module.exports = router;
