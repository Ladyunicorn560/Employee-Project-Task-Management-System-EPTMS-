'use strict';

const schema = { $ref: '#/components/schemas/Task' };
const s = (d, sc) => ({ description: d, content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: sc } } } } });
const body = {
  type: 'object', required: ['title', 'priority'],
  properties: {
    title:       { type: 'string', example: 'Implement JWT Authentication' },
    description: { type: 'string', nullable: true },
    status:      { $ref: '#/components/schemas/TaskStatus' },
    priority:    { $ref: '#/components/schemas/Priority' },
    assignedTo:  { type: 'integer', example: 3, nullable: true },
    reviewerId:  { type: 'integer', example: 4, nullable: true },
    startDate:   { type: 'string', format: 'date', nullable: true },
    dueDate:     { type: 'string', format: 'date', nullable: true }
  }
};

module.exports = {
  '/milestones/{milestoneId}/tasks': {
    get: {
      tags: ['Tasks'], summary: 'List tasks in a milestone', operationId: 'listTasks',
      parameters: [
        { name: 'milestoneId', in: 'path', required: true, schema: { type: 'integer' } },
        { $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' },
        { name: 'status',   in: 'query', schema: { $ref: '#/components/schemas/TaskStatus' } },
        { name: 'priority', in: 'query', schema: { $ref: '#/components/schemas/Priority' } }
      ],
      responses: { 200: { description: 'Task list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: schema } } } } } }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    post: {
      tags: ['Tasks'], summary: 'Create task in a milestone', operationId: 'createTask',
      description: 'Creates a new task inside a milestone. Automatically triggers a **Task Assigned** notification if `assignedTo` is set. Task status changes trigger milestone and project progress recalculation in a single SQL transaction. **Roles:** Administrator, Project Manager.',
      parameters: [{ name: 'milestoneId', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: { required: true, content: { 'application/json': { schema: body } } },
      responses: { 201: s('Task created', schema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' }, 409: { $ref: '#/components/responses/Conflict' } }
    }
  },
  '/tasks/{id}': {
    get: {
      tags: ['Tasks'], summary: 'Get task by ID', operationId: 'getTask',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: s('Task details', schema), 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    put: {
      tags: ['Tasks'], summary: 'Update task', operationId: 'updateTask',
      description: 'Updates task fields. Status transitions (e.g., → Completed) automatically recalculate milestone and project progress in the same transaction.',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: body } } },
      responses: { 200: s('Updated task', schema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    delete: {
      tags: ['Tasks'], summary: 'Soft-delete task', operationId: 'deleteTask',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: { description: 'Task deleted' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  }
};
