import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';
import { loadSchema } from '../src/schema/loadSchema.js';
import { parseEnvFiles } from '../src/env/parseEnv.js';
import { validateEnv } from '../src/env/validate.js';

describe('Environment validation', () => {
  const testDir = resolve(__dirname, 'fixtures');

  beforeEach(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      require('fs').mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    try {
      if (existsSync(resolve(testDir, 'env.schema.ts'))) {
        unlinkSync(resolve(testDir, 'env.schema.ts'));
      }
      if (existsSync(resolve(testDir, '.env'))) {
        unlinkSync(resolve(testDir, '.env'));
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should validate required keys', async () => {
    // Create schema
    const schemaContent = `
import { z } from 'zod';
export default z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).describe('Runtime mode'),
  API_URL: z.string().url().describe('Public API endpoint'),
  PORT: z.number().int().min(1).max(65535).default(3000).describe('HTTP port'),
});
`;
    writeFileSync(resolve(testDir, 'env.schema.ts'), schemaContent);

    // Create env file with missing required key
    writeFileSync(resolve(testDir, '.env'), 'NODE_ENV=development\nPORT=3000');

    const schema = await loadSchema(resolve(testDir, 'env.schema.ts'));
    const { merged } = parseEnvFiles([resolve(testDir, '.env')]);
    const result = validateEnv(merged, schema);

    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].key).toBe('API_URL');
    expect(result.errors[0].type).toBe('missing');
  });

  it('should validate type errors', async () => {
    const schemaContent = `
import { z } from 'zod';
export default z.object({
  PORT: z.number().int().min(1).max(65535).describe('HTTP port'),
  DEBUG: z.boolean().describe('Debug mode'),
});
`;
    writeFileSync(resolve(testDir, 'env.schema.ts'), schemaContent);

    writeFileSync(resolve(testDir, '.env'), 'PORT=abc\nDEBUG=maybe');

    const schema = await loadSchema(resolve(testDir, 'env.schema.ts'));
    const { merged } = parseEnvFiles([resolve(testDir, '.env')]);
    const result = validateEnv(merged, schema);

    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].type).toBe('type');
    expect(result.errors[1].type).toBe('type');
  });

  it('should validate enum values', async () => {
    const schemaContent = `
import { z } from 'zod';
export default z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).describe('Runtime mode'),
});
`;
    writeFileSync(resolve(testDir, 'env.schema.ts'), schemaContent);

    writeFileSync(resolve(testDir, '.env'), 'NODE_ENV=staging');

    const schema = await loadSchema(resolve(testDir, 'env.schema.ts'));
    const { merged } = parseEnvFiles([resolve(testDir, '.env')]);
    const result = validateEnv(merged, schema);

    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('type');
  });

  it('should handle optional keys', async () => {
    const schemaContent = `
import { z } from 'zod';
export default z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).describe('Runtime mode'),
  DEBUG: z.boolean().optional().describe('Debug mode'),
});
`;
    writeFileSync(resolve(testDir, 'env.schema.ts'), schemaContent);

    writeFileSync(resolve(testDir, '.env'), 'NODE_ENV=development');

    const schema = await loadSchema(resolve(testDir, 'env.schema.ts'));
    const { merged } = parseEnvFiles([resolve(testDir, '.env')]);
    const result = validateEnv(merged, schema);

    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect unknown keys', async () => {
    const schemaContent = `
import { z } from 'zod';
export default z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).describe('Runtime mode'),
});
`;
    writeFileSync(resolve(testDir, 'env.schema.ts'), schemaContent);

    writeFileSync(resolve(testDir, '.env'), 'NODE_ENV=development\nUNKNOWN_KEY=value');

    const schema = await loadSchema(resolve(testDir, 'env.schema.ts'));
    const { merged } = parseEnvFiles([resolve(testDir, '.env')]);
    const result = validateEnv(merged, schema);

    expect(result.ok).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].key).toBe('UNKNOWN_KEY');
    expect(result.warnings[0].type).toBe('unknown');
  });

  it('should handle strict mode', async () => {
    const schemaContent = `
import { z } from 'zod';
export default z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).describe('Runtime mode'),
});
`;
    writeFileSync(resolve(testDir, 'env.schema.ts'), schemaContent);

    writeFileSync(resolve(testDir, '.env'), 'NODE_ENV=development\nUNKNOWN_KEY=value');

    const schema = await loadSchema(resolve(testDir, 'env.schema.ts'));
    const { merged } = parseEnvFiles([resolve(testDir, '.env')]);
    const result = validateEnv(merged, schema, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].key).toBe('UNKNOWN_KEY');
    expect(result.errors[0].type).toBe('unknown');
  });
});
