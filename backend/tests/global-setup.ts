// This runs BEFORE any test files are loaded.
// Import reflect-metadata FIRST before anything else.
import "reflect-metadata";

// Vitest expects the default export to be an async function
export default async function setup() {
  // Global setup runs before all tests.
  // reflect-metadata is now loaded before any entities are imported.
}
