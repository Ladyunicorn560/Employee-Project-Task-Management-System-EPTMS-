'use strict';

const schema = { $ref: '#/components/schemas/Notification' };
const s = (d, sc) => ({ description: d, content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: sc } } } } });

module.exports = {
  '/notifications': {
    get: {
      tags: ['Notifications'], summary: 'List notifications for current user', operationId: 'listNotifications',
      description: 'Returns notifications for the authenticated user. Administrators can optionally view all notifications.',
      parameters: [
        { $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' },
        { name: 'isRead', in: 'query', schema: { type: 'boolean' }, description: 'Filter by read status' },
        { name: 'type',   in: 'query', schema: { type: 'string'  }, description: 'Filter by notification type' }
      ],
      responses: { 200: { description: 'Notification list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, total: { type: 'integer' }, data: { type: 'array', items: schema } } } } } }, 401: { $ref: '#/components/responses/Unauthorized' } }
    }
  },
  '/notifications/{id}': {
    get: {
      tags: ['Notifications'], summary: 'Get notification by ID', operationId: 'getNotification',
      description: 'Users can only access their own notifications.',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: s('Notification', schema), 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  },
  '/notifications/{id}/read': {
    patch: {
      tags: ['Notifications'], summary: 'Mark notification as read', operationId: 'markNotificationRead',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: { description: 'Notification marked as read' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  },
  '/notifications/read-all': {
    patch: {
      tags: ['Notifications'], summary: 'Mark all notifications as read', operationId: 'markAllNotificationsRead',
      description: 'Marks all unread notifications for the current user as read.',
      responses: { 200: { description: '200 OK – All notifications marked as read', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, count: { type: 'integer' } } } } } }, 401: { $ref: '#/components/responses/Unauthorized' } }
    }
  }
};
