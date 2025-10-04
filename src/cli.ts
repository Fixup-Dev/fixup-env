#!/usr/bin/env node

import { Command } from 'commander';
import { resolve } from 'path';
import { loadSchema } from './schema/loadSchema.js';
import { parseEnvFiles, getDefaultEnvPaths } from './env/parseEnv.js';
import { validateEnv } from './env/validate.js';
import { generateExampleFile } from './env/generateExample.js';
import { generateTypes } from './typesgen/generateTypes.js';
import { formatHuman } from './output/formatHuman.js';
import { formatJson } from './output/formatJson.js';
import { Logger } from './utils/logger.js';
import { checkGitignore } from './utils/files.js';

const program = new Command();
const logger = new Logger();

program
  .name('fixup-env')
  .description('A fast, zero-telemetry CLI tool for managing environment variables')
  .version('1.0.0');

// Check command
program
  .command('check')
  .description('Validate environment variables against schema')
  .option('-s, --schema <path>', 'Path to schema file', 'env.schema.ts')
  .option('-e, --env <paths...>', 'Environment file paths', getDefaultEnvPaths())
  .option('--json', 'Output JSON format')
  .option('--ci', 'CI mode (fail on warnings)')
  .option('--strict', 'Treat unknown keys as errors')
  .action(async (options) => {
    try {
      const schema = await loadSchema(options.schema);
      const { merged } = parseEnvFiles(options.env);

      const result = validateEnv(merged, schema, {
        strict: options.strict,
        failOnWarn: options.ci,
      });

      if (options.json) {
        console.log(formatJson(result));
      } else {
        logger.info(formatHuman(result));
      }

      // Check .gitignore
      const gitignoreCheck = checkGitignore();
      if (!gitignoreCheck.ignored) {
        logger.warn(`⚠️  ${gitignoreCheck.message}`);
      }

      process.exit(result.ok ? 0 : 1);
    } catch (error) {
      logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(2);
    }
  });

// Sync command
program
  .command('sync')
  .description('Sync environment variables to .env.example')
  .option('-s, --schema <path>', 'Path to schema file', 'env.schema.ts')
  .option('-e, --env <paths...>', 'Environment file paths', getDefaultEnvPaths())
  .option('--write-example', 'Write to .env.example file')
  .option('--prune-example', 'Remove deprecated keys from example')
  .action(async (options) => {
    try {
      const schema = await loadSchema(options.schema);

      if (options.writeExample) {
        generateExampleFile(schema, '.env.example', {
          pruneDeprecated: options.pruneExample,
        });
        logger.info('✓ Generated .env.example');
      } else {
        logger.info('Use --write-example to generate .env.example file');
      }
    } catch (error) {
      logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(2);
    }
  });

// Types command
program
  .command('types')
  .description('Generate TypeScript declaration file')
  .option('-s, --schema <path>', 'Path to schema file', 'env.schema.ts')
  .option('-o, --out <path>', 'Output file path', 'env.d.ts')
  .action(async (options) => {
    try {
      const schema = await loadSchema(options.schema);
      generateTypes(schema, options.out);
      logger.info(`✓ Generated ${options.out}`);
    } catch (error) {
      logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(2);
    }
  });

// Explain command
program
  .command('explain <key>')
  .description('Explain a specific environment variable')
  .option('-s, --schema <path>', 'Path to schema file', 'env.schema.ts')
  .action(async (key, options) => {
    try {
      const schema = await loadSchema(options.schema);
      const keyDef = schema.keys[key];

      if (!keyDef) {
        logger.error(`Key '${key}' not found in schema`);
        process.exit(1);
      }

      logger.info(`Key: ${key}`);
      logger.info(`Type: ${keyDef.type}`);
      if (keyDef.description) {
        logger.info(`Description: ${keyDef.description}`);
      }
      if (keyDef.default !== undefined) {
        logger.info(`Default: ${keyDef.default}`);
      }
      if (keyDef.example !== undefined) {
        logger.info(`Example: ${keyDef.example}`);
      }
      if (keyDef.enum) {
        logger.info(`Enum: ${keyDef.enum.join(', ')}`);
      }
      if (keyDef.deprecated) {
        logger.warn(`⚠️  Deprecated${keyDef.replacedBy ? ` (use ${keyDef.replacedBy})` : ''}`);
      }
    } catch (error) {
      logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(2);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize fixup-env in your project')
  .option('--typescript', 'Use TypeScript schema format')
  .option('--json', 'Use JSON schema format')
  .option('--no-example', 'Skip generating .env.example')
  .option('--no-types', 'Skip generating env.d.ts')
  .action(async (options) => {
    try {
      const schemaFormat = options.json ? 'json' : 'typescript';
      const generateExample = options.example !== false;
      const generateTypes = options.types !== false;

      // Generate schema file
      if (schemaFormat === 'typescript') {
        const schemaContent = generateTsSchemaTemplate();
        require('fs').writeFileSync('env.schema.ts', schemaContent);
        logger.info('✓ Created env.schema.ts');
      } else {
        const schemaContent = generateJsonSchemaTemplate();
        require('fs').writeFileSync('env.schema.json', schemaContent);
        logger.info('✓ Created env.schema.json');
      }

      // Generate .env.example
      if (generateExample) {
        const exampleContent = generateExampleTemplate();
        require('fs').writeFileSync('.env.example', exampleContent);
        logger.info('✓ Created .env.example');
      }

      // Generate env.d.ts
      if (generateTypes) {
        const typesContent = generateTypesTemplate();
        require('fs').writeFileSync('env.d.ts', typesContent);
        logger.info('✓ Created env.d.ts');
      }

      // Update package.json scripts
      updatePackageJsonScripts();
      logger.info('✓ Updated package.json scripts');

      logger.info('\n🎉 fixup-env initialized!');
      logger.info('Run "fixup-env check" to validate your environment variables.');
    } catch (error) {
      logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(2);
    }
  });

// Helper functions for init command
function generateTsSchemaTemplate(): string {
  return `import { z } from 'zod';

export default z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).describe('Runtime mode'),
  API_URL: z.string().url().describe('Public API endpoint'),
  PORT: z.number().int().min(1).max(65535).default(3000).describe('HTTP port'),
  FEATURE_X: z.enum(['on', 'off']).optional().describe('Toggle feature X'),
  SECRET_TOKEN: z.string().min(1).describe('Service token'),
});
`;
}

function generateJsonSchemaTemplate(): string {
  return JSON.stringify({
    properties: {
      NODE_ENV: {
        type: 'enum',
        enum: ['development', 'test', 'production'],
        description: 'Runtime mode',
        required: true,
      },
      API_URL: {
        type: 'url',
        description: 'Public API endpoint',
        required: true,
      },
      PORT: {
        type: 'port',
        description: 'HTTP port',
        default: 3000,
        required: true,
      },
      FEATURE_X: {
        type: 'enum',
        enum: ['on', 'off'],
        description: 'Toggle feature X',
        required: false,
      },
      SECRET_TOKEN: {
        type: 'string',
        description: 'Service token',
        required: true,
        secret: true,
      },
    },
  }, null, 2);
}

function generateExampleTemplate(): string {
  return `# Environment Variables
# Copy this file to .env and fill in your values

NODE_ENV=development
API_URL=https://api.example.com
PORT=3000
FEATURE_X=on
SECRET_TOKEN=your-secret-token-here
`;
}

function generateTypesTemplate(): string {
  return `// Generated by fixup-env
// Do not edit this file manually

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "test" | "production";
    API_URL: string;
    PORT: string;
    FEATURE_X?: "on" | "off";
    SECRET_TOKEN: string;
  }
}

export {};
`;
}

function updatePackageJsonScripts(): void {
  try {
    const packageJsonPath = resolve('package.json');
    const packageJson = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf-8'));

    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    packageJson.scripts['env:check'] = 'fixup-env check';
    packageJson.scripts['env:sync'] = 'fixup-env sync --write-example';
    packageJson.scripts['env:types'] = 'fixup-env types';
    packageJson.scripts['postinstall'] = 'fixup-env check --ci || true';

    require('fs').writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  } catch (error) {
    logger.warn('Could not update package.json scripts');
  }
}

program.parse();
