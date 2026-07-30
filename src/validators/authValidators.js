const { z } = require('zod');

/**
 * Zod Schema for POST /api/v1/auth/login request validation
 */
const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password cannot be empty')
  })
});

module.exports = {
  loginSchema
};
