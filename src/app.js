const express = require('express');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const { helmetMiddleware, corsMiddleware, globalRateLimiter } = require('./config/security');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./errors/errorHandler');
const NotFoundError = require('./errors/NotFoundError');
const apiRoutes = require('./routes');
const swaggerDefinition = require('./docs/swaggerDefinition');

const app = express();

// 1. HTTP Security Headers
app.use(helmetMiddleware);

// 2. Response Payload Compression
app.use(compression());

// 3. CORS Policy
app.use(corsMiddleware);

// 4. Request Logger & Correlation Tracking
app.use(requestLogger);

// 5. Rate Limiting
app.use(globalRateLimiter);

// 6. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 7. Swagger UI – OpenAPI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDefinition, {
  customSiteTitle: 'EPTMS API Documentation',
  customCss: '.swagger-ui .topbar { background-color: #1E40AF; }',
  swaggerOptions: { persistAuthorization: true, displayRequestDuration: true, docExpansion: 'list' }
}));

// 8. Serve raw OpenAPI JSON spec
app.get('/api-docs.json', (req, res) => res.json(swaggerDefinition));

// 9. Mount Master API Routes
app.use('/api/v1', apiRoutes);

// 10. 404 Route Handler
app.use((req, res, next) => {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
});

// 11. Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
