const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const { loginSchema } = require('../validators/authValidators');

/**
 * @route POST /api/v1/auth/login
 * @desc Public user login endpoint
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route GET /api/v1/auth/me
 * @desc Authenticated user profile endpoint
 */
router.get('/me', authenticate, authController.getProfile);

module.exports = router;
