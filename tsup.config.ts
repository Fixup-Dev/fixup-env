import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  minify: false,
  sourcemap: true,
  target: 'node18',
  outDir: 'dist',
  splitting: false,
  bundle: false,
  external: ['zod', 'dotenv', 'commander', 'kleur', 'fast-glob', 'fs-extra']
});
