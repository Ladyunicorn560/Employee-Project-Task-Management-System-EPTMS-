const dotenv = require('dotenv');
const path = require('path');
const { z } = require('zod');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Define environment schema with Zod validation
const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database Configuration
  DB_SERVER: z.string({ required_error: 'DB_SERVER environment variable is required' }),
  DB_NAME: z.string({ required_error: 'DB_NAME environment variable is required' }),
  DB_TRUST_SERVER_CERTIFICATE: z.string().optional().default('true').transform((val) => val === 'true'),
  DB_ENCRYPT: z.string().optional().default('false').transform((val) => val === 'true'),
  DB_USER: z.string().optional().default(''),
  DB_PASSWORD: z.string().optional().default(''),
  
  // JWT Configuration
  JWT_SECRET: z.string().default('default_jwt_secret_key_change_me_in_production'),
  JWT_EXPIRES_IN: z.string().default('8h'),

  // CORS & Security
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform((val) => parseInt(val, 10)),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info')
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid environment variable configuration:');
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

module.exports = result.data;
