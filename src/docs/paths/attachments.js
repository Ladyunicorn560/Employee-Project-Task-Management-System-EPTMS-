'use strict';

const schema = { $ref: '#/components/schemas/Attachment' };
const s = (d, sc) => ({ description: d, content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: sc } } } } });
const body = {
  type: 'object', required: ['fileName', 'filePath'],
  properties: {
    fileName: { type: 'string', example: 'architecture-diagram.pdf' },
    fileType: { type: 'string', example: 'application/pdf' },
    fileSize: { type: 'integer', example: 204800 },
    filePath: { type: 'string', example: '/uploads/tasks/1/architecture-diagram.pdf' }
  }
};

module.exports = {
  '/tasks/{taskId}/attachments': {
    get: {
      tags: ['Attachments'], summary: 'List attachments for a task', operationId: 'listAttachments',
      parameters: [
        { name: 'taskId', in: 'path', required: true, schema: { type: 'integer' } },
        { $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }
      ],
      responses: { 200: { description: 'Attachment list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: schema } } } } } }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    post: {
      tags: ['Attachments'], summary: 'Register attachment metadata', operationId: 'createAttachment',
      description: 'Stores file attachment metadata (filename, path, size) for a task. Actual file upload must be handled separately.',
      parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: { required: true, content: { 'application/json': { schema: body } } },
      responses: { 201: s('Attachment created', schema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  },
  '/attachments/{id}': {
    get: {
      tags: ['Attachments'], summary: 'Get attachment by ID', operationId: 'getAttachment',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: s('Attachment details', schema), 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    delete: {
      tags: ['Attachments'], summary: 'Remove attachment', operationId: 'deleteAttachment',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: { description: 'Attachment removed' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  }
};
