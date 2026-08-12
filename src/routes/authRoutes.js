const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const { loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/authValidators');
const { authRateLimiter } = require('../config/security');

/**
 * @route POST /api/v1/auth/login
 * @desc  Public user login endpoint – strict rate limited (10 req / 15 min)
 */
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc  Request password reset link
 */
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @route POST /api/v1/auth/reset-password
 * @desc  Submit new password using reset token
 */
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);

/**
 * @route GET /api/v1/auth/me
 * @desc  Authenticated user profile endpoint
 */
router.get('/me', authenticate, authController.getProfile);

/**
 * @route POST /api/v1/auth/logout
 * @desc  Client-side token invalidation signal
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route PUT /api/v1/auth/change-password
 * @desc  Authenticated user changes their own password
 */
router.put('/change-password', authenticate, authRateLimiter, validate(changePasswordSchema), authController.changePassword);

module.exports = router;

