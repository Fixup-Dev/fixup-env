/**
 * Programmatic API for fixup-env
 */

export { loadSchema } from './schema/loadSchema.js';
export { parseEnvFiles, validateEnvValue, validatePattern } from './env/parseEnv.js';
export { validateEnv } from './env/validate.js';
export { generateExampleFile } from './env/generateExample.js';
export { generateTypes } from './typesgen/generateTypes.js';
export { formatHuman, formatEnvTable } from './output/formatHuman.js';
export { formatJson, redactSecrets } from './output/formatJson.js';
export { Logger } from './utils/logger.js';
export { redactSecret, redactSecrets as redactSecretsUtil } from './utils/redact.js';
export { fileExists, readFile, writeFile, checkGitignore } from './utils/files.js';
export { sortKeys, sortEnvKeys } from './utils/sortKeys.js';

export type { Schema, SchemaKey, ValidationResult, ValidationIssue } from './schema/types.js';
export type { EnvFile, ParsedEnv } from './env/parseEnv.js';
