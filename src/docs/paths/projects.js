'use strict';

const schema = { $ref: '#/components/schemas/Project' };
const s = (d, sc) => ({ description: d, content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: sc } } } } });
const createBody = {
  type: 'object', required: ['projectName', 'startDate', 'endDate', 'projectManagerId'],
  properties: {
    projectName:      { type: 'string', example: 'Enterprise EPTMS Deployment v1.0' },
    description:      { type: 'string', nullable: true },
    status:           { $ref: '#/components/schemas/ProjectStatus' },
    startDate:        { type: 'string', format: 'date', example: '2026-01-01' },
    endDate:          { type: 'string', format: 'date', example: '2026-12-31' },
    projectManagerId: { type: 'integer', example: 2 },
    departmentId:     { type: 'integer', example: 1, nullable: true }
  }
};

module.exports = {
  '/projects': {
    get: {
      tags: ['Projects'], summary: 'List projects', operationId: 'listProjects',
      description: 'Returns all projects. Result is scoped by role: Administrators see all; Project Managers see their managed/member projects; Employees see their member projects.',
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/ProjectStatus' } },
        { name: 'departmentId', in: 'query', schema: { type: 'integer' } }
      ],
      responses: { 200: { description: 'Project list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, total: { type: 'integer' }, data: { type: 'array', items: schema } } } } } }, 401: { $ref: '#/components/responses/Unauthorized' } }
    },
    post: {
      tags: ['Projects'], summary: 'Create project', operationId: 'createProject',
      description: '**Roles:** Administrator only.',
      requestBody: { required: true, content: { 'application/json': { schema: createBody } } },
      responses: { 201: s('Project created', schema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 409: { $ref: '#/components/responses/Conflict' } }
    }
  },
  '/projects/{id}': {
    get: {
      tags: ['Projects'], summary: 'Get project by ID', operationId: 'getProject',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: s('Project details', schema), 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    put: {
      tags: ['Projects'], summary: 'Update project', operationId: 'updateProject',
      description: '**Roles:** Administrator, Project Manager (own projects only).',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: createBody } } },
      responses: { 200: s('Updated project', schema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    delete: {
      tags: ['Projects'], summary: 'Soft-delete project', operationId: 'deleteProject',
      description: '**Roles:** Administrator only.',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: { description: 'Project deleted' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  }
};
