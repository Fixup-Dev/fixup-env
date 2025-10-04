/**
 * Sort keys for consistent output
 */
export function sortKeys<T extends Record<string, any>>(obj: T): T {
  const sortedKeys = Object.keys(obj).sort();
  const sorted: any = {};

  for (const key of sortedKeys) {
    sorted[key] = obj[key];
  }

  return sorted as T;
}

/**
 * Sort environment variables by priority: required first, then optional, then deprecated
 */
export function sortEnvKeys(keys: string[], schema: Record<string, any>): string[] {
  return keys.sort((a, b) => {
    const aDef = schema[a];
    const bDef = schema[b];

    // Required keys first
    if (aDef?.required !== bDef?.required) {
      return aDef?.required ? -1 : 1;
    }

    // Deprecated keys last
    if (aDef?.deprecated !== bDef?.deprecated) {
      return aDef?.deprecated ? 1 : -1;
    }

    // Alphabetical within each group
    return a.localeCompare(b);
  });
}
