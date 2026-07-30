const authService = require('../services/authService');
const HTTP_STATUS = require('../constants/httpStatusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route POST /api/v1/auth/login
 * @desc Authenticates user with email & password and returns JWT token
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Authentication successful',
    data: result
  });
});

/**
 * @route GET /api/v1/auth/me
 * @desc Retrieves current authenticated user profile
 * @access Private (JWT Authenticated)
 */
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const result = await authService.getProfile(userId);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'User profile retrieved successfully',
    data: result
  });
});

module.exports = {
  login,
  getProfile
};
