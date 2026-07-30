'use strict';

const deptSchema = { $ref: '#/components/schemas/Department' };
const bodyCreate = {
  type: 'object',
  required: ['departmentName'],
  properties: {
    departmentName: { type: 'string', example: 'Engineering' },
    description:    { type: 'string', example: 'Core engineering team', nullable: true },
    managerId:      { type: 'integer', example: 2, nullable: true },
    isActive:       { type: 'boolean', example: true }
  }
};

const list = (desc, schema) => ({ description: desc, content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, total: { type: 'integer' }, data: { type: 'array', items: schema } } } } } });
const single = (desc, schema) => ({ description: desc, content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: schema } } } } });

module.exports = {
  '/departments': {
    get: {
      tags: ['Departments'], summary: 'List all departments', operationId: 'listDepartments',
      parameters: [{ $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }],
      responses: { 200: list('Department list', deptSchema), 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' } }
    },
    post: {
      tags: ['Departments'], summary: 'Create department', operationId: 'createDepartment',
      description: '**Roles:** Administrator only.',
      requestBody: { required: true, content: { 'application/json': { schema: bodyCreate } } },
      responses: { 201: single('Department created', deptSchema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 409: { $ref: '#/components/responses/Conflict' } }
    }
  },
  '/departments/{id}': {
    get: {
      tags: ['Departments'], summary: 'Get department by ID', operationId: 'getDepartment',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: single('Department details', deptSchema), 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    put: {
      tags: ['Departments'], summary: 'Update department', operationId: 'updateDepartment',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: bodyCreate } } },
      responses: { 200: single('Updated department', deptSchema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    delete: {
      tags: ['Departments'], summary: 'Soft-delete department', operationId: 'deleteDepartment',
      description: '**Roles:** Administrator only.',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: { description: 'Department deleted' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  }
};
