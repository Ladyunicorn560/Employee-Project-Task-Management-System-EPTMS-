'use strict';

const qParams = [
  { name: 'projectId',    in: 'query', schema: { type: 'integer' }, description: 'Filter by project ID' },
  { name: 'departmentId', in: 'query', schema: { type: 'integer' }, description: 'Filter by department ID' },
  { name: 'startDate',    in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filter from date (inclusive)' },
  { name: 'endDate',      in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filter to date (inclusive)' }
];

module.exports = {
  '/dashboard/overview': {
    get: {
      tags: ['Dashboard'], summary: 'System overview analytics', operationId: 'getDashboardOverview',
      description: 'Returns high-level system metrics. RBAC-scoped: Administrators see global metrics; Project Managers see their project scope; Employees see only their assigned tasks.',
      parameters: qParams,
      responses: {
        200: { description: 'Overview analytics', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { totalEmployees: { type: 'integer' }, activeProjects: { type: 'integer' }, totalTasks: { type: 'integer' }, completedTasks: { type: 'integer' }, overdueTasks: { type: 'integer' }, completionRate: { type: 'number', format: 'float' } } } } } } } },
        401: { $ref: '#/components/responses/Unauthorized' }
      }
    }
  },
  '/dashboard/projects': {
    get: {
      tags: ['Dashboard'], summary: 'Project analytics', operationId: 'getDashboardProjects',
      parameters: qParams,
      responses: { 200: { description: 'Project analytics with status distribution' }, 401: { $ref: '#/components/responses/Unauthorized' } }
    }
  },
  '/dashboard/tasks': {
    get: {
      tags: ['Dashboard'], summary: 'Task analytics & priority breakdown', operationId: 'getDashboardTasks',
      parameters: qParams,
      responses: { 200: { description: 'Task analytics with status and priority distribution' }, 401: { $ref: '#/components/responses/Unauthorized' } }
    }
  },
  '/dashboard/employees': {
    get: {
      tags: ['Dashboard'], summary: 'Employee productivity analytics', operationId: 'getDashboardEmployees',
      description: '**Roles:** Administrator, Project Manager.',
      parameters: qParams,
      responses: { 200: { description: 'Employee workload and productivity data' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' } }
    }
  },
  '/dashboard/notifications': {
    get: {
      tags: ['Dashboard'], summary: 'Notification analytics', operationId: 'getDashboardNotifications',
      parameters: qParams,
      responses: { 200: { description: 'Notification statistics (read/unread counts, type breakdown)' }, 401: { $ref: '#/components/responses/Unauthorized' } }
    }
  }
};
