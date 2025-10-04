import { writeFileSync } from 'fs';
import type { Schema } from '../schema/types.js';

/**
 * Generate .env.example file from schema
 */
export function generateExampleFile(schema: Schema, outputPath: string, options: {
  pruneDeprecated?: boolean;
} = {}): void {
  const lines: string[] = [];

  // Sort keys: required first, then optional, then deprecated
  const sortedKeys = Object.entries(schema.keys)
    .filter(([_, keyDef]) => !options.pruneDeprecated || !keyDef.deprecated)
    .sort(([_, a], [__, b]) => {
      if (a.required !== b.required) {
        return a.required ? -1 : 1;
      }
      if (a.deprecated !== b.deprecated) {
        return a.deprecated ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });

  for (const [keyName, keyDef] of sortedKeys) {
    // Add description as comment
    if (keyDef.description) {
      lines.push(`# ${keyDef.description}`);
    }

    // Add type info
    const typeInfo = getTypeInfo(keyDef);
    if (typeInfo) {
      lines.push(`# Type: ${typeInfo}`);
    }

    // Add example or default
    const exampleValue = getExampleValue(keyDef);
    lines.push(`${keyName}=${exampleValue}`);

    // Add spacing between keys
    lines.push('');
  }

  // Remove trailing empty line
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }

  const content = lines.join('\n');
  writeFileSync(outputPath, content, 'utf-8');
}

/**
 * Get type information string for a key
 */
function getTypeInfo(keyDef: Schema['keys'][string]): string | null {
  const parts: string[] = [];

  if (keyDef.type !== 'string') {
    parts.push(keyDef.type);
  }

  if (keyDef.enum) {
    parts.push(`enum: [${keyDef.enum.join(', ')}]`);
  }

  if (keyDef.pattern) {
    parts.push(`pattern: ${keyDef.pattern}`);
  }

  if (keyDef.min !== undefined || keyDef.max !== undefined) {
    const range = [];
    if (keyDef.min !== undefined) range.push(`min: ${keyDef.min}`);
    if (keyDef.max !== undefined) range.push(`max: ${keyDef.max}`);
    parts.push(`range: ${range.join(', ')}`);
  }

  if (keyDef.required === false) {
    parts.push('optional');
  }

  if (keyDef.deprecated) {
    parts.push('deprecated');
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Get example value for a key
 */
function getExampleValue(keyDef: Schema['keys'][string]): string {
  // Use example if provided
  if (keyDef.example !== undefined) {
    return String(keyDef.example);
  }

  // Use default if provided
  if (keyDef.default !== undefined) {
    return String(keyDef.default);
  }

  // Generate based on type
  switch (keyDef.type) {
    case 'string':
      return keyDef.enum ? keyDef.enum[0] : 'your-value-here';
    case 'number':
    case 'int':
      return keyDef.min !== undefined ? String(keyDef.min) : '123';
    case 'boolean':
      return 'true';
    case 'url':
      return 'https://api.example.com';
    case 'email':
      return 'user@example.com';
    case 'enum':
      return keyDef.enum?.[0] || 'option1';
    case 'port':
      return '3000';
    default:
      return '';
  }
}
