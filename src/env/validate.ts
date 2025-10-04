import type { Schema, ValidationResult, ValidationIssue } from '../schema/types.js';
import { validateEnvValue, validatePattern } from './parseEnv.js';

/**
 * Validate environment variables against schema
 */
export function validateEnv(env: Record<string, string>, schema: Schema, options: {
  strict?: boolean;
  failOnWarn?: boolean;
} = {}): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const schemaKeys = Object.keys(schema.keys);
  const envKeys = Object.keys(env);

  // Check for missing required keys
  for (const [keyName, keyDef] of Object.entries(schema.keys)) {
    if (keyDef.required && !(keyName in env)) {
      errors.push({
        key: keyName,
        type: 'missing',
        message: 'Required key missing',
      });
    }
  }

  // Check for type errors and pattern mismatches
  for (const [keyName, value] of Object.entries(env)) {
    const keyDef = schema.keys[keyName];

    if (keyDef) {
      // Type validation
      const typeValidation = validateEnvValue(value, keyDef);
      if (!typeValidation.valid) {
        errors.push({
          key: keyName,
          type: 'type',
          message: typeValidation.error!,
        });
      }

      // Pattern validation
      if (keyDef.pattern) {
        const patternValidation = validatePattern(value, keyDef.pattern);
        if (!patternValidation.valid) {
          errors.push({
            key: keyName,
            type: 'pattern',
            message: patternValidation.error!,
          });
        }
      }

      // Check for deprecated keys
      if (keyDef.deprecated) {
        warnings.push({
          key: keyName,
          type: 'deprecated',
          message: keyDef.replacedBy
            ? `Deprecated. Use ${keyDef.replacedBy} instead`
            : 'This key is deprecated',
          replacedBy: keyDef.replacedBy,
        });
      }
    } else {
      // Unknown key
      const issue: ValidationIssue = {
        key: keyName,
        type: 'unknown',
        message: 'Unknown key not defined in schema',
      };

      if (options.strict) {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    }
  }

  const stats = {
    checked: envKeys.length,
    missing: errors.filter(e => e.type === 'missing').length,
    deprecated: warnings.filter(w => w.type === 'deprecated').length,
    unknown: warnings.filter(w => w.type === 'unknown').length,
  };

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const shouldFail = hasErrors || (options.failOnWarn && hasWarnings);

  return {
    ok: !shouldFail,
    errors,
    warnings,
    files: Object.keys(env),
    stats,
  };
}
