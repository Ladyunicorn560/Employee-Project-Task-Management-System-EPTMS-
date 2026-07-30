'use strict';

const formatParam = {
  name: 'format', in: 'query', required: false,
  schema: { type: 'string', enum: ['pdf', 'xlsx', 'csv'], default: 'pdf' },
  description: 'Export format. Returns binary stream with appropriate Content-Type header.'
};

const commonParams = [
  formatParam,
  { name: 'projectId',    in: 'query', schema: { type: 'integer' } },
  { name: 'departmentId', in: 'query', schema: { type: 'integer' } },
  { name: 'startDate',    in: 'query', schema: { type: 'string', format: 'date' } },
  { name: 'endDate',      in: 'query', schema: { type: 'string', format: 'date' } },
  { name: 'status',       in: 'query', schema: { type: 'string' } },
  { $ref: '#/components/parameters/PageParam' },
  { $ref: '#/components/parameters/LimitParam' }
];

const binaryResponses = {
  200: {
    description: '200 OK – Report stream',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } },
      'text/csv': { schema: { type: 'string', format: 'binary' } }
    },
    headers: {
      'Content-Disposition': { schema: { type: 'string', example: 'attachment; filename="project_summary_2026-07-31.pdf"' } }
    }
  },
  401: { $ref: '#/components/responses/Unauthorized' },
  403: { $ref: '#/components/responses/Forbidden' },
  422: { description: '422 – Invalid query parameters' }
};

module.exports = {
  '/reports/projects': {
    get: {
      tags: ['Reports'], summary: 'Project Summary Report', operationId: 'getProjectReport',
      description: 'Generates a Project Summary report with milestone counts, task completion metrics, and team size. Supports PDF, XLSX, and CSV export. **Roles:** Administrator, Project Manager.',
      parameters: commonParams,
      responses: binaryResponses
    }
  },
  '/reports/employees': {
    get: {
      tags: ['Reports'], summary: 'Employee Workload Report', operationId: 'getEmployeeReport',
      description: 'Shows employee task assignment, completion rates, overdue counts, and pending reviews. **Roles:** All roles (scoped by RBAC).',
      parameters: [...commonParams, { name: 'employeeId', in: 'query', schema: { type: 'integer' } }],
      responses: binaryResponses
    }
  },
  '/reports/tasks': {
    get: {
      tags: ['Reports'], summary: 'Task Status Report', operationId: 'getTaskReport',
      description: 'Comprehensive task listing with status, priority, assignee, reviewer, and latest review outcome. **Roles:** All roles (scoped by RBAC).',
      parameters: [...commonParams, { name: 'employeeId', in: 'query', schema: { type: 'integer' } }, { name: 'priority', in: 'query', schema: { $ref: '#/components/schemas/Priority' } }],
      responses: binaryResponses
    }
  },
  '/reports/milestones': {
    get: {
      tags: ['Reports'], summary: 'Milestone Progress Report', operationId: 'getMilestoneReport',
      description: 'Milestone progress with task completion counts and calculated progress percentage. **Roles:** Administrator, Project Manager, Employee.',
      parameters: commonParams,
      responses: binaryResponses
    }
  },
  '/reports/reviews': {
    get: {
      tags: ['Reports'], summary: 'Review History Report', operationId: 'getReviewReport',
      description: 'Full review audit trail with reviewer, iteration, status, and date. **Roles:** All roles (scoped by RBAC).',
      parameters: [...commonParams, { name: 'reviewerId', in: 'query', schema: { type: 'integer' } }],
      responses: binaryResponses
    }
  },
  '/reports/notifications': {
    get: {
      tags: ['Reports'], summary: 'Notification Summary Report', operationId: 'getNotificationReport',
      description: 'Notification delivery log with read status, channel, and timestamps. Administrators see all; other roles see their own. **Roles:** All roles.',
      parameters: commonParams,
      responses: binaryResponses
    }
  }
};
