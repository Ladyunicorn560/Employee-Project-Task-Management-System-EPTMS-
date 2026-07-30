const { z } = require('zod');

/**
 * Zod Schema for POST /api/v1/roles (Create Role)
 */
const createRoleSchema = z.object({
  body: z.object({
    roleName: z
      .string({ required_error: 'Role name is required' })
      .trim()
      .min(1, 'Role name cannot be empty')
      .max(100, 'Role name cannot exceed 100 characters'),
    description: z
      .string()
      .trim()
      .optional()
      .nullable(),
    permissions: z
      .union([z.string(), z.record(z.any())])
      .optional()
      .nullable()
  })
});

/**
 * Zod Schema for PUT /api/v1/roles/:id (Update Role)
 */
const updateRoleSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Role ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Role ID must be a positive integer' })
  }),
  body: z.object({
    roleName: z
      .string()
      .trim()
      .min(1, 'Role name cannot be empty')
      .max(100, 'Role name cannot exceed 100 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .optional()
      .nullable(),
    permissions: z
      .union([z.string(), z.record(z.any())])
      .optional()
      .nullable()
  })
});

/**
 * Zod Schema for ID parameter validation
 */
const roleIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Role ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Role ID must be a positive integer' })
  })
});

/**
 * Zod Schema for GET /api/v1/roles query filtering & pagination
 */
const getRolesQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z
      .string()
      .optional()
      .default('1')
      .transform((val) => parseInt(val, 10)),
    limit: z
      .string()
      .optional()
      .default('10')
      .transform((val) => parseInt(val, 10))
  })
});

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  roleIdParamSchema,
  getRolesQuerySchema
};
