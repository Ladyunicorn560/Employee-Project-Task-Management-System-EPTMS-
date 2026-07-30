'use strict';

module.exports = {
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'API health check',
      description: 'Returns the current health status of the API server and SQL Server database connection.',
      security: [],
      operationId: 'getHealth',
      responses: {
        200: {
          description: 'API and database are healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success:   { type: 'boolean', example: true },
                  status:    { type: 'integer', example: 200 },
                  message:   { type: 'string',  example: 'EPTMS Backend API is operating normally' },
                  timestamp: { type: 'string',  format: 'date-time' },
                  services: {
                    type: 'object',
                    properties: {
                      server:   { type: 'string', example: 'UP' },
                      database: { type: 'string', example: 'UP' },
                      details: {
                        type: 'object',
                        properties: {
                          serverName:   { type: 'string', example: 'Shiksha' },
                          databaseName: { type: 'string', example: 'EPTMS_DB' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        503: { description: 'Service Unavailable – database unreachable' }
      }
    }
  }
};
