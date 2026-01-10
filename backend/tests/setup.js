// backend/tests/setup.js

/**
 * Jest test configuration and setup
 * This file runs before each test file
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Silence console during tests (optional - comment out for debugging)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
// };

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Add cleanup logic here if needed
  // e.g., close database connections, clear caches
});
