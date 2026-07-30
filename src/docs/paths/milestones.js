'use strict';

const schema = { $ref: '#/components/schemas/Milestone' };
const s = (d, sc) => ({ description: d, content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: sc } } } } });
const body = {
  type: 'object', required: ['milestoneTitle', 'dueDate'],
  properties: {
    milestoneTitle: { type: 'string', example: 'Phase 1: Infrastructure' },
    description:    { type: 'string', nullable: true },
    status:         { $ref: '#/components/schemas/MilestoneStatus' },
    dueDate:        { type: 'string', format: 'date', example: '2026-03-31' }
  }
};

module.exports = {
  '/projects/{projectId}/milestones': {
    get: {
      tags: ['Milestones'], summary: 'List milestones for a project', operationId: 'listMilestones',
      parameters: [
        { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } },
        { $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }
      ],
      responses: { 200: { description: 'Milestone list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: schema } } } } } }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    post: {
      tags: ['Milestones'], summary: 'Create milestone', operationId: 'createMilestone',
      description: '**Roles:** Administrator, Project Manager.',
      parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: { required: true, content: { 'application/json': { schema: body } } },
      responses: { 201: s('Milestone created', schema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  },
  '/milestones/{id}': {
    get: {
      tags: ['Milestones'], summary: 'Get milestone by ID', operationId: 'getMilestone',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: s('Milestone details', schema), 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    put: {
      tags: ['Milestones'], summary: 'Update milestone', operationId: 'updateMilestone',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: body } } },
      responses: { 200: s('Updated milestone', schema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    delete: {
      tags: ['Milestones'], summary: 'Soft-delete milestone', operationId: 'deleteMilestone',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: { description: 'Milestone deleted' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  }
};
