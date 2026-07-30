'use strict';

const listResponse = (description, schema) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success:    { type: 'boolean', example: true },
          total:      { type: 'integer', example: 5 },
          page:       { type: 'integer', example: 1 },
          limit:      { type: 'integer', example: 20 },
          totalPages: { type: 'integer', example: 1 },
          data: { type: 'array', items: schema }
        }
      }
    }
  }
});

const singleResponse = (description, schema) => ({
  description,
  content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: schema } } } }
});

const empSchema  = { $ref: '#/components/schemas/Employee' };
const bodyCreate = {
  type: 'object',
  required: ['firstName', 'lastName', 'email', 'password', 'roleId', 'departmentId'],
  properties: {
    firstName:    { type: 'string', example: 'John' },
    lastName:     { type: 'string', example: 'Doe' },
    email:        { type: 'string', format: 'email', example: 'john.doe@eptms.com' },
    password:     { type: 'string', format: 'password', example: 'Password123!' },
    phone:        { type: 'string', example: '+1-555-0101', nullable: true },
    roleId:       { type: 'integer', example: 3 },
    departmentId: { type: 'integer', example: 2 },
    status:       { type: 'string', enum: ['Active','Inactive'], example: 'Active' }
  }
};

module.exports = {
  '/employees': {
    get: {
      tags: ['Employees'], summary: 'List all employees', operationId: 'listEmployees',
      description: 'Returns a paginated list of all non-deleted employees. **Roles:** Administrator, Project Manager.',
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['Active','Inactive','On Leave','Terminated'] } },
        { name: 'departmentId', in: 'query', schema: { type: 'integer' } },
        { name: 'roleId', in: 'query', schema: { type: 'integer' } }
      ],
      responses: {
        200: listResponse('Paginated employee list', empSchema),
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    },
    post: {
      tags: ['Employees'], summary: 'Create a new employee', operationId: 'createEmployee',
      description: 'Creates a new employee account. **Roles:** Administrator only.',
      requestBody: { required: true, content: { 'application/json': { schema: bodyCreate } } },
      responses: {
        201: singleResponse('Employee created', empSchema),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        409: { $ref: '#/components/responses/Conflict' }
      }
    }
  },
  '/employees/{id}': {
    get: {
      tags: ['Employees'], summary: 'Get employee by ID', operationId: 'getEmployee',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: singleResponse('Employee details', empSchema),
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    put: {
      tags: ['Employees'], summary: 'Update employee', operationId: 'updateEmployee',
      description: '**Roles:** Administrator can update any employee. Employee can update their own profile fields.',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: bodyCreate } } },
      responses: {
        200: singleResponse('Updated employee', empSchema),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    delete: {
      tags: ['Employees'], summary: 'Soft-delete employee', operationId: 'deleteEmployee',
      description: 'Soft-deletes an employee (sets IsDeleted = true). **Roles:** Administrator only.',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: {
        200: { description: '200 OK – Employee deleted' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  }
};
