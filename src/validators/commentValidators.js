const { z } = require('zod');

/**
 * Zod Schema for POST /api/v1/tasks/:taskId/comments (Create Comment)
 */
const createCommentSchema = z.object({
  params: z.object({
    taskId: z
      .string({ required_error: 'Task ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Task ID must be a positive integer' })
  }),
  body: z.object({
    commentText: z
      .string({ required_error: 'Comment text is required' })
      .trim()
      .min(1, 'Comment text cannot be empty')
      .max(4000, 'Comment text cannot exceed 4000 characters')
  })
});

/**
 * Zod Schema for PUT /api/v1/comments/:id (Update Comment)
 */
const updateCommentSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Comment ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Comment ID must be a positive integer' })
  }),
  body: z.object({
    commentText: z
      .string({ required_error: 'Comment text is required' })
      .trim()
      .min(1, 'Comment text cannot be empty')
      .max(4000, 'Comment text cannot exceed 4000 characters')
  })
});

/**
 * Zod Schema for Comment ID parameter validation
 */
const commentIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Comment ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Comment ID must be a positive integer' })
  })
});

/**
 * Zod Schema for GET /api/v1/tasks/:taskId/comments query parameters
 */
const getCommentsQuerySchema = z.object({
  params: z.object({
    taskId: z
      .string({ required_error: 'Task ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Task ID must be a positive integer' })
  }),
  query: z.object({
    search: z.string().optional(),
    createdBy: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    sortBy: z.enum(['CommentID', 'CreatedDate']).optional().default('CreatedDate'),
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
  createCommentSchema,
  updateCommentSchema,
  commentIdParamSchema,
  getCommentsQuerySchema
};
