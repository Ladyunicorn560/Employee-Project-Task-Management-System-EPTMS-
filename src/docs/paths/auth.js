'use strict';

const loginBody = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email:    { type: 'string', format: 'email', example: 'admin@eptms.com' },
    password: { type: 'string', format: 'password', example: 'Password123!' }
  }
};

const authSuccessResponse = {
  description: '200 OK – Authentication successful',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          status:  { type: 'integer', example: 200 },
          message: { type: 'string',  example: 'Authentication successful' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string', description: 'JWT Bearer Token', example: 'eyJhbGci...' },
              user: {
                type: 'object',
                properties: {
                  id:         { type: 'integer', example: 1 },
                  email:      { type: 'string',  example: 'admin@eptms.com' },
                  firstName:  { type: 'string',  example: 'System' },
                  lastName:   { type: 'string',  example: 'Administrator' },
                  role:       { type: 'object',  properties: { id: { type: 'integer' }, name: { type: 'string' } } },
                  department: { type: 'object',  properties: { id: { type: 'integer' }, name: { type: 'string' } } },
                  status:     { type: 'string',  example: 'Active' }
                }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = {
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login and obtain JWT token',
      description: 'Authenticates a user with email and password. Returns a signed JWT token valid for the configured duration (default: 8h). The token must be included as a `Bearer` token in all subsequent authenticated requests.',
      security: [],
      operationId: 'login',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: loginBody } }
      },
      responses: {
        200: authSuccessResponse,
        400: { $ref: '#/components/responses/BadRequest' },
        401: { description: '401 – Invalid email or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        429: { description: '429 – Too many login attempts' }
      }
    }
  },
  '/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Logout (client-side token invalidation)',
      description: 'Logs out the current session. JWT tokens are stateless; this endpoint signals the client to discard the stored token.',
      operationId: 'logout',
      responses: {
        200: { description: '200 OK – Logged out successfully' },
        401: { $ref: '#/components/responses/Unauthorized' }
      }
    }
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Get current authenticated user profile',
      description: 'Returns the profile information of the currently authenticated user based on the JWT token.',
      operationId: 'getMe',
      responses: {
        200: { description: '200 OK – Current user profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/Employee' } } } },
        401: { $ref: '#/components/responses/Unauthorized' }
      }
    }
  },
  '/auth/change-password': {
    put: {
      tags: ['Auth'],
      summary: 'Change current user password',
      description: 'Allows the authenticated user to change their own password. Requires the current password for verification.',
      operationId: 'changePassword',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: { type: 'string', format: 'password', example: 'OldPassword123!' },
                newPassword:     { type: 'string', format: 'password', example: 'NewPassword456!' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: '200 OK – Password changed successfully' },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' }
      }
    }
  }
};
