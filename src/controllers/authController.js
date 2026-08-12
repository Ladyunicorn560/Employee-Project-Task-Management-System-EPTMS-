const authService = require('../services/authService');
const HTTP_STATUS = require('../constants/httpStatusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route POST /api/v1/auth/login
 * @desc  Authenticates user with email & password and returns JWT token
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
 * @desc  Retrieves current authenticated user profile
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

/**
 * @route POST /api/v1/auth/logout
 * @desc  Signals client to discard JWT token (stateless — token is not server-side invalidated)
 * @access Private (JWT Authenticated)
 */
const logout = asyncHandler(async (req, res) => {
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Logout successful. Please discard your token on the client side.'
  });
});

/**
 * @route PUT /api/v1/auth/change-password
 * @desc  Authenticated user changes their own password
 * @access Private (JWT Authenticated)
 */
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(userId, currentPassword, newPassword);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Password changed successfully. Please log in again with your new password.'
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'If the email exists, a password reset link has been sent.',
    data: result
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Password reset successful. You can now log in with your new password.'
  });
});

module.exports = {
  login,
  getProfile,
  logout,
  changePassword,
  forgotPassword,
  resetPassword
};

