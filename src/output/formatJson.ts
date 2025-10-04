import type { ValidationResult } from '../schema/types.js';

/**
 * Format validation results as JSON for machine-readable output
 */
export function formatJson(result: ValidationResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Redact secret values from JSON output
 */
export function redactSecrets(obj: any, schema: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSecrets(item, schema));
  }

  const redacted: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const keyDef = schema.keys?.[key];

    if (keyDef?.secret && typeof value === 'string') {
      redacted[key] = '<redacted>';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSecrets(value, schema);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}
