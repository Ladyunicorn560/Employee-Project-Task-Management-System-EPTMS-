const { z } = require('zod');

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.png', '.jpg', '.jpeg', '.gif', '.zip', '.txt', '.csv'
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Zod Schema for POST /api/v1/tasks/:taskId/attachments (Create Attachment Metadata)
 */
const createAttachmentSchema = z.object({
  params: z.object({
    taskId: z
      .string({ required_error: 'Task ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Task ID must be a positive integer' })
  }),
  body: z.object({
    fileName: z
      .string({ required_error: 'File name is required' })
      .trim()
      .min(1, 'File name cannot be empty')
      .max(255, 'File name cannot exceed 255 characters')
      .refine(
        (fileName) => {
          const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
          return ALLOWED_EXTENSIONS.includes(ext);
        },
        { message: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}` }
      ),
    filePath: z
      .string({ required_error: 'File path/reference is required' })
      .trim()
      .min(1, 'File path cannot be empty')
      .max(500, 'File path cannot exceed 500 characters'),
    fileSize: z
      .number({ required_error: 'File size is required' })
      .int('File size must be an integer')
      .positive('File size must be greater than 0')
      .max(MAX_FILE_SIZE_BYTES, `File size cannot exceed ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`),
    fileType: z
      .string()
      .trim()
      .max(100, 'File type cannot exceed 100 characters')
      .optional()
      .nullable()
  })
});

/**
 * Zod Schema for Attachment ID parameter validation
 */
const attachmentIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Attachment ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Attachment ID must be a positive integer' })
  })
});

/**
 * Zod Schema for GET /api/v1/tasks/:taskId/attachments query parameters
 */
const getAttachmentsQuerySchema = z.object({
  params: z.object({
    taskId: z
      .string({ required_error: 'Task ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Task ID must be a positive integer' })
  }),
  query: z.object({
    search: z.string().optional(),
    uploadedBy: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    sortBy: z.enum(['AttachmentID', 'FileName', 'FileSize', 'CreatedDate']).optional().default('CreatedDate'),
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
  createAttachmentSchema,
  attachmentIdParamSchema,
  getAttachmentsQuerySchema,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES
};
