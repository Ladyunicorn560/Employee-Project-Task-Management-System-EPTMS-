'use strict';

const schema = { $ref: '#/components/schemas/Subtask' };
const s = (d, sc) => ({ description: d, content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: sc } } } } });
const body = {
  type: 'object', required: ['title'],
  properties: {
    title:          { type: 'string', example: 'Configure JWT middleware' },
    description:    { type: 'string', nullable: true },
    status:         { type: 'string', enum: ['Not Started','In Progress','Blocked','Completed','Cancelled'], example: 'Not Started' },
    priority:       { $ref: '#/components/schemas/Priority' },
    assignedTo:     { type: 'integer', example: 3, nullable: true },
    dueDate:        { type: 'string', format: 'date', nullable: true },
    estimatedHours: { type: 'number', example: 4.0, nullable: true },
    actualHours:    { type: 'number', example: 3.5, nullable: true }
  }
};

module.exports = {
  '/tasks/{taskId}/subtasks': {
    get: {
      tags: ['Subtasks'], summary: 'List subtasks of a task', operationId: 'listSubtasks',
      parameters: [
        { name: 'taskId', in: 'path', required: true, schema: { type: 'integer' } },
        { $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }
      ],
      responses: { 200: { description: 'Subtask list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: schema } } } } } }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    post: {
      tags: ['Subtasks'], summary: 'Create subtask', operationId: 'createSubtask',
      description: 'Subtask due date must be ≤ Task due date. Completion triggers Task → Milestone → Project progress recalculation.',
      parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: { required: true, content: { 'application/json': { schema: body } } },
      responses: { 201: s('Subtask created', schema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  },
  '/subtasks/{id}': {
    get: {
      tags: ['Subtasks'], summary: 'Get subtask by ID', operationId: 'getSubtask',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: s('Subtask details', schema), 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    put: {
      tags: ['Subtasks'], summary: 'Update subtask', operationId: 'updateSubtask',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: body } } },
      responses: { 200: s('Updated subtask', schema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    delete: {
      tags: ['Subtasks'], summary: 'Soft-delete subtask', operationId: 'deleteSubtask',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: { description: 'Subtask deleted' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  }
};
