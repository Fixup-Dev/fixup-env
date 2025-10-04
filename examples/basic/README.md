# Basic Example

This example shows how to use fixup-env with a simple TypeScript schema.

## Setup

1. Install fixup-env:
   ```bash
   pnpm add -D fixup-env
   ```

2. Create your schema file (`env.schema.ts`):
   ```typescript
   import { z } from 'zod';
   
   export default z.object({
     NODE_ENV: z.enum(['development', 'test', 'production']).describe('Runtime mode'),
     API_URL: z.string().url().describe('Public API endpoint'),
     PORT: z.number().int().min(1).max(65535).default(3000).describe('HTTP port'),
   });
   ```

3. Create your environment file (`.env`):
   ```
   NODE_ENV=development
   API_URL=https://api.example.com
   PORT=3000
   ```

## Usage

- **Check environment variables**: `fixup-env check`
- **Sync to .env.example**: `fixup-env sync --write-example`
- **Generate types**: `fixup-env types`
- **Explain a key**: `fixup-env explain API_URL`

## CI Integration

Add to your GitHub Actions workflow:

```yaml
- name: Check environment variables
  run: fixup-env check --ci
```
