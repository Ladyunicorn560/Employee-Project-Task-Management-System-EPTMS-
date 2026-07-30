'use strict';

const authPaths       = require('./paths/auth');
const healthPaths     = require('./paths/health');
const employeePaths   = require('./paths/employees');
const departmentPaths = require('./paths/departments');
const rolePaths       = require('./paths/roles');
const projectPaths    = require('./paths/projects');
const memberPaths     = require('./paths/members');
const milestonePaths  = require('./paths/milestones');
const taskPaths       = require('./paths/tasks');
const subtaskPaths    = require('./paths/subtasks');
const commentPaths    = require('./paths/comments');
const attachmentPaths = require('./paths/attachments');
const reviewPaths     = require('./paths/reviews');
const notificationPaths = require('./paths/notifications');
const dashboardPaths  = require('./paths/dashboard');
const reportPaths     = require('./paths/reports');

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'EPTMS – Employee Project & Task Management System API',
    version: '1.0.0',
    description: `
**Production-ready REST API** for the Employee Project & Task Management System (EPTMS).

Built with Node.js · Express.js · SQL Server · JWT · Zod.

### Architecture
\`\`\`
Client → Routes → Auth Middleware → Controller → Service → Repository → SQL Server
\`\`\`

### Authentication
All protected endpoints require a **JWT Bearer Token** obtained via \`POST /api/v1/auth/login\`.

Include the token in every request:
\`\`\`
Authorization: Bearer <token>
\`\`\`

### RBAC Roles
| Role | Description |
|------|-------------|
| Administrator | Full system access |
| Project Manager | Manages assigned projects & their resources |
| Employee | Access to own tasks, subtasks, and comments |
| Reviewer | Can review and approve tasks assigned to them |
    `,
    contact: {
      name: 'EPTMS Architecture Team',
      email: 'admin@eptms.com'
    },
    license: { name: 'ISC' }
  },
  servers: [
    { url: 'http://localhost:5000/api/v1', description: 'Local Development' },
    { url: 'https://api.eptms.example.com/api/v1', description: 'Production' }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from POST /auth/login'
      }
    },
    schemas: {
      // ─── Pagination ───────────────────────────────────────────────────
      PaginationMeta: {
        type: 'object',
        properties: {
          total:  { type: 'integer', example: 100 },
          page:   { type: 'integer', example: 1 },
          limit:  { type: 'integer', example: 20 },
          totalPages: { type: 'integer', example: 5 }
        }
      },
      // ─── Common Enums ─────────────────────────────────────────────────
      TaskStatus: {
        type: 'string',
        enum: ['Not Started','Assigned','In Progress','Blocked','Ready for Review','Under Review','Changes Required','Completed','Cancelled'],
        example: 'In Progress'
      },
      Priority: {
        type: 'string',
        enum: ['Low','Medium','High','Critical'],
        example: 'High'
      },
      ProjectStatus: {
        type: 'string',
        enum: ['Planning','Active','On Hold','Completed','Cancelled','Archived'],
        example: 'Active'
      },
      MilestoneStatus: {
        type: 'string',
        enum: ['Not Started','In Progress','Completed','On Hold','Cancelled'],
        example: 'In Progress'
      },
      ReviewStatus: {
        type: 'string',
        enum: ['Pending','Approved','Rejected','Changes Required'],
        example: 'Pending'
      },
      // ─── Core Entities ────────────────────────────────────────────────
      Employee: {
        type: 'object',
        properties: {
          EmployeeID:     { type: 'integer', example: 1 },
          FirstName:      { type: 'string',  example: 'System' },
          LastName:       { type: 'string',  example: 'Administrator' },
          Email:          { type: 'string',  format: 'email', example: 'admin@eptms.com' },
          Phone:          { type: 'string',  example: '+1-555-0100' },
          Status:         { type: 'string',  enum: ['Active','Inactive','On Leave','Terminated'], example: 'Active' },
          DepartmentID:   { type: 'integer', example: 1 },
          DepartmentName: { type: 'string',  example: 'Executive Management' },
          RoleID:         { type: 'integer', example: 1 },
          RoleName:       { type: 'string',  example: 'Administrator' },
          CreatedDate:    { type: 'string',  format: 'date-time' },
          LastLoginDate:  { type: 'string',  format: 'date-time', nullable: true }
        }
      },
      Department: {
        type: 'object',
        properties: {
          DepartmentID:   { type: 'integer', example: 1 },
          DepartmentName: { type: 'string',  example: 'Engineering' },
          Description:    { type: 'string',  example: 'Software engineering team', nullable: true },
          ManagerID:      { type: 'integer', example: 2, nullable: true },
          IsActive:       { type: 'boolean', example: true },
          CreatedDate:    { type: 'string',  format: 'date-time' }
        }
      },
      Role: {
        type: 'object',
        properties: {
          RoleID:      { type: 'integer', example: 1 },
          RoleName:    { type: 'string',  example: 'Administrator' },
          Description: { type: 'string',  example: 'Full system access', nullable: true },
          IsActive:    { type: 'boolean', example: true },
          CreatedDate: { type: 'string',  format: 'date-time' }
        }
      },
      Project: {
        type: 'object',
        properties: {
          ProjectID:           { type: 'integer', example: 1 },
          ProjectName:         { type: 'string',  example: 'Enterprise EPTMS Deployment' },
          Description:         { type: 'string',  nullable: true },
          Status:              { $ref: '#/components/schemas/ProjectStatus' },
          ProgressPercentage:  { type: 'number',  format: 'float', example: 45.5 },
          StartDate:           { type: 'string',  format: 'date' },
          EndDate:             { type: 'string',  format: 'date' },
          ProjectManagerID:    { type: 'integer', example: 2 },
          DepartmentID:        { type: 'integer', example: 1 },
          CreatedDate:         { type: 'string',  format: 'date-time' }
        }
      },
      Milestone: {
        type: 'object',
        properties: {
          MilestoneID:    { type: 'integer', example: 1 },
          ProjectID:      { type: 'integer', example: 1 },
          MilestoneTitle: { type: 'string',  example: 'Phase 1: Infrastructure Setup' },
          Description:    { type: 'string',  nullable: true },
          Status:         { $ref: '#/components/schemas/MilestoneStatus' },
          DueDate:        { type: 'string',  format: 'date' },
          CreatedDate:    { type: 'string',  format: 'date-time' }
        }
      },
      Task: {
        type: 'object',
        properties: {
          TaskID:         { type: 'integer', example: 1 },
          MilestoneID:    { type: 'integer', example: 1 },
          Title:          { type: 'string',  example: 'Implement JWT Authentication' },
          Description:    { type: 'string',  nullable: true },
          Status:         { $ref: '#/components/schemas/TaskStatus' },
          Priority:       { $ref: '#/components/schemas/Priority' },
          AssignedTo:     { type: 'integer', example: 3, nullable: true },
          ReviewerID:     { type: 'integer', example: 4, nullable: true },
          StartDate:      { type: 'string',  format: 'date', nullable: true },
          DueDate:        { type: 'string',  format: 'date', nullable: true },
          CompletedDate:  { type: 'string',  format: 'date', nullable: true },
          ProgressPercentage: { type: 'number', format: 'float', example: 75.0 },
          CreatedDate:    { type: 'string',  format: 'date-time' }
        }
      },
      Subtask: {
        type: 'object',
        properties: {
          SubtaskID:      { type: 'integer', example: 1 },
          TaskID:         { type: 'integer', example: 1 },
          Title:          { type: 'string',  example: 'Configure JWT middleware' },
          Description:    { type: 'string',  nullable: true },
          Status:         { type: 'string',  enum: ['Not Started','In Progress','Blocked','Completed','Cancelled'], example: 'In Progress' },
          Priority:       { $ref: '#/components/schemas/Priority' },
          AssignedTo:     { type: 'integer', example: 3, nullable: true },
          DueDate:        { type: 'string',  format: 'date', nullable: true },
          EstimatedHours: { type: 'number',  example: 4.0, nullable: true },
          ActualHours:    { type: 'number',  example: 3.5, nullable: true },
          IsCompleted:    { type: 'boolean', example: false },
          CreatedDate:    { type: 'string',  format: 'date-time' }
        }
      },
      Comment: {
        type: 'object',
        properties: {
          CommentID:   { type: 'integer', example: 1 },
          TaskID:      { type: 'integer', example: 1 },
          AuthorID:    { type: 'integer', example: 3 },
          Content:     { type: 'string',  example: 'JWT config looks good. Tested successfully.' },
          IsEdited:    { type: 'boolean', example: false },
          CreatedDate: { type: 'string',  format: 'date-time' },
          UpdatedDate: { type: 'string',  format: 'date-time', nullable: true }
        }
      },
      Attachment: {
        type: 'object',
        properties: {
          AttachmentID: { type: 'integer', example: 1 },
          TaskID:       { type: 'integer', example: 1 },
          FileName:     { type: 'string',  example: 'architecture-diagram.pdf' },
          FileType:     { type: 'string',  example: 'application/pdf' },
          FileSize:     { type: 'integer', example: 204800 },
          FilePath:     { type: 'string',  example: '/uploads/tasks/1/architecture-diagram.pdf' },
          UploadedBy:   { type: 'integer', example: 3 },
          CreatedDate:  { type: 'string',  format: 'date-time' }
        }
      },
      Review: {
        type: 'object',
        properties: {
          ReviewID:     { type: 'integer', example: 1 },
          TaskID:       { type: 'integer', example: 1 },
          ReviewerID:   { type: 'integer', example: 4 },
          Status:       { $ref: '#/components/schemas/ReviewStatus' },
          Comments:     { type: 'string',  example: 'Implementation looks correct. Approved.', nullable: true },
          Iteration:    { type: 'integer', example: 1 },
          ReviewedDate: { type: 'string',  format: 'date-time', nullable: true },
          CreatedDate:  { type: 'string',  format: 'date-time' }
        }
      },
      Notification: {
        type: 'object',
        properties: {
          NotificationID:   { type: 'integer', example: 1 },
          RecipientID:      { type: 'integer', example: 3 },
          NotificationType: { type: 'string',  example: 'Task Assigned' },
          Message:          { type: 'string',  example: 'You have been assigned to task "JWT Auth".' },
          DeliveryChannel:  { type: 'string',  enum: ['In-App','Email','SMS'], example: 'In-App' },
          IsRead:           { type: 'boolean', example: false },
          ReadDate:         { type: 'string',  format: 'date-time', nullable: true },
          CreatedDate:      { type: 'string',  format: 'date-time' }
        }
      },
      // ─── Reusable Error Responses ─────────────────────────────────────
      ErrorResponse: {
        type: 'object',
        properties: {
          success:   { type: 'boolean', example: false },
          status:    { type: 'integer', example: 400 },
          message:   { type: 'string',  example: 'Validation failed' },
          errorCode: { type: 'string',  example: 'VALIDATION_ERROR' },
          errors:    { type: 'object',  nullable: true },
          timestamp: { type: 'string',  format: 'date-time' }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          status:  { type: 'integer', example: 200 },
          message: { type: 'string',  example: 'Operation completed successfully' },
          data:    { type: 'object'  }
        }
      }
    },
    responses: {
      BadRequest: {
        description: '400 Bad Request – Validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, status: 400, message: 'Validation failed', errorCode: 'VALIDATION_ERROR', errors: { field: ['Error message'] }, timestamp: '2026-07-31T00:00:00.000Z' } } }
      },
      Unauthorized: {
        description: '401 Unauthorized – Missing or invalid JWT token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, status: 401, message: 'Missing or malformed Authorization header', errorCode: 'MISSING_TOKEN', timestamp: '2026-07-31T00:00:00.000Z' } } }
      },
      Forbidden: {
        description: '403 Forbidden – Insufficient permissions',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, status: 403, message: 'Access forbidden: Insufficient permissions', errorCode: 'FORBIDDEN', timestamp: '2026-07-31T00:00:00.000Z' } } }
      },
      NotFound: {
        description: '404 Not Found – Resource does not exist',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, status: 404, message: 'Resource not found', errorCode: 'NOT_FOUND', timestamp: '2026-07-31T00:00:00.000Z' } } }
      },
      Conflict: {
        description: '409 Conflict – Resource already exists',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, status: 409, message: 'Resource already exists', errorCode: 'CONFLICT', timestamp: '2026-07-31T00:00:00.000Z' } } }
      },
      InternalServerError: {
        description: '500 Internal Server Error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, status: 500, message: 'Database operation failed. Please try again later.', errorCode: 'DATABASE_ERROR', timestamp: '2026-07-31T00:00:00.000Z' } } }
      }
    },
    parameters: {
      IdParam: {
        name: 'id', in: 'path', required: true,
        schema: { type: 'integer', minimum: 1 },
        description: 'Numeric resource ID'
      },
      PageParam: {
        name: 'page', in: 'query', required: false,
        schema: { type: 'integer', default: 1, minimum: 1 },
        description: 'Page number for pagination'
      },
      LimitParam: {
        name: 'limit', in: 'query', required: false,
        schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
        description: 'Number of results per page'
      }
    }
  },
  security: [{ BearerAuth: [] }],
  tags: [
    { name: 'Health',        description: 'API health check' },
    { name: 'Auth',          description: 'Authentication & session management' },
    { name: 'Employees',     description: 'Employee CRUD & profile management' },
    { name: 'Departments',   description: 'Department management' },
    { name: 'Roles',         description: 'Role management' },
    { name: 'Projects',      description: 'Project lifecycle management' },
    { name: 'Members',       description: 'Project team membership' },
    { name: 'Milestones',    description: 'Project milestone tracking' },
    { name: 'Tasks',         description: 'Task management & workflow' },
    { name: 'Subtasks',      description: 'Subtask breakdown' },
    { name: 'Comments',      description: 'Task comments & collaboration' },
    { name: 'Attachments',   description: 'File attachment metadata' },
    { name: 'Reviews',       description: 'Review & approval workflow' },
    { name: 'Notifications', description: 'Notification system' },
    { name: 'Dashboard',     description: 'Analytics & dashboard views' },
    { name: 'Reports',       description: 'Exportable reports (PDF, XLSX, CSV)' }
  ],
  paths: {
    ...healthPaths,
    ...authPaths,
    ...employeePaths,
    ...departmentPaths,
    ...rolePaths,
    ...projectPaths,
    ...memberPaths,
    ...milestonePaths,
    ...taskPaths,
    ...subtaskPaths,
    ...commentPaths,
    ...attachmentPaths,
    ...reviewPaths,
    ...notificationPaths,
    ...dashboardPaths,
    ...reportPaths
  }
};

module.exports = swaggerDefinition;
