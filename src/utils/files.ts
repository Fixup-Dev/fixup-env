import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  return existsSync(resolve(filePath));
}

/**
 * Read file content safely
 */
export function readFile(filePath: string): string {
  try {
    return readFileSync(resolve(filePath), 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Write file content safely
 */
export function writeFile(filePath: string, content: string): void {
  try {
    writeFileSync(resolve(filePath), content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if .env is in .gitignore
 */
export function checkGitignore(): { ignored: boolean; message?: string } {
  if (!fileExists('.gitignore')) {
    return {
      ignored: false,
      message: '.gitignore file not found'
    };
  }

  const gitignoreContent = readFile('.gitignore');
  const envPatterns = ['.env', '.env.*', '.env.local'];

  for (const pattern of envPatterns) {
    if (gitignoreContent.includes(pattern)) {
      return { ignored: true };
    }
  }

  return {
    ignored: false,
    message: '.env files are not ignored in .gitignore'
  };
}
