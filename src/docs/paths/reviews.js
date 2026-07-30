'use strict';

const schema = { $ref: '#/components/schemas/Review' };
const s = (d, sc) => ({ description: d, content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: sc } } } } });
const createBody = {
  type: 'object', required: ['status'],
  properties: {
    status:   { $ref: '#/components/schemas/ReviewStatus' },
    comments: { type: 'string', example: 'Implementation is correct and well-tested.', nullable: true }
  }
};

module.exports = {
  '/tasks/{taskId}/reviews': {
    get: {
      tags: ['Reviews'], summary: 'List reviews for a task', operationId: 'listReviews',
      parameters: [
        { name: 'taskId', in: 'path', required: true, schema: { type: 'integer' } },
        { $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }
      ],
      responses: { 200: { description: 'Review history', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: schema } } } } } }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    post: {
      tags: ['Reviews'], summary: 'Submit a review for a task', operationId: 'createReview',
      description: `Submits a review. Business rules:
- Only assigned reviewers (or Administrators) can review a task.
- Reviewers cannot review their own assigned tasks unless they are Administrators.
- Once a review reaches \`Approved\`, \`Rejected\`, or \`Changes Required\` status, it is **immutable**. A new review must be submitted for subsequent iterations.
- **Approved** → Task status automatically set to **Completed** in the same SQL transaction.
- **Changes Required** → Task status set to **Changes Required**.
- Triggers a **Review Requested** notification.

**Roles:** Reviewer, Administrator.`,
      parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: { required: true, content: { 'application/json': { schema: createBody } } },
      responses: { 201: s('Review submitted', schema), 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  },
  '/reviews/{id}': {
    get: {
      tags: ['Reviews'], summary: 'Get review by ID', operationId: 'getReview',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: s('Review details', schema), 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    put: {
      tags: ['Reviews'], summary: 'Update review (Pending status only)', operationId: 'updateReview',
      description: 'Can only update a review that is in **Pending** status. Finalized reviews (Approved, Rejected, Changes Required) are immutable.',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: { required: true, content: { 'application/json': { schema: createBody } } },
      responses: { 200: s('Updated review', schema), 400: { description: '400 – Review is already finalized and cannot be updated' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    },
    delete: {
      tags: ['Reviews'], summary: 'Soft-delete review', operationId: 'deleteReview',
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      responses: { 200: { description: 'Review deleted' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' } }
    }
  }
};
