const { z } = require('zod');

const VALID_TASK_STATUSES = [
  'Not Started',
  'Assigned',
  'In Progress',
  'Waiting for Information',
  'Blocked',
  'Ready for Review',
  'Under Review',
  'Changes Required',
  'Completed',
  'Cancelled'
];
const VALID_TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

/**
 * Zod Schema for POST /api/v1/milestones/:milestoneId/tasks (Create Task)
 */
const createTaskSchema = z.object({
  params: z.object({
    milestoneId: z
      .string({ required_error: 'Milestone ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Milestone ID must be a positive integer' })
  }),
  body: z.object({
    taskTitle: z
      .string({ required_error: 'Task title is required' })
      .trim()
      .min(1, 'Task title cannot be empty')
      .max(200, 'Task title cannot exceed 200 characters'),
    description: z
      .string()
      .trim()
      .optional()
      .nullable(),
    assignedEmployeeId: z
      .number({ required_error: 'Assigned employee ID is required' })
      .int('Assigned employee ID must be an integer')
      .positive('Assigned employee ID must be a positive integer'),
    reviewerId: z
      .number({ required_error: 'Reviewer employee ID is required' })
      .int('Reviewer employee ID must be an integer')
      .positive('Reviewer employee ID must be a positive integer'),
    priority: z
      .enum(VALID_TASK_PRIORITIES, {
        errorMap: () => ({ message: `Priority must be one of: ${VALID_TASK_PRIORITIES.join(', ')}` })
      })
      .default('Medium'),
    status: z
      .enum(VALID_TASK_STATUSES, {
        errorMap: () => ({ message: `Status must be one of: ${VALID_TASK_STATUSES.join(', ')}` })
      })
      .default('Not Started'),
    dueDate: z
      .string({ required_error: 'Due date is required' })
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Due date must be a valid ISO/date string' }),
    completedDate: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Completed date must be a valid ISO/date string' }),
    estimatedHours: z
      .number()
      .min(0, 'Estimated hours cannot be negative')
      .optional()
      .nullable(),
    actualHours: z
      .number()
      .min(0, 'Actual hours cannot be negative')
      .optional()
      .nullable()
  })
});

/**
 * Zod Schema for PUT /api/v1/tasks/:id (Update Task)
 */
const updateTaskSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Task ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Task ID must be a positive integer' })
  }),
  body: z.object({
    taskTitle: z
      .string()
      .trim()
      .min(1, 'Task title cannot be empty')
      .max(200, 'Task title cannot exceed 200 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .optional()
      .nullable(),
    assignedEmployeeId: z
      .number()
      .int('Assigned employee ID must be an integer')
      .positive('Assigned employee ID must be a positive integer')
      .optional(),
    reviewerId: z
      .number()
      .int('Reviewer employee ID must be an integer')
      .positive('Reviewer employee ID must be a positive integer')
      .optional(),
    priority: z
      .enum(VALID_TASK_PRIORITIES, {
        errorMap: () => ({ message: `Priority must be one of: ${VALID_TASK_PRIORITIES.join(', ')}` })
      })
      .optional(),
    status: z
      .enum(VALID_TASK_STATUSES, {
        errorMap: () => ({ message: `Status must be one of: ${VALID_TASK_STATUSES.join(', ')}` })
      })
      .optional(),
    dueDate: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Due date must be a valid ISO/date string' }),
    completedDate: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Completed date must be a valid ISO/date string' }),
    estimatedHours: z
      .number()
      .min(0, 'Estimated hours cannot be negative')
      .optional()
      .nullable(),
    actualHours: z
      .number()
      .min(0, 'Actual hours cannot be negative')
      .optional()
      .nullable(),
    comment: z
      .string()
      .trim()
      .optional()
  })
});

/**
 * Zod Schema for Task ID parameter validation
 */
const taskIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Task ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Task ID must be a positive integer' })
  })
});

/**
 * Zod Schema for GET /api/v1/milestones/:milestoneId/tasks query parameters
 */
const getTasksQuerySchema = z.object({
  params: z.object({
    milestoneId: z
      .string({ required_error: 'Milestone ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Milestone ID must be a positive integer' })
  }),
  query: z.object({
    search: z.string().optional(),
    status: z.enum(VALID_TASK_STATUSES).optional(),
    priority: z.enum(VALID_TASK_PRIORITIES).optional(),
    assignedEmployeeId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    reviewerId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    sortBy: z.enum(['TaskID', 'TaskTitle', 'DueDate', 'Priority', 'Status']).optional().default('DueDate'),
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

/**
 * Zod Schema for GET /api/v1/tasks query parameters
 */
const getAllTasksQuerySchema = z.object({
  query: z.object({
    projectId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    milestoneId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    search: z.string().optional(),
    status: z.enum(VALID_TASK_STATUSES).optional(),
    priority: z.enum(VALID_TASK_PRIORITIES).optional(),
    assignedEmployeeId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    reviewerId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    sortBy: z.enum(['TaskID', 'TaskTitle', 'DueDate', 'Priority', 'Status']).optional().default('DueDate'),
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
  createTaskSchema,
  updateTaskSchema,
  taskIdParamSchema,
  getTasksQuerySchema,
  getAllTasksQuerySchema,
  VALID_TASK_STATUSES,
  VALID_TASK_PRIORITIES
};
