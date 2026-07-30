'use strict';

const schema = { $ref: '#/components/schemas/Role' };
const body = {
  type: 'object', required: ['roleName'],
  properties: {
    roleName:    { type: 'string', example: 'Reviewer' },
    description: { type: 'string', example: 'Can review and approve tasks', nullable: true },
    isActive:    { type: 'boolean', example: true }
  }
};
const single = (d, s) => ({ description: d, content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: s } } } } });

module.exports = {
  '/roles': {
    get: {
      tags: ['Roles'], summary: 'List all roles', operationId: 'listRoles',
      parameters: [{ $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }],
      responses: { 200: { description: 'Role list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: schema } } } } } }, 401: { $ref: '#/components/responses/Unauthorized' } }
    },
    post: {
      tags: ['Roles'], summary: 'Create role', operationId: 'createRole',
      description: '**Roles:** Administrator only.',
      requestBody: { required: true, content: { 'application/json': { schema: body } } },
      responses: { 201: single('Role created', schema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 409: { $ref: '#/components/responses/Conflict' } }
    }
  },
  '/roles/{id}': {
    get: {
      tags: ['Roles'], summary: 'Get role by ID', operationId: 'getRole',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: single('Role details', schema), 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    put: {
      tags: ['Roles'], summary: 'Update role', operationId: 'updateRole',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: body } } },
      responses: { 200: single('Updated role', schema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    delete: {
      tags: ['Roles'], summary: 'Soft-delete role', operationId: 'deleteRole',
      description: '**Roles:** Administrator only.',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: { description: 'Role deleted' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  }
};
