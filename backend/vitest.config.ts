// Import reflect-metadata FIRST before anything else
import 'reflect-metadata';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: ['./tests/global-setup.ts'],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    // Use server.deps.inline instead of deprecated deps.inline
    server: {
      deps: {
        inline: ['reflect-metadata'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Ensure TypeScript (including enums) is fully compiled, not just stripped
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        target: 'ES2021',
        module: 'commonjs',
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        esModuleInterop: true,
      },
    },
  },
});
