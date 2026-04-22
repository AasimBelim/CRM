// Test environment setup
import { jest } from '@jest/globals';
import { config } from 'dotenv';

// Load development environment variables
config({ path: '.env.development' });

// Set development environment for tests
process.env.NODE_ENV = 'development';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Global test utilities can be added here
