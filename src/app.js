const express = require('express');
const compression = require('compression');
const { helmetMiddleware, corsMiddleware, globalRateLimiter } = require('./config/security');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./errors/errorHandler');
const NotFoundError = require('./errors/NotFoundError');
const apiRoutes = require('./routes');

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

// 7. Mount Master API Routes
app.use('/api/v1', apiRoutes);

// 8. 404 Route Handler
app.use((req, res, next) => {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
});

// 9. Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
