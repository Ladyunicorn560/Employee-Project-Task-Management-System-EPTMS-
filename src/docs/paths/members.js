'use strict';

module.exports = {
  '/projects/{projectId}/members': {
    get: {
      tags: ['Members'], summary: 'List project members', operationId: 'listProjectMembers',
      parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Member list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { type: 'object', properties: { MemberID: { type: 'integer' }, EmployeeID: { type: 'integer' }, FullName: { type: 'string' }, Email: { type: 'string' }, Role: { type: 'string' }, JoinedDate: { type: 'string', format: 'date-time' } } } } } } } } },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    post: {
      tags: ['Members'], summary: 'Add member to project', operationId: 'addProjectMember',
      description: '**Roles:** Administrator, Project Manager (own projects only).',
      parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object', required: ['employeeId'],
              properties: { employeeId: { type: 'integer', example: 3 } }
            }
          }
        }
      },
      responses: {
        201: { description: 'Member added' },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        409: { $ref: '#/components/responses/Conflict' }
      }
    }
  },
  '/projects/{projectId}/members/{memberId}': {
    delete: {
      tags: ['Members'], summary: 'Remove member from project', operationId: 'removeProjectMember',
      description: '**Roles:** Administrator, Project Manager.',
      parameters: [
        { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'memberId',  in: 'path', required: true, schema: { type: 'integer' } }
      ],
      responses: {
        200: { description: 'Member removed' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }
      }
    }
  }
};
