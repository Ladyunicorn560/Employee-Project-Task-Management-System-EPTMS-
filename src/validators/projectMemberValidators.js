const { z } = require('zod');

/**
 * Zod Schema for POST /api/v1/projects/:projectId/members (Assign Member)
 */
const assignProjectMemberSchema = z.object({
  params: z.object({
    projectId: z
      .string({ required_error: 'Project ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Project ID must be a positive integer' })
  }),
  body: z.object({
    employeeId: z
      .number({ required_error: 'Employee ID is required' })
      .int('Employee ID must be an integer')
      .positive('Employee ID must be a positive integer'),
    roleInProject: z
      .string()
      .trim()
      .max(100, 'Role in project cannot exceed 100 characters')
      .optional()
      .nullable()
  })
});

/**
 * Zod Schema for DELETE /api/v1/projects/:projectId/members/:employeeId (Remove Member)
 */
const removeProjectMemberSchema = z.object({
  params: z.object({
    projectId: z
      .string({ required_error: 'Project ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Project ID must be a positive integer' }),
    employeeId: z
      .string({ required_error: 'Employee ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Employee ID must be a positive integer' })
  })
});

/**
 * Zod Schema for GET /api/v1/projects/:projectId/members query parameters
 */
const getProjectMembersQuerySchema = z.object({
  params: z.object({
    projectId: z
      .string({ required_error: 'Project ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Project ID must be a positive integer' })
  }),
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
  assignProjectMemberSchema,
  removeProjectMemberSchema,
  getProjectMembersQuerySchema
};
