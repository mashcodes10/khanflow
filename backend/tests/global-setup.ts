// This runs BEFORE any test files are loaded
// Import reflect-metadata FIRST before anything else
import 'reflect-metadata';

async function setup() {
  // Global setup runs before all tests
  // reflect-metadata is now loaded before any entities are imported
}

export default setup;
