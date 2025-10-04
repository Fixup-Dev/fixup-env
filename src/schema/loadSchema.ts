import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { Schema, SchemaKey } from './types.js';

/**
 * Load and parse a schema file (Zod TS or JSON)
 */
export async function loadSchema(schemaPath: string): Promise<Schema> {
  const fullPath = resolve(schemaPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Schema file not found: ${fullPath}`);
  }

  const ext = fullPath.split('.').pop()?.toLowerCase();

  if (ext === 'ts' || ext === 'js') {
    return loadZodSchema(fullPath);
  } else if (ext === 'json') {
    return loadJsonSchema(fullPath);
  } else {
    throw new Error(`Unsupported schema format: ${ext}. Use .ts/.js for Zod or .json for JSON schema`);
  }
}

/**
 * Load Zod schema from TypeScript/JavaScript file
 */
async function loadZodSchema(filePath: string): Promise<Schema> {
  try {
    // Dynamic import for TypeScript files
    const module = await import(filePath);
    const schema = (module.default || module.schema) as z.ZodObject<any>;

    if (!schema || !(schema instanceof z.ZodObject)) {
      throw new Error('Schema file must export a Zod object schema as default export');
    }

    const keys: Record<string, SchemaKey> = {};
    const shape = schema.shape;

    for (const [keyName, zodType] of Object.entries(shape)) {
      keys[keyName] = parseZodType(keyName, zodType as z.ZodTypeAny);
    }

    return {
      keys,
      source: 'zod',
      path: filePath,
    };
  } catch (error) {
    throw new Error(`Failed to load Zod schema: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Load JSON schema
 */
function loadJsonSchema(filePath: string): Schema {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const jsonSchema = JSON.parse(content);

    if (!jsonSchema.properties) {
      throw new Error('JSON schema must have a "properties" object');
    }

    const keys: Record<string, SchemaKey> = {};

    for (const [keyName, keyDef] of Object.entries(jsonSchema.properties as Record<string, any>)) {
      keys[keyName] = parseJsonKey(keyName, keyDef);
    }

    return {
      keys,
      source: 'json',
      path: filePath,
    };
  } catch (error) {
    throw new Error(`Failed to load JSON schema: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse a Zod type into our internal representation
 */
function parseZodType(keyName: string, zodType: z.ZodTypeAny): SchemaKey {
  const key: SchemaKey = {
    name: keyName,
    type: 'string',
    required: true,
    secret: false,
  };

  // Extract description
  if ('description' in zodType && typeof zodType.description === 'string') {
    key.description = zodType.description;
  }

  // Extract default value
  if ('_def' in zodType && zodType._def.defaultValue !== undefined) {
    key.default = zodType._def.defaultValue();
  }

    // Check if optional
    if (zodType instanceof z.ZodOptional || zodType instanceof z.ZodDefault) {
      key.required = false;
      const innerType = zodType instanceof z.ZodOptional ? zodType._def.innerType : zodType._def.innerType;
      return parseZodType(keyName, innerType as z.ZodTypeAny);
    }

  // Check for secret flag (custom meta)
  if ('_def' in zodType && zodType._def.meta && zodType._def.meta.secret) {
    key.secret = true;
  }

  // Determine type
  if (zodType instanceof z.ZodString) {
    key.type = 'string';

    // Check for URL validation
    if (zodType._def.checks?.some((check: any) => check.kind === 'url')) {
      key.type = 'url';
    }

    // Check for email validation
    if (zodType._def.checks?.some((check: any) => check.kind === 'email')) {
      key.type = 'email';
    }

    // Check for regex pattern
    const regexCheck = zodType._def.checks?.find((check: any) => check.kind === 'regex');
    if (regexCheck && 'regex' in regexCheck && regexCheck.regex) {
      key.pattern = regexCheck.regex.source;
    }
  } else if (zodType instanceof z.ZodNumber) {
    key.type = 'number';

    // Check for integer
    if (zodType._def.checks?.some((check: any) => check.kind === 'int')) {
      key.type = 'int';
    }

    // Check for port range
    const minCheck = zodType._def.checks?.find((check: any) => check.kind === 'min');
    const maxCheck = zodType._def.checks?.find((check: any) => check.kind === 'max');
    if (minCheck && 'value' in minCheck && minCheck.value === 1 &&
        maxCheck && 'value' in maxCheck && maxCheck.value === 65535) {
      key.type = 'port';
    }

    if (minCheck && 'value' in minCheck) key.min = minCheck.value;
    if (maxCheck && 'value' in maxCheck) key.max = maxCheck.value;
  } else if (zodType instanceof z.ZodBoolean) {
    key.type = 'boolean';
  } else if (zodType instanceof z.ZodEnum) {
    key.type = 'enum';
    key.enum = zodType._def.values;
  }

  return key;
}

/**
 * Parse a JSON schema key definition
 */
function parseJsonKey(keyName: string, keyDef: any): SchemaKey {
  const key: SchemaKey = {
    name: keyName,
    type: keyDef.type || 'string',
    required: !keyDef.optional,
    secret: keyDef.secret || false,
  };

  if (keyDef.description) key.description = keyDef.description;
  if (keyDef.default !== undefined) key.default = keyDef.default;
  if (keyDef.example !== undefined) key.example = keyDef.example;
  if (keyDef.enum) key.enum = keyDef.enum;
  if (keyDef.pattern) key.pattern = keyDef.pattern;
  if (keyDef.deprecated) key.deprecated = keyDef.deprecated;
  if (keyDef.replacedBy) key.replacedBy = keyDef.replacedBy;
  if (keyDef.min !== undefined) key.min = keyDef.min;
  if (keyDef.max !== undefined) key.max = keyDef.max;

  return key;
}
