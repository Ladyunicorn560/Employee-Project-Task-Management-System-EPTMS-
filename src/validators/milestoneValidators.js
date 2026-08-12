const { z } = require('zod');

const VALID_MILESTONE_STATUSES = ['Not Started', 'Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];

/**
 * Zod Schema for POST /api/v1/projects/:projectId/milestones (Create Milestone)
 */
const createMilestoneSchema = z.object({
  params: z.object({
    projectId: z
      .string({ required_error: 'Project ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Project ID must be a positive integer' })
  }),
  body: z.object({
    milestoneTitle: z
      .string({ required_error: 'Milestone title is required' })
      .trim()
      .min(1, 'Milestone title cannot be empty')
      .max(200, 'Milestone title cannot exceed 200 characters'),
    description: z
      .string()
      .trim()
      .optional()
      .nullable(),
    dueDate: z
      .string({ required_error: 'Due date is required' })
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Due date must be a valid ISO/date string' }),
    completedDate: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Completed date must be a valid ISO/date string' }),
    status: z
      .enum(VALID_MILESTONE_STATUSES, {
        errorMap: () => ({ message: `Status must be one of: ${VALID_MILESTONE_STATUSES.join(', ')}` })
      })
      .default('Not Started')
  })
});

/**
 * Zod Schema for PUT /api/v1/milestones/:id (Update Milestone)
 */
const updateMilestoneSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Milestone ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Milestone ID must be a positive integer' })
  }),
  body: z.object({
    milestoneTitle: z
      .string()
      .trim()
      .min(1, 'Milestone title cannot be empty')
      .max(200, 'Milestone title cannot exceed 200 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .optional()
      .nullable(),
    dueDate: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Due date must be a valid ISO/date string' }),
    completedDate: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Completed date must be a valid ISO/date string' }),
    status: z
      .enum(VALID_MILESTONE_STATUSES, {
        errorMap: () => ({ message: `Status must be one of: ${VALID_MILESTONE_STATUSES.join(', ')}` })
      })
      .optional()
  })
});

/**
 * Zod Schema for ID parameter validation
 */
const milestoneIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Milestone ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Milestone ID must be a positive integer' })
  })
});

/**
 * Zod Schema for GET /api/v1/projects/:projectId/milestones query parameters
 */
const getMilestonesQuerySchema = z.object({
  params: z.object({
    projectId: z
      .string({ required_error: 'Project ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Project ID must be a positive integer' })
  }),
  query: z.object({
    search: z.string().optional(),
    status: z.enum(VALID_MILESTONE_STATUSES).optional(),
    dueDate: z.string().optional(),
    sortBy: z.enum(['MilestoneID', 'MilestoneTitle', 'DueDate', 'Status']).optional().default('DueDate'),
    sortOrder: z.enum(['ASC', 'DESC']).optional().default('ASC'),
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
  createMilestoneSchema,
  updateMilestoneSchema,
  milestoneIdParamSchema,
  getMilestonesQuerySchema,
  VALID_MILESTONE_STATUSES
};
