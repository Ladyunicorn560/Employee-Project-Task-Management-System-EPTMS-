const { z } = require('zod');

/**
 * Zod Schema for POST /api/v1/employees (Create Employee)
 */
const createEmployeeSchema = z.object({
  body: z.object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .trim()
      .min(1, 'First name cannot be empty')
      .max(100, 'First name cannot exceed 100 characters'),
    lastName: z
      .string({ required_error: 'Last name is required' })
      .trim()
      .min(1, 'Last name cannot be empty')
      .max(100, 'Last name cannot exceed 100 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address')
      .max(256, 'Email cannot exceed 256 characters'),
    phone: z
      .string()
      .trim()
      .max(20, 'Phone number cannot exceed 20 characters')
      .optional()
      .nullable(),
    departmentId: z
      .number({ required_error: 'Department ID is required' })
      .int('Department ID must be an integer')
      .positive('Department ID must be a positive integer'),
    roleId: z
      .number({ required_error: 'Role ID is required' })
      .int('Role ID must be an integer')
      .positive('Role ID must be a positive integer'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
    status: z
      .enum(['Active', 'Inactive', 'Suspended'], {
        errorMap: () => ({ message: 'Status must be Active, Inactive, or Suspended' })
      })
      .default('Active'),
    managerId: z
      .number()
      .int()
      .positive()
      .optional()
      .nullable(),
    hourlyRate: z
      .number()
      .min(0, 'Hourly rate cannot be negative')
      .optional()
      .default(50.00)
  })
});

/**
 * Zod Schema for PUT /api/v1/employees/:id (Update Employee)
 */
const updateEmployeeSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Employee ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Employee ID must be a positive integer' })
  }),
  body: z.object({
    firstName: z
      .string()
      .trim()
      .min(1, 'First name cannot be empty')
      .max(100, 'First name cannot exceed 100 characters')
      .optional(),
    lastName: z
      .string()
      .trim()
      .min(1, 'Last name cannot be empty')
      .max(100, 'Last name cannot exceed 100 characters')
      .optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address')
      .max(256, 'Email cannot exceed 256 characters')
      .optional(),
    phone: z
      .string()
      .trim()
      .max(20, 'Phone number cannot exceed 20 characters')
      .optional()
      .nullable(),
    departmentId: z
      .number()
      .int('Department ID must be an integer')
      .positive('Department ID must be a positive integer')
      .optional(),
    roleId: z
      .number()
      .int('Role ID must be an integer')
      .positive('Role ID must be a positive integer')
      .optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .optional(),
    status: z
      .enum(['Active', 'Inactive', 'Suspended'], {
        errorMap: () => ({ message: 'Status must be Active, Inactive, or Suspended' })
      })
      .optional(),
    managerId: z
      .number()
      .int()
      .positive()
      .optional()
      .nullable(),
    hourlyRate: z
      .number()
      .min(0, 'Hourly rate cannot be negative')
      .optional()
      .nullable()
  })
});

/**
 * Zod Schema for ID parameter validation
 */
const employeeIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Employee ID parameter is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Employee ID must be a positive integer' })
  })
});

/**
 * Zod Schema for GET /api/v1/employees query filtering & pagination
 */
const getEmployeesQuerySchema = z.object({
  query: z.object({
    departmentId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    roleId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    status: z
      .enum(['Active', 'Inactive', 'Suspended'])
      .optional(),
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
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdParamSchema,
  getEmployeesQuerySchema
};
