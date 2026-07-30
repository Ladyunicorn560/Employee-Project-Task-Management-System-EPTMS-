const { z } = require('zod');

const VALID_NOTIFICATION_TYPES = [
  'Task Assigned',
  'Task Completed',
  'Task Due Soon',
  'Task Overdue',
  'Review Requested',
  'Review Approved',
  'Review Rejected',
  'Review Changes Required',
  'Comment Added',
  'Attachment Uploaded',
  'Project Completed',
  'Milestone Completed'
];

/**
 * Zod Schema for Notification ID parameter validation
 */
const notificationIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Notification ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Notification ID must be a positive integer' })
  })
});

/**
 * Zod Schema for GET /api/v1/notifications query parameters
 */
const getNotificationsQuerySchema = z.object({
  query: z.object({
    isRead: z
      .string()
      .optional()
      .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
    notificationType: z.enum(VALID_NOTIFICATION_TYPES).optional(),
    recipientId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    search: z.string().optional(),
    sortBy: z.enum(['NotificationID', 'CreatedDate']).optional().default('CreatedDate'),
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
  notificationIdParamSchema,
  getNotificationsQuerySchema,
  VALID_NOTIFICATION_TYPES
};
