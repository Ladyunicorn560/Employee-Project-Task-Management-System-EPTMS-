'use strict';

const schema = { $ref: '#/components/schemas/Comment' };
const s = (d, sc) => ({ description: d, content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: sc } } } } });
const body = {
  type: 'object', required: ['content'],
  properties: { content: { type: 'string', example: 'JWT config looks correct. Tested successfully.' } }
};

module.exports = {
  '/tasks/{taskId}/comments': {
    get: {
      tags: ['Comments'], summary: 'List comments on a task', operationId: 'listComments',
      parameters: [
        { name: 'taskId', in: 'path', required: true, schema: { type: 'integer' } },
        { $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }
      ],
      responses: { 200: { description: 'Comment list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: schema } } } } } }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    post: {
      tags: ['Comments'], summary: 'Add comment to task', operationId: 'createComment',
      description: 'Posts a comment on a task. Triggers a **Comment Added** notification to the task owner/reviewer.',
      parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: { required: true, content: { 'application/json': { schema: body } } },
      responses: { 201: s('Comment created', schema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  },
  '/comments/{id}': {
    get: {
      tags: ['Comments'], summary: 'Get comment by ID', operationId: 'getComment',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: s('Comment', schema), 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    put: {
      tags: ['Comments'], summary: 'Edit comment', operationId: 'updateComment',
      description: 'Only the comment author or an Administrator may edit a comment.',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: body } } },
      responses: { 200: s('Updated comment', schema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    delete: {
      tags: ['Comments'], summary: 'Delete comment', operationId: 'deleteComment',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: { description: 'Comment deleted' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  }
};
