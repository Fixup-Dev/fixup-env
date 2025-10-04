import kleur from 'kleur';
import type { ValidationResult, ValidationIssue } from '../schema/types.js';

/**
 * Format validation results for human-readable TTY output
 */
export function formatHuman(result: ValidationResult, options: {
  showSecrets?: boolean;
} = {}): string {
  const lines: string[] = [];

  // Header
  if (result.ok) {
    lines.push(kleur.green('✓ Environment validation passed'));
  } else {
    lines.push(kleur.red('✗ Environment validation failed'));
  }

  lines.push('');

  // Files checked
  if (result.files.length > 0) {
    lines.push(kleur.blue('Files checked:'));
    for (const file of result.files) {
      lines.push(`  ${kleur.gray('•')} ${file}`);
    }
    lines.push('');
  }

  // Errors
  if (result.errors.length > 0) {
    lines.push(kleur.red('Errors:'));
    for (const error of result.errors) {
      lines.push(`  ${kleur.red('✗')} ${kleur.bold(error.key)}: ${error.message}`);
    }
    lines.push('');
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push(kleur.yellow('Warnings:'));
    for (const warning of result.warnings) {
      const icon = warning.type === 'deprecated' ? '⚠' : '!';
      lines.push(`  ${kleur.yellow(icon)} ${kleur.bold(warning.key)}: ${warning.message}`);
      if (warning.replacedBy) {
        lines.push(`    ${kleur.gray('→ Use')} ${kleur.blue(warning.replacedBy)} ${kleur.gray('instead')}`);
      }
    }
    lines.push('');
  }

  // Summary
  const summary = formatSummary(result.stats);
  if (summary) {
    lines.push(summary);
  }

  return lines.join('\n');
}

/**
 * Format a summary of validation results
 */
function formatSummary(stats: ValidationResult['stats']): string {
  const parts: string[] = [];

  if (stats.checked > 0) {
    parts.push(`${stats.checked} key${stats.checked === 1 ? '' : 's'} checked`);
  }

  if (stats.missing > 0) {
    parts.push(`${kleur.red(stats.missing.toString())} missing`);
  }

  if (stats.deprecated > 0) {
    parts.push(`${kleur.yellow(stats.deprecated.toString())} deprecated`);
  }

  if (stats.unknown > 0) {
    parts.push(`${kleur.yellow(stats.unknown.toString())} unknown`);
  }

  if (parts.length === 0) {
    return '';
  }

  return kleur.gray(`Summary: ${parts.join(', ')}`);
}

/**
 * Format a table of environment variables
 */
export function formatEnvTable(env: Record<string, string>, schema: any, options: {
  showSecrets?: boolean;
} = {}): string {
  const lines: string[] = [];

  lines.push(kleur.bold('Environment Variables:'));
  lines.push('');

  // Table header
  const header = 'Key'.padEnd(20) + 'Type'.padEnd(12) + 'Status'.padEnd(10) + 'Note';
  lines.push(kleur.blue(header));
  lines.push(kleur.blue('─'.repeat(header.length)));

  // Sort keys
  const sortedKeys = Object.keys(env).sort();

  for (const key of sortedKeys) {
    const value = env[key];
    const keyDef = schema.keys?.[key];

    const keyCol = key.padEnd(20);
    const typeCol = (keyDef?.type || 'string').padEnd(12);

    let status = kleur.green('✓ set');
    let note = '';

    if (keyDef) {
      if (keyDef.deprecated) {
        status = kleur.yellow('⚠ deprecated');
        note = keyDef.replacedBy ? `Use ${keyDef.replacedBy}` : 'Deprecated';
      }
    } else {
      status = kleur.yellow('! unknown');
      note = 'Not in schema';
    }

    const statusCol = status.padEnd(10);
    const noteCol = note;

    lines.push(`${keyCol}${typeCol}${statusCol}${noteCol}`);
  }

  return lines.join('\n');
}
