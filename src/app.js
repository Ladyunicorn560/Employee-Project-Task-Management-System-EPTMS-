const express = require('express');
const { helmetMiddleware, corsMiddleware, globalRateLimiter } = require('./config/security');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./errors/errorHandler');
const NotFoundError = require('./errors/NotFoundError');
const apiRoutes = require('./routes');

const app = express();

// 1. HTTP Security Headers
app.use(helmetMiddleware);

// 2. CORS Policy
app.use(corsMiddleware);

// 3. Request Logger
app.use(requestLogger);

// 4. Rate Limiting
app.use(globalRateLimiter);

// 5. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Mount Master API Routes
app.use('/api/v1', apiRoutes);

// 7. 404 Route Handler
app.use((req, res, next) => {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
});

// 8. Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
