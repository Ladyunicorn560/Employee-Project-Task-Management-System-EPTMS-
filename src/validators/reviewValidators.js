const { z } = require('zod');

const VALID_REVIEW_STATUSES = ['Pending', 'Approved', 'Rejected', 'Changes Required'];

/**
 * Zod Schema for POST /api/v1/tasks/:taskId/reviews (Create Review Request)
 */
const createReviewSchema = z.object({
  params: z.object({
    taskId: z
      .string({ required_error: 'Task ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Task ID must be a positive integer' })
  }),
  body: z.object({
    reviewerId: z
      .number()
      .int('Reviewer ID must be an integer')
      .positive('Reviewer ID must be a positive integer')
      .optional()
      .nullable(),
    status: z
      .enum(VALID_REVIEW_STATUSES, {
        errorMap: () => ({ message: `Status must be one of: ${VALID_REVIEW_STATUSES.join(', ')}` })
      })
      .default('Pending'),
    comments: z
      .string()
      .trim()
      .max(4000, 'Review comments cannot exceed 4000 characters')
      .optional()
      .nullable()
  })
});

/**
 * Zod Schema for PUT /api/v1/reviews/:id (Update Review)
 */
const updateReviewSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Review ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Review ID must be a positive integer' })
  }),
  body: z.object({
    status: z
      .enum(VALID_REVIEW_STATUSES, {
        errorMap: () => ({ message: `Status must be one of: ${VALID_REVIEW_STATUSES.join(', ')}` })
      }),
    comments: z
      .string()
      .trim()
      .max(4000, 'Review comments cannot exceed 4000 characters')
      .optional()
      .nullable()
  })
});

/**
 * Zod Schema for Review ID parameter validation
 */
const reviewIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Review ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Review ID must be a positive integer' })
  })
});

/**
 * Zod Schema for GET /api/v1/tasks/:taskId/reviews query parameters
 */
const getReviewsQuerySchema = z.object({
  params: z.object({
    taskId: z
      .string({ required_error: 'Task ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Task ID must be a positive integer' })
  }),
  query: z.object({
    status: z.enum(VALID_REVIEW_STATUSES).optional(),
    reviewerId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    sortBy: z.enum(['ReviewID', 'Iteration', 'CreatedDate']).optional().default('Iteration'),
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
  createReviewSchema,
  updateReviewSchema,
  reviewIdParamSchema,
  getReviewsQuerySchema,
  VALID_REVIEW_STATUSES
};
