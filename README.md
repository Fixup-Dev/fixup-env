# fixup-env

[![CI](https://github.com/fixup/tools/workflows/CI/badge.svg)](https://github.com/fixup/tools/actions)
[![npm](https://img.shields.io/npm/v/fixup-env)](https://www.npmjs.com/package/fixup-env)
[![License: PolyForm Internal Use](https://img.shields.io/badge/License-PolyForm%20Internal%20Use-blue.svg)](https://polyformproject.org/licenses/internal-use/1.0.0/)

A fast, zero-telemetry CLI tool for managing environment variables in JavaScript/TypeScript projects.

## Why fixup-env?

- **🔒 Zero telemetry** - No network calls, no data collection
- **⚡ Fast** - Built with performance in mind
- **🎯 Type-safe** - Generate TypeScript declarations from your schema
- **🔧 Flexible** - Support for both Zod and JSON schemas
- **🛡️ Secure** - Never logs secret values
- **📦 Small** - Single file output, no native dependencies

## Quick Start

```bash
# Install fixup-env
npm install fixup-env

# Or with pnpm
pnpm add fixup-env

# Or with yarn
yarn add fixup-env

# Initialize fixup-env in a project
npx fixup-env init

# Validate your environment variables
npx fixup-env check

# Generate .env.example file
npx fixup-env sync --write-example

# Generate TypeScript types
npx fixup-env types

# Get explanation about a specific environment variable
npx fixup-env explain API_URL
```

## Development Workflow

```bash
# For development (if working on the tool itself)
pnpm build
pnpm cli check

# For using the tool in projects
npx fixup-env check
```

## Features

### Schema Support

**TypeScript (Zod):**
```typescript
// env.schema.ts
import { z } from 'zod';

export default z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).describe('Runtime mode'),
  API_URL: z.string().url().describe('Public API endpoint'),
  PORT: z.number().int().min(1).max(65535).default(3000).describe('HTTP port'),
  FEATURE_X: z.enum(['on', 'off']).optional().describe('Toggle feature X'),
  SECRET_TOKEN: z.string().min(1).describe('Service token'),
});
```

**JSON Schema:**
```json
{
  "properties": {
    "NODE_ENV": {
      "type": "enum",
      "enum": ["development", "test", "production"],
      "description": "Runtime mode",
      "required": true
    },
    "API_URL": {
      "type": "url",
      "description": "Public API endpoint",
      "required": true
    },
    "PORT": {
      "type": "port",
      "description": "HTTP port",
      "default": 3000,
      "required": true
    },
    "FEATURE_X": {
      "type": "enum",
      "enum": ["on", "off"],
      "description": "Toggle feature X",
      "required": false
    },
    "SECRET_TOKEN": {
      "type": "string",
      "description": "Service token",
      "required": true,
      "secret": true
    }
  }
}
```

### Commands

#### `fixup-env check`
Validate environment variables against your schema.

```bash
# Basic check
fixup-env check

# With custom schema and env files
fixup-env check --schema env.schema.ts --env .env .env.local

# JSON output for CI
fixup-env check --json

# Strict mode (unknown keys are errors)
fixup-env check --strict

# CI mode (fail on warnings)
fixup-env check --ci
```

#### `fixup-env sync`
Sync your schema to `.env.example`.

```bash
# Generate .env.example
fixup-env sync --write-example

# Remove deprecated keys
fixup-env sync --write-example --prune-example
```

#### `fixup-env types`
Generate TypeScript declarations.

```bash
# Generate env.d.ts
fixup-env types

# Custom output file
fixup-env types --out types/env.d.ts
```

#### `fixup-env explain`
Get information about a specific environment variable.

```bash
fixup-env explain API_URL
```

#### `fixup-env init`
Initialize fixup-env in your project.

```bash
# Interactive setup
fixup-env init

# TypeScript schema
fixup-env init --typescript

# JSON schema
fixup-env init --json
```

## Practical Use Cases

### 1. **Project Setup**
```bash
# In a new project
npx fixup-env init --typescript
# This creates:
# - env.schema.ts (Zod schema)
# - .env.example
# - env.d.ts (TypeScript types)
# - package.json scripts
```

### 2. **Environment Validation**
```bash
# Validate your .env files
npx fixup-env check

# With custom schema
npx fixup-env check --schema my-schema.ts

# For CI/CD (JSON output)
npx fixup-env check --json --ci
```

### 3. **Schema Management**
```typescript
// env.schema.ts
import { z } from 'zod';

export default z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  API_URL: z.string().url(),
  PORT: z.number().int().min(1).max(65535).default(3000),
  SECRET_TOKEN: z.string().min(1),
});
```

## CI Integration

### GitHub Actions

```yaml
name: Check Environment
on: [push, pull_request]

jobs:
  env-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx fixup-env check --ci
```

### Package.json Scripts

```json
{
  "scripts": {
    "env:check": "npx fixup-env check",
    "env:sync": "npx fixup-env sync --write-example",
    "env:types": "npx fixup-env types",
    "postinstall": "npx fixup-env check --ci || true"
  }
}
```

## Output Examples

### Human-readable (TTY)
```
✓ Environment validation passed

Files checked:
  • .env
  • .env.local

Summary: 5 keys checked
```

### JSON (CI)
```json
{
  "ok": true,
  "errors": [],
  "warnings": [],
  "files": [".env", ".env.local"],
  "stats": {
    "checked": 5,
    "missing": 0,
    "deprecated": 0,
    "unknown": 0
  }
}
```

## Security

- **No secret logging**: Secret values are never printed to stdout
- **Redacted output**: Secret values are shown as `<redacted>` in JSON output
- **Gitignore check**: Warns if `.env` files aren't ignored

## Supported Types

- `string` - Basic string values
- `number` - Numeric values
- `int` - Integer values
- `boolean` - Boolean values (true/false, 1/0, yes/no, on/off)
- `url` - Valid URLs
- `email` - Email addresses
- `enum` - Enum values
- `port` - Port numbers (1-65535)

## Configuration

Create `fixup-env.config.ts` for project defaults:

```typescript
export default {
  schema: 'env.schema.ts',
  env: ['.env', '.env.local', '.env.development', '.env.production'],
  exampleFile: '.env.example',
  typesOut: 'env.d.ts',
  pruneExample: false,
};
```

## What the tool does

1. **Validates** environment variables against your schema
2. **Generates** TypeScript types for `process.env`
3. **Synchronizes** your schema to `.env.example`
4. **Checks** if `.env` files are in `.gitignore`
5. **Reports** errors and warnings in TTY or JSON format

## FAQ

### Monorepos
Use workspace-specific schemas:
```bash
npx fixup-env check --schema packages/app/env.schema.ts
```

### Next.js
Add to your `next.config.js`:
```javascript
const { loadEnvConfig } = require('@next/env');

// Load environment variables
loadEnvConfig(process.cwd());

// Then run fixup-env
require('child_process').execSync('npx fixup-env check', { stdio: 'inherit' });
```

### Vite
Add to your `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Your config here
});
```

### Docker
```dockerfile
# Copy schema first
COPY env.schema.ts ./

# Install fixup-env
RUN npm install -g fixup-env

# Check environment
RUN fixup-env check --ci
```

### .gitignore Tips
Make sure your `.gitignore` includes:
```
.env
.env.*
.env.local
```

## License

PolyForm Internal Use 1.0.0 © Fixup

This software is licensed under the PolyForm Internal Use License 1.0.0. This license allows internal use within your organization but prohibits redistribution, resale, or hosting for third parties.
