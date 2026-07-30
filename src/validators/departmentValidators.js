const { z } = require('zod');

/**
 * Zod Schema for POST /api/v1/departments (Create Department)
 */
const createDepartmentSchema = z.object({
  body: z.object({
    departmentName: z
      .string({ required_error: 'Department name is required' })
      .trim()
      .min(1, 'Department name cannot be empty')
      .max(150, 'Department name cannot exceed 150 characters'),
    description: z
      .string()
      .trim()
      .optional()
      .nullable()
  })
});

/**
 * Zod Schema for PUT /api/v1/departments/:id (Update Department)
 */
const updateDepartmentSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Department ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Department ID must be a positive integer' })
  }),
  body: z.object({
    departmentName: z
      .string()
      .trim()
      .min(1, 'Department name cannot be empty')
      .max(150, 'Department name cannot exceed 150 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .optional()
      .nullable()
  })
});

/**
 * Zod Schema for ID parameter validation
 */
const departmentIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Department ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Department ID must be a positive integer' })
  })
});

/**
 * Zod Schema for GET /api/v1/departments query filtering & pagination
 */
const getDepartmentsQuerySchema = z.object({
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
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentIdParamSchema,
  getDepartmentsQuerySchema
};
