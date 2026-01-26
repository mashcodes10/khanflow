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
    pool: 'forks', // Use forks to avoid ESM/CommonJS conflicts
    poolOptions: {
      forks: {
        singleFork: false,
        isolate: true,
      },
    },
    // Reduce parallelism for integration tests to avoid database deadlocks
    fileParallelism: false,
    // Output test results for CI/CD
    reporters: process.env.CI 
      ? ['verbose', 'junit']
      : ['verbose'],
    outputFile: process.env.CI ? {
      junit: './test-results/junit.xml',
    } : undefined,
    // Use server.deps.inline instead of deprecated deps.inline
    server: {
      deps: {
        inline: ['reflect-metadata'],
        external: ['typeorm'], // Don't transform typeorm - use it as-is
      },
    },
    // Ensure all TypeScript files are transformed
    transformMode: {
      web: [/\.[jt]sx?$/],
      ssr: [/\.[jt]sx?$/],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Ensure TypeScript (including enums) is fully compiled, not just stripped
  esbuild: {
    target: 'node20',
    keepNames: true,
    tsconfigRaw: {
      compilerOptions: {
        target: 'ES2021',
        // Don't override module - let tsconfig.json handle it
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        esModuleInterop: true,
        isolatedModules: false, // Allow enums to be transformed
        skipLibCheck: true,
      },
    },
  },
});
