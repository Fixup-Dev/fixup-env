/**
 * Redact secret values in strings
 */
export function redactSecret(value: string): string {
  if (!value) return value;

  // Show first and last character for short values
  if (value.length <= 4) {
    return '•'.repeat(value.length);
  }

  // Show first 2 and last 2 characters for longer values
  return value.slice(0, 2) + '•'.repeat(value.length - 4) + value.slice(-2);
}

/**
 * Redact secret values in objects
 */
export function redactSecrets(obj: Record<string, any>, secretKeys: string[]): Record<string, any> {
  const redacted: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (secretKeys.includes(key) && typeof value === 'string') {
      redacted[key] = redactSecret(value);
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSecrets(value, secretKeys);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}
