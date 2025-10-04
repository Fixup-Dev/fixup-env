import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';
import { parseEnvFiles, validateEnvValue } from '../src/env/parseEnv.js';

describe('Environment parsing', () => {
  const testDir = resolve(__dirname, 'fixtures');

  beforeEach(() => {
    if (!existsSync(testDir)) {
      require('fs').mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    try {
      if (existsSync(resolve(testDir, '.env'))) {
        unlinkSync(resolve(testDir, '.env'));
      }
      if (existsSync(resolve(testDir, '.env.local'))) {
        unlinkSync(resolve(testDir, '.env.local'));
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should parse basic environment file', () => {
    writeFileSync(resolve(testDir, '.env'), 'NODE_ENV=development\nPORT=3000');

    const result = parseEnvFiles([resolve(testDir, '.env')]);

    expect(result.files).toHaveLength(1);
    expect(result.files[0].exists).toBe(true);
    expect(result.merged).toEqual({
      NODE_ENV: 'development',
      PORT: '3000',
    });
  });

  it('should handle missing files', () => {
    const result = parseEnvFiles([resolve(testDir, '.env')]);

    expect(result.files).toHaveLength(1);
    expect(result.files[0].exists).toBe(false);
    expect(result.merged).toEqual({});
  });

  it('should merge multiple files', () => {
    writeFileSync(resolve(testDir, '.env'), 'NODE_ENV=development\nPORT=3000');
    writeFileSync(resolve(testDir, '.env.local'), 'PORT=4000\nDEBUG=true');

    const result = parseEnvFiles([
      resolve(testDir, '.env'),
      resolve(testDir, '.env.local'),
    ]);

    expect(result.files).toHaveLength(2);
    expect(result.merged).toEqual({
      NODE_ENV: 'development',
      PORT: '4000', // Overridden by .env.local
      DEBUG: 'true',
    });
  });

  it('should handle quoted values', () => {
    writeFileSync(resolve(testDir, '.env'), 'MESSAGE="Hello World"\nPATH=/usr/bin');

    const result = parseEnvFiles([resolve(testDir, '.env')]);

    expect(result.merged).toEqual({
      MESSAGE: 'Hello World',
      PATH: '/usr/bin',
    });
  });

  it('should handle comments', () => {
    writeFileSync(resolve(testDir, '.env'), '# This is a comment\nNODE_ENV=development\n# Another comment');

    const result = parseEnvFiles([resolve(testDir, '.env')]);

    expect(result.merged).toEqual({
      NODE_ENV: 'development',
    });
  });
});

describe('Environment validation', () => {
  it('should validate string values', () => {
    const result = validateEnvValue('hello', {
      name: 'TEST',
      type: 'string',
      required: true,
      secret: false,
    });

    expect(result.valid).toBe(true);
  });

  it('should validate number values', () => {
    const result = validateEnvValue('123', {
      name: 'PORT',
      type: 'number',
      required: true,
      secret: false,
    });

    expect(result.valid).toBe(true);
  });

  it('should reject invalid numbers', () => {
    const result = validateEnvValue('abc', {
      name: 'PORT',
      type: 'number',
      required: true,
      secret: false,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Expected number');
  });

  it('should validate boolean values', () => {
    const validBooleans = ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'];

    for (const value of validBooleans) {
      const result = validateEnvValue(value, {
        name: 'DEBUG',
        type: 'boolean',
        required: true,
        secret: false,
      });

      expect(result.valid).toBe(true);
    }
  });

  it('should reject invalid booleans', () => {
    const result = validateEnvValue('maybe', {
      name: 'DEBUG',
      type: 'boolean',
      required: true,
      secret: false,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Expected boolean');
  });

  it('should validate URLs', () => {
    const result = validateEnvValue('https://api.example.com', {
      name: 'API_URL',
      type: 'url',
      required: true,
      secret: false,
    });

    expect(result.valid).toBe(true);
  });

  it('should reject invalid URLs', () => {
    const result = validateEnvValue('not-a-url', {
      name: 'API_URL',
      type: 'url',
      required: true,
      secret: false,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Expected valid URL');
  });

  it('should validate email addresses', () => {
    const result = validateEnvValue('user@example.com', {
      name: 'EMAIL',
      type: 'email',
      required: true,
      secret: false,
    });

    expect(result.valid).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    const result = validateEnvValue('not-an-email', {
      name: 'EMAIL',
      type: 'email',
      required: true,
      secret: false,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Expected valid email');
  });

  it('should validate enum values', () => {
    const result = validateEnvValue('development', {
      name: 'NODE_ENV',
      type: 'enum',
      enum: ['development', 'test', 'production'],
      required: true,
      secret: false,
    });

    expect(result.valid).toBe(true);
  });

  it('should reject invalid enum values', () => {
    const result = validateEnvValue('staging', {
      name: 'NODE_ENV',
      type: 'enum',
      enum: ['development', 'test', 'production'],
      required: true,
      secret: false,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Expected one of');
  });

  it('should validate port numbers', () => {
    const result = validateEnvValue('3000', {
      name: 'PORT',
      type: 'port',
      required: true,
      secret: false,
    });

    expect(result.valid).toBe(true);
  });

  it('should reject invalid port numbers', () => {
    const result = validateEnvValue('99999', {
      name: 'PORT',
      type: 'port',
      required: true,
      secret: false,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Expected port number');
  });

  it('should validate required keys', () => {
    const result = validateEnvValue('', {
      name: 'REQUIRED_KEY',
      type: 'string',
      required: true,
      secret: false,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Required key missing');
  });

  it('should allow empty values for optional keys', () => {
    const result = validateEnvValue('', {
      name: 'OPTIONAL_KEY',
      type: 'string',
      required: false,
      secret: false,
    });

    expect(result.valid).toBe(true);
  });
});
