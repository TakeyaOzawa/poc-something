/**
 * Jest Setup File
 * webextension-polyfill is mocked automatically by __mocks__/webextension-polyfill.js
 */

// Shared storage Map for all tests - can be accessed and cleared by test files
global.mockBrowserStorage = new Map();

// Mock window.alert for all tests (jsdom doesn't implement it)
global.alert = jest.fn();

// Add TextEncoder/TextDecoder polyfill for Node.js environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add Web Crypto API polyfill for Node.js environment
const nodeCrypto = require('crypto');
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr) => nodeCrypto.randomFillSync(arr),
    subtle: nodeCrypto.webcrypto.subtle,
  },
  writable: true,
  configurable: true,
});

// Mock uuid module with incrementing IDs
let uuidCounter = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => {
    uuidCounter++;
    return `test-uuid-${uuidCounter.toString().padStart(4, '0')}-5678-90ab-cdef12345678`;
  }),
}));
