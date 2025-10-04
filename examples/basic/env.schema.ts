import { z } from 'zod';

export default z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).describe('Runtime mode'),
  API_URL: z.string().url().describe('Public API endpoint'),
  PORT: z.number().int().min(1).max(65535).default(3000).describe('HTTP port'),
  FEATURE_X: z.enum(['on', 'off']).optional().describe('Toggle feature X'),
  SECRET_TOKEN: z.string().min(1).describe('Service token'),
  DATABASE_URL: z.string().url().describe('Database connection string'),
  DEBUG: z.boolean().optional().describe('Enable debug logging'),
});
