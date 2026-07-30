const { z } = require('zod');

const VALID_SUBTASK_STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Completed', 'Cancelled'];
const VALID_SUBTASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

/**
 * Zod Schema for POST /api/v1/tasks/:taskId/subtasks (Create Subtask)
 */
const createSubtaskSchema = z.object({
  params: z.object({
    taskId: z
      .string({ required_error: 'Task ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Task ID must be a positive integer' })
  }),
  body: z.object({
    subtaskTitle: z
      .string({ required_error: 'Subtask title is required' })
      .trim()
      .min(1, 'Subtask title cannot be empty')
      .max(200, 'Subtask title cannot exceed 200 characters'),
    description: z
      .string()
      .trim()
      .optional()
      .nullable(),
    assignedEmployeeId: z
      .number()
      .int('Assigned employee ID must be an integer')
      .positive('Assigned employee ID must be a positive integer')
      .optional()
      .nullable(),
    priority: z
      .enum(VALID_SUBTASK_PRIORITIES, {
        errorMap: () => ({ message: `Priority must be one of: ${VALID_SUBTASK_PRIORITIES.join(', ')}` })
      })
      .default('Medium'),
    status: z
      .enum(VALID_SUBTASK_STATUSES, {
        errorMap: () => ({ message: `Status must be one of: ${VALID_SUBTASK_STATUSES.join(', ')}` })
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
 * Zod Schema for PUT /api/v1/subtasks/:id (Update Subtask)
 */
const updateSubtaskSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Subtask ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Subtask ID must be a positive integer' })
  }),
  body: z.object({
    subtaskTitle: z
      .string()
      .trim()
      .min(1, 'Subtask title cannot be empty')
      .max(200, 'Subtask title cannot exceed 200 characters')
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
      .optional()
      .nullable(),
    priority: z
      .enum(VALID_SUBTASK_PRIORITIES, {
        errorMap: () => ({ message: `Priority must be one of: ${VALID_SUBTASK_PRIORITIES.join(', ')}` })
      })
      .optional(),
    status: z
      .enum(VALID_SUBTASK_STATUSES, {
        errorMap: () => ({ message: `Status must be one of: ${VALID_SUBTASK_STATUSES.join(', ')}` })
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
      .nullable()
  })
});

/**
 * Zod Schema for Subtask ID parameter validation
 */
const subtaskIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Subtask ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Subtask ID must be a positive integer' })
  })
});

/**
 * Zod Schema for GET /api/v1/tasks/:taskId/subtasks query parameters
 */
const getSubtasksQuerySchema = z.object({
  params: z.object({
    taskId: z
      .string({ required_error: 'Task ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Task ID must be a positive integer' })
  }),
  query: z.object({
    search: z.string().optional(),
    status: z.enum(VALID_SUBTASK_STATUSES).optional(),
    priority: z.enum(VALID_SUBTASK_PRIORITIES).optional(),
    assignedEmployeeId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    sortBy: z.enum(['SubtaskID', 'SubtaskTitle', 'DueDate', 'Priority', 'Status']).optional().default('DueDate'),
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
  createSubtaskSchema,
  updateSubtaskSchema,
  subtaskIdParamSchema,
  getSubtasksQuerySchema,
  VALID_SUBTASK_STATUSES,
  VALID_SUBTASK_PRIORITIES
};
