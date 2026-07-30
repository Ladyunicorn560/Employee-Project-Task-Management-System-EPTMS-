const { z } = require('zod');

const VALID_PROJECT_STATUSES = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled', 'Archived'];

/**
 * Zod Schema for POST /api/v1/projects (Create Project)
 */
const createProjectSchema = z.object({
  body: z
    .object({
      projectName: z
        .string({ required_error: 'Project name is required' })
        .trim()
        .min(1, 'Project name cannot be empty')
        .max(200, 'Project name cannot exceed 200 characters'),
      description: z
        .string()
        .trim()
        .optional()
        .nullable(),
      departmentId: z
        .number({ required_error: 'Department ID is required' })
        .int('Department ID must be an integer')
        .positive('Department ID must be a positive integer'),
      projectManagerId: z
        .number({ required_error: 'Project Manager ID is required' })
        .int('Project Manager ID must be an integer')
        .positive('Project Manager ID must be a positive integer'),
      startDate: z
        .string({ required_error: 'Start date is required' })
        .refine((val) => !isNaN(Date.parse(val)), { message: 'Start date must be a valid ISO/date string' }),
      endDate: z
        .string({ required_error: 'End date is required' })
        .refine((val) => !isNaN(Date.parse(val)), { message: 'End date must be a valid ISO/date string' }),
      actualEndDate: z
        .string()
        .optional()
        .nullable()
        .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Actual end date must be a valid ISO/date string' }),
      status: z
        .enum(VALID_PROJECT_STATUSES, {
          errorMap: () => ({ message: `Status must be one of: ${VALID_PROJECT_STATUSES.join(', ')}` })
        })
        .default('Planning'),
      progressPercentage: z
        .number()
        .min(0, 'Progress percentage cannot be negative')
        .max(100, 'Progress percentage cannot exceed 100')
        .optional()
        .default(0)
    })
    .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
      message: 'End date cannot be before start date',
      path: ['endDate']
    })
});

/**
 * Zod Schema for PUT /api/v1/projects/:id (Update Project)
 */
const updateProjectSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Project ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Project ID must be a positive integer' })
  }),
  body: z
    .object({
      projectName: z
        .string()
        .trim()
        .min(1, 'Project name cannot be empty')
        .max(200, 'Project name cannot exceed 200 characters')
        .optional(),
      description: z
        .string()
        .trim()
        .optional()
        .nullable(),
      departmentId: z
        .number()
        .int('Department ID must be an integer')
        .positive('Department ID must be a positive integer')
        .optional(),
      projectManagerId: z
        .number()
        .int('Project Manager ID must be an integer')
        .positive('Project Manager ID must be a positive integer')
        .optional(),
      startDate: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Start date must be a valid ISO/date string' }),
      endDate: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'End date must be a valid ISO/date string' }),
      actualEndDate: z
        .string()
        .optional()
        .nullable()
        .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Actual end date must be a valid ISO/date string' }),
      status: z
        .enum(VALID_PROJECT_STATUSES, {
          errorMap: () => ({ message: `Status must be one of: ${VALID_PROJECT_STATUSES.join(', ')}` })
        })
        .optional(),
      progressPercentage: z
        .number()
        .min(0, 'Progress percentage cannot be negative')
        .max(100, 'Progress percentage cannot exceed 100')
        .optional()
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return new Date(data.endDate) >= new Date(data.startDate);
        }
        return true;
      },
      {
        message: 'End date cannot be before start date',
        path: ['endDate']
      }
    )
});

/**
 * Zod Schema for ID parameter validation
 */
const projectIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Project ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Project ID must be a positive integer' })
  })
});

/**
 * Zod Schema for GET /api/v1/projects query parameters
 */
const getProjectsQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    status: z.enum(VALID_PROJECT_STATUSES).optional(),
    departmentId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    projectManagerId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.enum(['ProjectID', 'ProjectName', 'StartDate', 'EndDate', 'Status', 'ProgressPercentage']).optional().default('ProjectID'),
    sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
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
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  getProjectsQuerySchema,
  VALID_PROJECT_STATUSES
};
