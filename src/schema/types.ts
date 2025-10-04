/**
 * Internal schema representation that unifies Zod and JSON schemas
 */
export interface SchemaKey {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'url' | 'email' | 'enum' | 'int' | 'port';
  description?: string;
  default?: string | number | boolean;
  example?: string | number | boolean;
  enum?: string[];
  pattern?: string;
  required: boolean;
  secret: boolean;
  deprecated?: boolean;
  replacedBy?: string;
  min?: number;
  max?: number;
}

export interface Schema {
  keys: Record<string, SchemaKey>;
  source: 'zod' | 'json';
  path: string;
}

export interface ValidationIssue {
  key: string;
  type: 'missing' | 'type' | 'unknown' | 'deprecated' | 'pattern';
  message: string;
  replacedBy?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  files: string[];
  stats: {
    checked: number;
    missing: number;
    deprecated: number;
    unknown: number;
  };
}
