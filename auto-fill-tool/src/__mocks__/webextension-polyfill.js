/**
 * Chrome Extension API Mock for Jest
 */

// Global mock storage that can be accessed by tests
const mockStorage = global.mockBrowserStorage || new Map();

const chrome = {
  storage: {
    local: {
      get: jest.fn((keys) => {
        return new Promise((resolve) => {
          if (typeof keys === 'string') {
            const value = mockStorage.get(keys);
            resolve({ [keys]: value });
          } else if (Array.isArray(keys)) {
            const result = {};
            keys.forEach(key => {
              result[key] = mockStorage.get(key);
            });
            resolve(result);
          } else if (keys === null || keys === undefined) {
            // Get all items
            const result = {};
            for (const [key, value] of mockStorage.entries()) {
              result[key] = value;
            }
            resolve(result);
          } else {
            resolve({});
          }
        });
      }),
      set: jest.fn((items) => {
        return new Promise((resolve) => {
          Object.keys(items).forEach(key => {
            mockStorage.set(key, items[key]);
          });
          resolve();
        });
      }),
      remove: jest.fn((keys) => {
        return new Promise((resolve) => {
          if (typeof keys === 'string') {
            mockStorage.delete(keys);
          } else if (Array.isArray(keys)) {
            keys.forEach(key => mockStorage.delete(key));
          }
          resolve();
        });
      }),
      clear: jest.fn(() => {
        return new Promise((resolve) => {
          mockStorage.clear();
          resolve();
        });
      })
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  },
  tabs: {
    create: jest.fn(),
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};

// Make chrome available globally
global.chrome = chrome;

module.exports = chrome;
