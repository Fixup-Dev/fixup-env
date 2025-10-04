import { parse } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { Schema } from '../schema/types.js';

export interface EnvFile {
  path: string;
  exists: boolean;
  content: Record<string, string>;
}

export interface ParsedEnv {
  files: EnvFile[];
  merged: Record<string, string>;
}

/**
 * Parse environment files with dotenv compatibility
 */
export function parseEnvFiles(envPaths: string[]): ParsedEnv {
  const files: EnvFile[] = [];
  const merged: Record<string, string> = {};

  for (const envPath of envPaths) {
    const fullPath = resolve(envPath);
    const exists = existsSync(fullPath);

    let content: Record<string, string> = {};

    if (exists) {
      try {
        const fileContent = readFileSync(fullPath, 'utf-8');
        content = parse(fileContent);
      } catch (error) {
        throw new Error(`Failed to parse ${envPath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    files.push({
      path: fullPath,
      exists,
      content,
    });

    // Merge content (later files override earlier ones)
    Object.assign(merged, content);
  }

  return { files, merged };
}

/**
 * Get default environment file paths
 */
export function getDefaultEnvPaths(): string[] {
  return [
    '.env',
    '.env.local',
    '.env.development',
    '.env.test',
    '.env.production',
  ];
}

/**
 * Validate environment variable value against schema type
 */
export function validateEnvValue(value: string, keyDef: Schema['keys'][string]): { valid: boolean; error?: string } {
  if (!value && keyDef.required) {
    return { valid: false, error: 'Required key missing' };
  }

  if (!value) {
    return { valid: true };
  }

  switch (keyDef.type) {
    case 'string':
      return { valid: true };

    case 'number':
    case 'int':
      const num = Number(value);
      if (isNaN(num)) {
        return { valid: false, error: `Expected number, got "${value}"` };
      }
      if (keyDef.type === 'int' && !Number.isInteger(num)) {
        return { valid: false, error: `Expected integer, got "${value}"` };
      }
      if (keyDef.min !== undefined && num < keyDef.min) {
        return { valid: false, error: `Value ${num} is below minimum ${keyDef.min}` };
      }
      if (keyDef.max !== undefined && num > keyDef.max) {
        return { valid: false, error: `Value ${num} is above maximum ${keyDef.max}` };
      }
      return { valid: true };

    case 'boolean':
      const lowerValue = value.toLowerCase();
      if (!['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'].includes(lowerValue)) {
        return { valid: false, error: `Expected boolean, got "${value}"` };
      }
      return { valid: true };

    case 'url':
      try {
        new URL(value);
        return { valid: true };
      } catch {
        return { valid: false, error: `Expected valid URL, got "${value}"` };
      }

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { valid: false, error: `Expected valid email, got "${value}"` };
      }
      return { valid: true };

    case 'enum':
      if (!keyDef.enum?.includes(value)) {
        return { valid: false, error: `Expected one of [${keyDef.enum?.join(', ')}], got "${value}"` };
      }
      return { valid: true };

    case 'port':
      const port = Number(value);
      if (isNaN(port) || !Number.isInteger(port) || port < 1 || port > 65535) {
        return { valid: false, error: `Expected port number (1-65535), got "${value}"` };
      }
      return { valid: true };

    default:
      return { valid: true };
  }
}

/**
 * Check if a value matches a regex pattern
 */
export function validatePattern(value: string, pattern: string): { valid: boolean; error?: string } {
  try {
    const regex = new RegExp(pattern);
    if (!regex.test(value)) {
      return { valid: false, error: `Value does not match pattern: ${pattern}` };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: `Invalid regex pattern: ${pattern}` };
  }
}
